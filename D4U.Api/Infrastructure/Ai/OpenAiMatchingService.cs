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
    ILogger<OpenAiMatchingService> logger) : IAiMatchingReranker
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<AiMatchingRerankerResponse> RerankAsync(
        AiMatchingRerankerRequest request,
        CancellationToken cancellationToken = default)
    {
        var options = aiOptions.Value;
        if (string.IsNullOrWhiteSpace(options.ApiKey))
        {
            return await HandleFallbackAsync(
                request,
                "Đang dùng chế độ gợi ý dự phòng vì OpenAI chưa được cấu hình.",
                cancellationToken);
        }

        try
        {
            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "responses");
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", options.ApiKey);
            httpRequest.Content = JsonContent.Create(BuildRequestPayload(request, options.Model));

            using var response = await httpClient.SendAsync(httpRequest, cancellationToken);
            var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "OpenAI AI matching rerank failed with status {StatusCode}: {Response}",
                    response.StatusCode,
                    responseJson);

                return await HandleFallbackAsync(
                    request,
                    "Đang tạm thời dùng chế độ gợi ý dự phòng do AI rerank phản hồi chưa ổn định.",
                    cancellationToken);
            }

            var outputText = ExtractOutputText(responseJson);
            var suggestion = JsonSerializer.Deserialize<OpenAiMatchingResponse>(outputText, SerializerOptions)
                ?? throw new InvalidOperationException("OpenAI returned an empty matching payload.");

            ValidateSuggestion(suggestion, request.Candidates);

            return new AiMatchingRerankerResponse(
                "OpenAI",
                suggestion.Warnings.Where(value => !string.IsNullOrWhiteSpace(value)).Distinct().ToList(),
                suggestion.Recommendations
                    .Take(request.MaxResults)
                    .Select(value => new AiMatchingRerankedCandidate(
                        value.StudentProfileId,
                        Math.Clamp(value.MatchScore, 1, 100),
                        value.Reasons.Where(reason => !string.IsNullOrWhiteSpace(reason)).Distinct().Take(4).ToList(),
                        value.MissingDataWarnings.Where(warning => !string.IsNullOrWhiteSpace(warning)).Distinct().Take(4).ToList(),
                        value.FitWarnings.Where(warning => !string.IsNullOrWhiteSpace(warning)).Distinct().Take(4).ToList()))
                    .ToList());
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "OpenAI AI matching rerank failed for project {ProjectId}.", request.Project.ProjectId);
            return await HandleFallbackAsync(
                request,
                "Đang tạm thời dùng chế độ gợi ý dự phòng để tránh gián đoạn trải nghiệm.",
                cancellationToken);
        }
    }

    private async Task<AiMatchingRerankerResponse> HandleFallbackAsync(
        AiMatchingRerankerRequest request,
        string warning,
        CancellationToken cancellationToken)
    {
        if (!aiOptions.Value.FallbackToMock)
        {
            throw new InvalidOperationException(warning);
        }

        var fallback = await fallbackService.RerankAsync(request, cancellationToken);
        return fallback with
        {
            Warnings = fallback.Warnings.Concat([warning]).Distinct().ToList()
        };
    }

    private static object BuildRequestPayload(AiMatchingRerankerRequest request, string model)
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
                        mode = request.Mode,
                        maxResults = request.MaxResults,
                        project = request.Project,
                        candidates = request.Candidates.Select(candidate => new
                        {
                            candidate.StudentProfileId,
                            candidate.StudentFullName,
                            candidate.School,
                            candidate.Major,
                            candidate.Bio,
                            candidate.VerificationStatus,
                            candidate.AverageRating,
                            candidate.CompletedProjectsCount,
                            candidate.HasAppliedToProject,
                            candidate.ProposedPrice,
                            candidate.BaseScore,
                            candidate.MatchTier,
                            candidate.Reasons,
                            candidate.ReasonGroups,
                            candidate.MissingDataWarnings,
                            candidate.FitWarnings,
                            candidate.MatchedSkillNames,
                            candidate.MatchedPortfolioHighlights,
                            candidate.ProfileCompleteness
                        }),
                    }, SerializerOptions)
                }
            },
            text = new
            {
                format = new
                {
                    type = "json_schema",
                    name = "d4u_sme_student_matching_v2",
                    strict = true,
                    schema = BuildResponseSchema()
                }
            },
            max_output_tokens = 2200
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
                    maxItems = 15,
                    items = new
                    {
                        type = "object",
                        additionalProperties = false,
                        required = new[] { "studentProfileId", "matchScore", "reasons", "missingDataWarnings", "fitWarnings" },
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
                            ["missingDataWarnings"] = new
                            {
                                type = "array",
                                items = new { type = "string" }
                            },
                            ["fitWarnings"] = new
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
        IReadOnlyList<MatchingCandidateEvaluation> candidates)
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
        IReadOnlyList<string> MissingDataWarnings,
        IReadOnlyList<string> FitWarnings);

    private const string SystemPrompt =
        """
        Ban la AI Matching cho D4U.

        Nhiem vu:
        - Rerank nhe top candidate cho project cua SME.
        - Khong tu dong moi, khong tu dong chon, khong tu dong bao gia.
        - Du lieu base score va reason groups da co san; ban chi duoc phep tinh chinh score va viet lai ly do ngan gon, ro nghia.
        - Uu tien do khop category, ky nang, portfolio cong khai, tin hieu da ung tuyen, va muc do day du ho so.
        - Neu du lieu con thieu, dua vao missingDataWarnings thay vi suy doan.
        - Luon tra ve JSON hop le theo schema.
        - Viet reasons va warnings bang tieng Viet co dau.
        """;
}
