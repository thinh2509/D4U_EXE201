namespace D4U.Api.Infrastructure.Ai;

using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using D4U.Api.Application.Features.Ai;
using Microsoft.Extensions.Options;

public sealed class OpenAiProposalGenerator(
    HttpClient httpClient,
    IOptions<AiOptions> aiOptions,
    MockAiProposalGenerator fallbackGenerator,
    ILogger<OpenAiProposalGenerator> logger) : IAiProposalGenerator
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<AiProposalGeneratorResponse> GenerateAsync(
        AiProposalGeneratorRequest request,
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
                    "OpenAI proposal writer request failed with status {StatusCode}: {Response}",
                    response.StatusCode,
                    responseJson);

                return HandleFallback(request, "OpenAI đang không phản hồi thành công; hệ thống đã dùng fallback tiếng Việt.");
            }

            var outputText = ExtractOutputText(responseJson);
            var proposal = JsonSerializer.Deserialize<AiProposalGeneratorResponse>(outputText, SerializerOptions)
                ?? throw new InvalidOperationException("OpenAI returned an empty proposal payload.");

            ValidateProposal(proposal);

            return proposal with
            {
                Provider = "OpenAI",
                Warnings = proposal.Warnings ?? []
            };
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "OpenAI proposal generation failed.");
            return HandleFallback(request, "OpenAI gặp lỗi khi tạo proposal; hệ thống đã dùng fallback tiếng Việt.");
        }
    }

    private AiProposalGeneratorResponse HandleFallback(
        AiProposalGeneratorRequest request,
        string reason)
    {
        if (!aiOptions.Value.FallbackToMock)
        {
            throw new InvalidOperationException(reason);
        }

        return fallbackGenerator.GenerateFallback(request, "MockFallback", reason);
    }

    private static object BuildRequestPayload(AiProposalGeneratorRequest request, string model)
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
                    content = JsonSerializer.Serialize(request, SerializerOptions)
                }
            },
            text = new
            {
                format = new
                {
                    type = "json_schema",
                    name = "d4u_student_ai_proposal_writer",
                    strict = true,
                    schema = BuildResponseSchema()
                }
            },
            max_output_tokens = 1400
        };
    }

    private static object BuildResponseSchema()
    {
        return new
        {
            type = "object",
            additionalProperties = false,
            required = new[] { "proposalText", "strengths", "warnings", "provider" },
            properties = new Dictionary<string, object>
            {
                ["proposalText"] = new
                {
                    type = "string",
                    minLength = 20,
                    maxLength = 3000
                },
                ["strengths"] = new
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

    private static void ValidateProposal(AiProposalGeneratorResponse proposal)
    {
        if (string.IsNullOrWhiteSpace(proposal.ProposalText) ||
            proposal.ProposalText.Trim().Length is < 20 or > 3000)
        {
            throw new InvalidOperationException("OpenAI proposal response is missing required content.");
        }

        if (proposal.Strengths.Count == 0)
        {
            throw new InvalidOperationException("OpenAI proposal response is missing strengths.");
        }
    }

    private const string SystemPrompt =
        """
        Bạn là AI Proposal Writer cho D4U, một marketplace kết nối SME với Student Designer.

        Nhiệm vụ:
        - Viết proposal ứng tuyển bằng tiếng Việt cho Student khi ứng tuyển vào dự án thật của SME.
        - Proposal phải ngắn gọn, đáng tin, có thể chỉnh sửa tiếp bởi Student trước khi gửi.
        - Không được tự động nộp ứng tuyển, không được thay Student cam kết những điều không có trong dữ liệu.
        - Không được bịa thêm kinh nghiệm, khách hàng, hay thành tích không có trong profile/skills/portfolio.
        - Không đưa ra đàm phán giá mới hoặc điều khoản hợp đồng ngoài brief hiện có.
        - Bám sát project brief, design category, ngân sách, mốc sketch/final, kỹ năng, portfolio và bio của Student.
        - Ưu tiên giọng văn lịch sự, chủ động, chuyên nghiệp, phù hợp bối cảnh Student ứng tuyển dự án thiết kế.

        Yêu cầu đầu ra:
        - proposalText dài khoảng 120-220 từ, luôn dưới 3000 ký tự.
        - strengths là các điểm mạnh ngắn gọn giải thích vì sao Student phù hợp với dự án.
        - warnings chỉ dùng khi dữ liệu đầu vào còn thiếu, không dùng để giải thích nội bộ hệ thống.
        - Luôn trả JSON hợp lệ theo schema.
        """;
}
