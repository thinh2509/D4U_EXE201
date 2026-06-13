namespace D4U.Api.Infrastructure.Ai;

using System.Text;
using D4U.Api.Application.Features.Ai;
using Microsoft.Extensions.Options;

public sealed class MockAiProposalGenerator(IOptions<AiOptions> aiOptions) : IAiProposalGenerator
{
    public Task<AiProposalGeneratorResponse> GenerateAsync(
        AiProposalGeneratorRequest request,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(GenerateFallback(request, aiOptions.Value.Provider));
    }

    public AiProposalGeneratorResponse GenerateFallback(
        AiProposalGeneratorRequest request,
        string provider = "MockFallback",
        string? fallbackReason = null)
    {
        var strengths = BuildStrengths(request);
        var warnings = BuildWarnings(request, fallbackReason);

        var builder = new StringBuilder();
        builder.Append("Chào anh/chị, em đã xem kỹ brief ");
        builder.Append(request.Project.Title.Trim());
        builder.Append(" và tin rằng mình có thể đóng góp tốt cho dự án này. ");
        builder.Append("Điểm mạnh của em phù hợp với nhóm công việc ");
        builder.Append(request.Project.DesignCategoryName.Trim());
        builder.Append(", đồng thời em có thể bám sát ngân sách ");
        builder.Append(FormatCurrency(request.Project.BudgetAmount, request.Project.Currency));
        builder.Append(" và các mốc deadline đã công bố.");
        builder.AppendLine();
        builder.AppendLine();
        builder.Append("Về năng lực, em hiện có nền tảng từ ");
        builder.Append(request.Student.School.Trim());
        builder.Append(" chuyên ngành ");
        builder.Append(request.Student.Major.Trim());
        builder.Append(". ");
        if (!string.IsNullOrWhiteSpace(request.Student.SkillsSummary) &&
            !request.Student.SkillsSummary.Contains("chưa khai báo", StringComparison.OrdinalIgnoreCase))
        {
            builder.Append("Các kỹ năng em có thể áp dụng trực tiếp cho dự án gồm ");
            builder.Append(request.Student.SkillsSummary.Trim());
            builder.Append(". ");
        }

        if (request.Student.RelatedSkills.Count > 0)
        {
            builder.Append("Riêng với danh mục này, em đã có các kỹ năng liên quan như ");
            builder.Append(string.Join(", ", request.Student.RelatedSkills));
            builder.Append(". ");
        }
        builder.AppendLine();
        builder.AppendLine();
        if (!string.IsNullOrWhiteSpace(request.Student.FeaturedPortfolioSummary) &&
            !request.Student.FeaturedPortfolioSummary.Contains("chưa có", StringComparison.OrdinalIgnoreCase))
        {
            builder.Append("Portfolio nổi bật của em gồm ");
            builder.Append(request.Student.FeaturedPortfolioSummary.Trim());
            builder.Append(", nên em có thể tiếp cận brief theo hướng thực tế và dễ trao đổi với SME. ");
        }
        else if (!string.IsNullOrWhiteSpace(request.Student.PortfolioSummary) &&
                 !request.Student.PortfolioSummary.Contains("chưa có", StringComparison.OrdinalIgnoreCase))
        {
            builder.Append("Em đã có một số portfolio công khai liên quan, giúp em hình dung rõ cách triển khai output cho dự án này. ");
        }

        builder.Append("Nếu được chọn, em sẽ chủ động trao đổi rõ yêu cầu ngay từ đầu, gửi bản sketch đúng hạn vào ");
        builder.Append(FormatDate(request.Project.SketchDeadlineAt));
        builder.Append(" và tiếp tục hoàn thiện bản final theo phản hồi của anh/chị trước mốc ");
        builder.Append(FormatDate(request.Project.FinalDeadlineAt));
        builder.Append(". ");
        builder.Append("Em cũng sẵn sàng cập nhật phương án nhanh, rõ ràng và bám sát mục tiêu sử dụng thực tế của dự án.");

        return new AiProposalGeneratorResponse(
            builder.ToString().Trim(),
            strengths,
            warnings,
            provider);
    }

    private static IReadOnlyList<string> BuildStrengths(AiProposalGeneratorRequest request)
    {
        var strengths = new List<string>();

        if (request.Student.RelatedSkills.Count > 0)
        {
            strengths.Add($"Có kỹ năng liên quan trực tiếp đến {request.Project.DesignCategoryName}: {string.Join(", ", request.Student.RelatedSkills.Take(3))}.");
        }

        if (request.Student.HighlightedSkills.Count > 0)
        {
            strengths.Add($"Có kỹ năng nổi bật: {string.Join(", ", request.Student.HighlightedSkills.Take(3))}.");
        }

        if (!string.IsNullOrWhiteSpace(request.Student.FeaturedPortfolioSummary) &&
            !request.Student.FeaturedPortfolioSummary.Contains("chưa có", StringComparison.OrdinalIgnoreCase))
        {
            strengths.Add("Có portfolio nổi bật để SME tham chiếu trước khi chọn Student.");
        }

        if (request.Student.CompletedProjectsCount > 0)
        {
            strengths.Add($"Đã hoàn thành {request.Student.CompletedProjectsCount} dự án trên nền tảng.");
        }

        if (request.Student.AverageRating > 0)
        {
            strengths.Add($"Có điểm đánh giá trung bình {request.Student.AverageRating:0.00}.");
        }

        return strengths.Count == 0
            ? ["Có thể bám sát brief và điều chỉnh proposal theo phản hồi của SME."]
            : strengths.Take(4).ToList();
    }

    private static IReadOnlyList<string> BuildWarnings(
        AiProposalGeneratorRequest request,
        string? fallbackReason)
    {
        var warnings = new List<string>();

        if (!string.IsNullOrWhiteSpace(fallbackReason))
        {
            warnings.Add(fallbackReason);
        }

        if (request.Student.SkillsSummary.Contains("chưa khai báo", StringComparison.OrdinalIgnoreCase))
        {
            warnings.Add("Student chưa khai báo nhiều kỹ năng, proposal đang dựa nhiều vào hồ sơ cơ bản.");
        }

        if (request.Student.PortfolioSummary.Contains("chưa có", StringComparison.OrdinalIgnoreCase))
        {
            warnings.Add("Student chưa có nhiều portfolio công khai nên AI chỉ tham chiếu hồ sơ và kỹ năng hiện có.");
        }

        return warnings;
    }

    private static string FormatCurrency(decimal amount, string currency)
    {
        return $"{amount:N0} {currency}".Replace(",", ".");
    }

    private static string FormatDate(DateTimeOffset value)
    {
        return value.ToLocalTime().ToString("dd/MM/yyyy");
    }
}
