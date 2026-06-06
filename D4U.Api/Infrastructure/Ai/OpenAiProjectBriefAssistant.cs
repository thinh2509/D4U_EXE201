namespace D4U.Api.Infrastructure.Ai;

using System.Net.Http.Headers;
using System.Text.Json;
using System.Net.Http.Json;
using D4U.Api.Application.Features.Ai;
using Microsoft.Extensions.Options;

public sealed class OpenAiProjectBriefAssistant(
    HttpClient httpClient,
    IOptions<AiOptions> aiOptions,
    MockAiProjectBriefAssistant fallbackAssistant,
    ILogger<OpenAiProjectBriefAssistant> logger) : IAiProjectBriefAssistant
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<AiProjectBriefAssistantResponse> GenerateAsync(
        AiProjectBriefAssistantRequest request,
        CancellationToken cancellationToken = default)
    {
        var options = aiOptions.Value;

        if (string.IsNullOrWhiteSpace(options.ApiKey))
        {
            return HandleFallback(request, "OpenAI chưa được cấu hình API key; hệ thống đã dùng fallback tiếng Việt.");
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
                    "OpenAI project brief request failed with status {StatusCode}: {Response}",
                    response.StatusCode,
                    responseJson);

                return HandleFallback(request, "OpenAI đang không phản hồi thành công; hệ thống đã dùng fallback tiếng Việt.");
            }

            var outputText = ExtractOutputText(responseJson);
            var suggestion = JsonSerializer.Deserialize<AiProjectBriefAssistantResponse>(outputText, SerializerOptions)
                ?? throw new InvalidOperationException("OpenAI returned an empty project brief payload.");

            ValidateSuggestion(suggestion);

            return suggestion with
            {
                Provider = "OpenAI",
                Warnings = suggestion.Warnings ?? []
            };
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "OpenAI project brief generation failed.");
            return HandleFallback(request, "OpenAI gặp lỗi khi generate brief; hệ thống đã dùng fallback tiếng Việt.");
        }
    }

    private AiProjectBriefAssistantResponse HandleFallback(
        AiProjectBriefAssistantRequest request,
        string reason)
    {
        if (!aiOptions.Value.FallbackToMock)
        {
            throw new InvalidOperationException(reason);
        }

        return fallbackAssistant.GenerateVietnameseFallback(request, "MockFallback", reason);
    }

    private static object BuildRequestPayload(
        AiProjectBriefAssistantRequest request,
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
                        request.RawIdea,
                        request.BusinessField,
                        request.TargetAudience,
                        request.PreferredStyle,
                        request.BudgetAmount,
                        request.TotalDeadline
                    }, SerializerOptions)
                }
            },
            text = new
            {
                format = new
                {
                    type = "json_schema",
                    name = "d4u_project_brief_assistant",
                    strict = true,
                    schema = BuildResponseSchema()
                }
            },
            max_output_tokens = 1800
        };
    }

    private static object BuildResponseSchema()
    {
        var nullableDateTime = new
        {
            anyOf = new object[]
            {
                new { type = "string", description = "ISO 8601 datetime with timezone." },
                new { type = "null" }
            }
        };

        return new
        {
            type = "object",
            additionalProperties = false,
            required = new[]
            {
                "suggestedTitle",
                "suggestedBrief",
                "suggestedUsagePurpose",
                "suggestedDeliverables",
                "suggestedCategoryHint",
                "suggestedSketchDeadline",
                "suggestedFinalDeadline",
                "deadlineNotes",
                "warnings",
                "provider"
            },
            properties = new Dictionary<string, object>
            {
                ["suggestedTitle"] = new { type = "string" },
                ["suggestedBrief"] = new { type = "string" },
                ["suggestedUsagePurpose"] = new { type = "string" },
                ["suggestedDeliverables"] = new
                {
                    type = "array",
                    minItems = 3,
                    maxItems = 8,
                    items = new { type = "string" }
                },
                ["suggestedCategoryHint"] = new
                {
                    type = "string",
                    @enum = new[]
                    {
                        "Logo & Brand Identity",
                        "Social Media Design",
                        "Packaging Design",
                        "UI/UX Design",
                        "Print Design",
                        "Illustration"
                    }
                },
                ["suggestedSketchDeadline"] = nullableDateTime,
                ["suggestedFinalDeadline"] = nullableDateTime,
                ["deadlineNotes"] = new
                {
                    type = "array",
                    items = new { type = "string" }
                },
                ["warnings"] = new
                {
                    type = "array",
                    items = new { type = "string" }
                },
                ["provider"] = new { type = "string" }
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

    private static void ValidateSuggestion(AiProjectBriefAssistantResponse suggestion)
    {
        if (string.IsNullOrWhiteSpace(suggestion.SuggestedTitle) ||
            string.IsNullOrWhiteSpace(suggestion.SuggestedBrief) ||
            string.IsNullOrWhiteSpace(suggestion.SuggestedUsagePurpose) ||
            suggestion.SuggestedDeliverables.Count == 0)
        {
            throw new InvalidOperationException("OpenAI project brief response is missing required content.");
        }

        var requiredSections = new[]
        {
            "Bối cảnh",
            "Mục tiêu thiết kế",
            "Khách hàng mục tiêu",
            "Phong cách mong muốn",
            "Yêu cầu nội dung/hình ảnh",
            "Tiêu chí nghiệm thu",
            "Lưu ý cho Student Designer"
        };

        if (requiredSections.Any(section =>
                !suggestion.SuggestedBrief.Contains(section, StringComparison.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException("OpenAI project brief response is missing required Vietnamese sections.");
        }
    }

    private const string SystemPrompt =
        """
        Bạn là trợ lý AI viết project brief cho D4U, một marketplace kết nối SME Việt Nam với Student Designer.

        Nhiệm vụ:
        - Luôn trả lời 100% bằng tiếng Việt, trừ tên category bắt buộc trong suggestedCategoryHint.
        - Biến ý tưởng thô của SME thành project brief rõ ràng, cụ thể và có thể chỉnh sửa.
        - Bám sát rawIdea, businessField, targetAudience, preferredStyle, budgetAmount và totalDeadline nếu có.
        - Không tự publish dự án, không chọn Student, không định giá cuối cùng, không bypass subscription/deadline rules.
        - Không dùng câu chung chung như "thiết kế chuyên nghiệp" nếu không giải thích cụ thể chuyên nghiệp ở điểm nào.

        suggestedBrief bắt buộc gồm đúng các mục:
        Bối cảnh
        Mục tiêu thiết kế
        Khách hàng mục tiêu
        Phong cách mong muốn
        Yêu cầu nội dung/hình ảnh
        Tiêu chí nghiệm thu
        Lưu ý cho Student Designer

        suggestedDeliverables phải cụ thể, có số lượng hoặc định dạng khi hợp lý, ví dụ PNG/JPG/PDF, file nguồn, biến thể màu, số màn hình, số template.
        Nếu thiếu thông tin quan trọng, thêm vào warnings nhưng vẫn tạo brief hữu ích.
        """;
}
