namespace D4U.Api.Application.Features.Ai;

using D4U.Api.Application.Features.Students;
using D4U.Api.Domain.Entities;

internal sealed class MatchingScoringService : IMatchingScoringService
{
    public MatchingCandidateEvaluation Evaluate(
        Project project,
        string? designCategoryName,
        MatchingCandidateInput candidate)
    {
        var applicationReasons = new List<string>();
        var trustReasons = new List<string>();
        var skillReasons = new List<string>();
        var portfolioReasons = new List<string>();
        var missingDataWarnings = new List<string>();
        var fitWarnings = new List<string>();

        var capability = candidate.CapabilitySummary;
        var matchedSkillNames = capability.RelatedSkillsByCategory
            .Select(skill => skill.SkillName)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(6)
            .ToList();

        if (matchedSkillNames.Count == 0)
        {
            matchedSkillNames = capability.HighlightedSkills
                .Select(skill => skill.SkillName)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(4)
                .ToList();
        }

        var matchedPortfolioHighlights = capability.PublicPortfolio
            .Where(item => item.DesignCategoryId == project.DesignCategoryId || item.IsFeatured)
            .Select(item => string.IsNullOrWhiteSpace(item.DesignCategoryName) ? item.Title : $"{item.Title} ({item.DesignCategoryName})")
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(3)
            .ToList();

        var applicationScore = 0;
        if (candidate.HasAppliedToProject)
        {
            applicationScore += 18;
            applicationReasons.Add("Đã chủ động ứng tuyển vào dự án này.");
        }

        if (candidate.ProposedPrice.HasValue && project.BudgetAmount > 0)
        {
            var delta = Math.Abs(project.BudgetAmount - candidate.ProposedPrice.Value);
            var ratio = delta / project.BudgetAmount;

            if (ratio <= 0.1m)
            {
                applicationScore += 6;
                applicationReasons.Add("Mức giá đề xuất gần với ngân sách của dự án.");
            }
            else if (ratio <= 0.25m)
            {
                applicationScore += 3;
                applicationReasons.Add("Mức giá đề xuất nằm trong khoảng có thể xem xét.");
            }
            else
            {
                fitWarnings.Add("Mức giá đề xuất hiện tại lệch khá xa so với ngân sách dự án.");
            }
        }

        var trustScore = 0;
        if (string.Equals(candidate.VerificationStatus, "APPROVED", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(candidate.VerificationStatus, "VERIFIED", StringComparison.OrdinalIgnoreCase))
        {
            trustScore += 10;
            trustReasons.Add("Hồ sơ sinh viên đã được xác thực.");
        }

        if (candidate.AverageRating > 0)
        {
            var ratingScore = (int)Math.Min(12m, Math.Round(candidate.AverageRating * 2.4m, MidpointRounding.AwayFromZero));
            trustScore += ratingScore;
            trustReasons.Add($"Điểm đánh giá trung bình {candidate.AverageRating:0.0}.");
        }

        if (candidate.CompletedProjectsCount > 0)
        {
            trustScore += Math.Min(10, candidate.CompletedProjectsCount * 2);
            trustReasons.Add($"Đã hoàn thành {candidate.CompletedProjectsCount} dự án.");
        }

        var capabilityScore = 0;
        if (matchedSkillNames.Count > 0)
        {
            capabilityScore += Math.Min(18, matchedSkillNames.Count * 5);
            skillReasons.Add($"Có kỹ năng liên quan: {string.Join(", ", matchedSkillNames.Take(4))}.");
        }
        else if (capability.PublicSkills.Count > 0)
        {
            skillReasons.Add("Đã khai báo kỹ năng, nhưng chưa có nhiều kỹ năng gần với nhóm thiết kế của dự án.");
            fitWarnings.Add($"Kỹ năng hiện có chưa thể hiện rõ độ khớp với {designCategoryName ?? "nhóm thiết kế"}.");
        }
        else
        {
            missingDataWarnings.Add("Sinh viên chưa khai báo kỹ năng.");
        }

        var highlightedSkillCount = capability.HighlightedSkills
            .Select(skill => skill.SkillName)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Count(skillName => matchedSkillNames.Contains(skillName, StringComparer.OrdinalIgnoreCase));

        if (highlightedSkillCount > 0)
        {
            capabilityScore += Math.Min(6, highlightedSkillCount * 3);
            skillReasons.Add("Có kỹ năng nổi bật trùng với nhu cầu của dự án.");
        }

        var categoryPortfolioCount = capability.PublicPortfolio.Count(item => item.DesignCategoryId == project.DesignCategoryId);
        if (categoryPortfolioCount > 0)
        {
            capabilityScore += Math.Min(16, categoryPortfolioCount * 6);
            portfolioReasons.Add($"Có {categoryPortfolioCount} portfolio công khai cùng nhóm thiết kế.");
        }
        else if (capability.PublicPortfolio.Count > 0)
        {
            portfolioReasons.Add("Có portfolio công khai để tham khảo thêm.");
        }
        else
        {
            missingDataWarnings.Add("Sinh viên chưa có portfolio công khai.");
        }

        var featuredPortfolioCount = capability.FeaturedPortfolio.Count(item => item.DesignCategoryId == project.DesignCategoryId || item.IsFeatured);
        if (featuredPortfolioCount > 0)
        {
            capabilityScore += Math.Min(8, featuredPortfolioCount * 4);
            portfolioReasons.Add("Portfolio nổi bật cung cấp thêm bằng chứng về năng lực.");
        }

        var completenessSignals = 0;
        if (!string.IsNullOrWhiteSpace(candidate.Bio))
        {
            completenessSignals++;
        }
        else
        {
            missingDataWarnings.Add("Sinh viên chưa có phần giới thiệu cá nhân.");
        }

        if (capability.PublicSkills.Count > 0)
        {
            completenessSignals++;
        }

        if (capability.HighlightedSkills.Count > 0)
        {
            completenessSignals++;
        }

        if (capability.PublicPortfolio.Count > 0)
        {
            completenessSignals++;
        }

        if (capability.FeaturedPortfolio.Count > 0)
        {
            completenessSignals++;
        }

        var profileCompleteness = completenessSignals * 20;
        var completenessScore = profileCompleteness switch
        {
            >= 100 => 10,
            >= 80 => 8,
            >= 60 => 6,
            >= 40 => 3,
            _ => 0
        };

        var totalScore = Math.Clamp(applicationScore + trustScore + capabilityScore + completenessScore, 1, 100);
        var reasons = skillReasons
            .Concat(portfolioReasons)
            .Concat(trustReasons)
            .Concat(applicationReasons)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(4)
            .ToList();

        if (reasons.Count == 0)
        {
            reasons.Add("Hồ sơ hiện có dữ liệu cơ bản để SME xem xét thêm.");
        }

        return new MatchingCandidateEvaluation(
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
            totalScore,
            ClassifyMatchTier(totalScore),
            reasons,
            new MatchReasonGroupsResponse(
                skillReasons,
                portfolioReasons,
                trustReasons,
                applicationReasons),
            missingDataWarnings.Distinct(StringComparer.OrdinalIgnoreCase).Take(4).ToList(),
            fitWarnings.Distinct(StringComparer.OrdinalIgnoreCase).Take(4).ToList(),
            matchedSkillNames,
            matchedPortfolioHighlights,
            profileCompleteness);
    }

    private static string ClassifyMatchTier(int score)
    {
        if (score >= 85)
        {
            return "STRONG";
        }

        if (score >= 70)
        {
            return "GOOD";
        }

        return "REVIEW";
    }
}
