namespace D4U.Api.Infrastructure.Ai;

using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using D4U.Api.Application.Features.Ai;
using Microsoft.Extensions.Options;

public sealed class OpenAiMatchingService(
    HttpClient httpClient,
    IOptions<AiOptions> aiOptions,
    MockAiMatchingService fallbackService,
    ILogger<OpenAiMatchingService> logger) : IAiMatchingService
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<MatchStudentsForProjectResponse> MatchStudentsForProjectAsync(
        Guid userId,
        Guid projectId,
        MatchStudentsForProjectRequest request,
        CancellationToken cancellationToken = default)
    {
        var options = aiOptions.Value;
        if (string.IsNullOrWhiteSpace(options.ApiKey))
        {
            return await HandleFallbackAsync(
                userId,
                projectId,
                request,
                "OpenAI chưa được cấu hình API key; hệ thống đang dùng matching fallback.",
                cancellationToken);
        }

        var project = await fallbackService.RequireOwnedProjectAsync(userId, projectId, cancellationToken);
        MockAiMatchingService.EnsureProjectSupportsMatching(project);
        await fallbackService.EnsureMatchingEntitlementAsync(userId, cancellationToken);

        var candidates = await fallbackService.LoadCandidatesAsync(projectId, cancellationToken);
        if (candidates.Count == 0)
        {
            return new MatchStudentsForProjectResponse(
                project.Id,
                project.Title,
                "OpenAI",
                ["Chưa có dữ liệu sinh viên phù hợp để gợi ý cho dự án này."],
                []);
        }

        try
        {
            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "responses");
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", options.ApiKey);
            httpRequest.Content = JsonContent.Create(BuildRequestPayload(project, candidates, request, options.Model));

            using var response = await httpClient.SendAsync(httpRequest, cancellationToken);
            var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "OpenAI AI matching request failed with status {StatusCode}: {Response}",
                    response.StatusCode,
                    responseJson);

                return await HandleFallbackAsync(
                    userId,
                    projectId,
                    request,
                    "OpenAI đang không phản hồi thành công; hệ thống đang dùng matching fallback.",
                    cancellationToken);
            }

            var outputText = ExtractOutputText(responseJson);
            var suggestion = JsonSerializer.Deserialize<OpenAiMatchingResponse>(outputText, SerializerOptions)
                ?? throw new InvalidOperationException("OpenAI returned an empty matching payload.");

            ValidateSuggestion(suggestion, candidates);

            var candidateMap = candidates.ToDictionary(value => value.StudentProfileId);
            var recommendations = suggestion.Recommendations
                .Take(Math.Clamp(request.MaxResults ?? 5, 1, 10))
                .Select(value =>
                {
                    var candidate = candidateMap[value.StudentProfileId];
                    return new StudentMatchRecommendationResponse(
                        candidate.StudentProfileId,
                        candidate.StudentUserId,
                        candidate.StudentFullName,
                        candidate.School,
                        candidate.Major,
                        candidate.Bio,
                        candidate.VerificationStatus,
                        candidate.AverageRating,
                        candidate.CompletedProjectsCount,
                        candidate.HasAppliedToProject,
                        candidate.ProposedPrice,
                        Math.Clamp(value.MatchScore, 1, 100),
                        value.Reasons.Where(reason => !string.IsNullOrWhiteSpace(reason)).Distinct().Take(4).ToList(),
                        value.Warnings.Where(warning => !string.IsNullOrWhiteSpace(warning)).Distinct().Take(4).ToList());
                })
                .ToList();

            return new MatchStudentsForProjectResponse(
                project.Id,
                project.Title,
                "OpenAI",
                suggestion.Warnings.Where(warning => !string.IsNullOrWhiteSpace(warning)).Distinct().ToList(),
                recommendations);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "OpenAI AI matching failed for project {ProjectId}.", projectId);
            return await HandleFallbackAsync(
                userId,
                projectId,
                request,
                "OpenAI gặp lỗi khi xếp hạng matching; hệ thống đang dùng fallback để tránh gián đoạn.",
                cancellationToken);
        }
    }

    private async Task<MatchStudentsForProjectResponse> HandleFallbackAsync(
        Guid userId,
        Guid projectId,
        MatchStudentsForProjectRequest request,
        string warning,
        CancellationToken cancellationToken)
    {
        if (!aiOptions.Value.FallbackToMock)
        {
            throw new InvalidOperationException(warning);
        }

        var fallback = await fallbackService.MatchStudentsForProjectAsync(userId, projectId, request, cancellationToken);
        return fallback with
        {
            Warnings = fallback.Warnings.Concat([warning]).Distinct().ToList()
        };
    }

    private static object BuildRequestPayload(
        Domain.Entities.Project project,
        IReadOnlyList<MockAiMatchingService.StudentCandidateModel> candidates,
        MatchStudentsForProjectRequest request,
        string model)
    {
        return new
        {
            model = string.IsNullOrWhiteSpace(model) ? "gpt-5-mini" : model,
            input = new object[]
            {
                new
                {
                    role = "system",
                    content = SystemPrompt
                },
                new
                {
                    role = "user",
                    content = JsonSerializer.Serialize(new
                    {
                        project = new
                        {
                            project.Id,
                            project.Title,
                            project.Brief,
                            project.UsagePurpose,
                            project.BudgetAmount,
                            project.Currency,
                            project.SketchDeadlineAt,
                            project.FinalDeadlineAt,
                            project.TotalDeadlineAt,
                            project.ProjectType,
                            project.Status
                        },
                        maxResults = Math.Clamp(request.MaxResults ?? 5, 1, 10),
                        candidates = candidates.Select(value => new
                        {
                            value.StudentProfileId,
                            value.StudentFullName,
                            value.School,
                            value.Major,
                            value.Bio,
                            value.VerificationStatus,
                            value.AverageRating,
                            value.CompletedProjectsCount,
                            value.HasAppliedToProject,
                            value.ProposedPrice
                        })
                    }, SerializerOptions)
                }
            },
            text = new
            {
                format = new
                {
                    type = "json_schema",
                    name = "d4u_sme_student_matching",
                    strict = true,
                    schema = BuildResponseSchema()
                }
            },
            max_output_tokens = 1800
        };
    }

    private static object BuildResponseSchema()
    {
        return new
        {
            type = "object",
            additionalProperties = false,
            required = new[] { "warnings", "recommendations" },
            properties = new Dictionary<string, object>
            {
                ["warnings"] = new
                {
                    type = "array",
                    items = new { type = "string" }
                },
                ["recommendations"] = new
                {
                    type = "array",
                    minItems = 1,
                    maxItems = 10,
                    items = new
                    {
                        type = "object",
                        additionalProperties = false,
                        required = new[] { "studentProfileId", "matchScore", "reasons", "warnings" },
                        properties = new Dictionary<string, object>
                        {
                            ["studentProfileId"] = new { type = "string", format = "uuid" },
                            ["matchScore"] = new { type = "integer", minimum = 1, maximum = 100 },
                            ["reasons"] = new
                            {
                                type = "array",
                                minItems = 1,
                                maxItems = 4,
                                items = new { type = "string" }
                            },
                            ["warnings"] = new
                            {
                                type = "array",
                                items = new { type = "string" }
                            }
                        }
                    }
                }
            }
        };
    }

    private static string ExtractOutputText(string responseJson)
    {
        using var document = JsonDocument.Parse(responseJson);

        if (document.RootElement.TryGetProperty("output_text", out var outputTextElement) &&
            outputTextElement.ValueKind == JsonValueKind.String)
        {
            return outputTextElement.GetString() ?? string.Empty;
        }

        if (document.RootElement.TryGetProperty("output", out var outputElement) &&
            outputElement.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in outputElement.EnumerateArray())
            {
                if (!item.TryGetProperty("content", out var contentElement) ||
                    contentElement.ValueKind != JsonValueKind.Array)
                {
                    continue;
                }

                foreach (var contentItem in contentElement.EnumerateArray())
                {
                    if (contentItem.TryGetProperty("text", out var textElement) &&
                        textElement.ValueKind == JsonValueKind.String)
                    {
                        return textElement.GetString() ?? string.Empty;
                    }
                }
            }
        }

        throw new InvalidOperationException("OpenAI response did not contain output text.");
    }

    private static void ValidateSuggestion(
        OpenAiMatchingResponse suggestion,
        IReadOnlyList<MockAiMatchingService.StudentCandidateModel> candidates)
    {
        if (suggestion.Recommendations.Count == 0)
        {
            throw new InvalidOperationException("OpenAI matching response did not contain any recommendations.");
        }

        var candidateIds = candidates.Select(value => value.StudentProfileId).ToHashSet();
        foreach (var recommendation in suggestion.Recommendations)
        {
            if (!candidateIds.Contains(recommendation.StudentProfileId))
            {
                throw new InvalidOperationException("OpenAI matching response returned an unknown student profile.");
            }

            if (recommendation.Reasons.Count == 0)
            {
                throw new InvalidOperationException("OpenAI matching response is missing recommendation reasons.");
            }
        }
    }

    private sealed record OpenAiMatchingResponse(
        IReadOnlyList<string> Warnings,
        IReadOnlyList<OpenAiRecommendation> Recommendations);

    private sealed record OpenAiRecommendation(
        Guid StudentProfileId,
        int MatchScore,
        IReadOnlyList<string> Reasons,
        IReadOnlyList<string> Warnings);

    private const string SystemPrompt =
        """
        Bạn là AI Matching cho D4U, một marketplace kết nối SME với Student Designer.

        Nhiệm vụ:
        - Xếp hạng danh sách student phù hợp cho dự án của SME.
        - Chỉ đưa ra gợi ý, không tự động mời, không tự động chọn, không tự động định giá.
        - Luôn trả về JSON hợp lệ theo schema.
        - Sử dụng score 1..100, score cao hơn nghĩa là phù hợp hơn.
        - Ưu tiên candidate đã ứng tuyển, đã xác thực, có rating tốt, có lịch sử hoàn thành dự án, và phù hợp với budget/timeline.
        - Nếu dữ liệu còn thiếu, đưa cảnh báo vào warnings thay vì bịa thêm.
        - Viết reasons/warnings ngắn gọn, rõ nghĩa, bằng tiếng Việt có dấu.
        """;
}
