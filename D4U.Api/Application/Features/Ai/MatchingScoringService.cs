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
            applicationReasons.Add("Da chu dong ung tuyen vao du an nay.");
        }

        if (candidate.ProposedPrice.HasValue && project.BudgetAmount > 0)
        {
            var delta = Math.Abs(project.BudgetAmount - candidate.ProposedPrice.Value);
            var ratio = delta / project.BudgetAmount;

            if (ratio <= 0.1m)
            {
                applicationScore += 6;
                applicationReasons.Add("Muc gia de xuat gan voi budget cua du an.");
            }
            else if (ratio <= 0.25m)
            {
                applicationScore += 3;
                applicationReasons.Add("Muc gia de xuat nam trong vung co the xem xet.");
            }
            else
            {
                fitWarnings.Add("Muc gia de xuat hien tai lech kha xa so voi budget du an.");
            }
        }

        var trustScore = 0;
        if (string.Equals(candidate.VerificationStatus, "APPROVED", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(candidate.VerificationStatus, "VERIFIED", StringComparison.OrdinalIgnoreCase))
        {
            trustScore += 10;
            trustReasons.Add("Ho so student da duoc xac thuc.");
        }

        if (candidate.AverageRating > 0)
        {
            var ratingScore = (int)Math.Min(12m, Math.Round(candidate.AverageRating * 2.4m, MidpointRounding.AwayFromZero));
            trustScore += ratingScore;
            trustReasons.Add($"Diem danh gia trung binh {candidate.AverageRating:0.0}.");
        }

        if (candidate.CompletedProjectsCount > 0)
        {
            trustScore += Math.Min(10, candidate.CompletedProjectsCount * 2);
            trustReasons.Add($"Da hoan thanh {candidate.CompletedProjectsCount} du an.");
        }

        var capabilityScore = 0;
        if (matchedSkillNames.Count > 0)
        {
            capabilityScore += Math.Min(18, matchedSkillNames.Count * 5);
            skillReasons.Add($"Co ky nang lien quan: {string.Join(", ", matchedSkillNames.Take(4))}.");
        }
        else if (capability.PublicSkills.Count > 0)
        {
            skillReasons.Add("Da khai bao ky nang, nhung chua co nhieu ky nang gan voi category cua du an.");
            fitWarnings.Add($"Ky nang hien co chua the hien ro do khop voi {designCategoryName ?? "category"}.");
        }
        else
        {
            missingDataWarnings.Add("Student chua khai bao ky nang.");
        }

        var highlightedSkillCount = capability.HighlightedSkills
            .Select(skill => skill.SkillName)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Count(skillName => matchedSkillNames.Contains(skillName, StringComparer.OrdinalIgnoreCase));

        if (highlightedSkillCount > 0)
        {
            capabilityScore += Math.Min(6, highlightedSkillCount * 3);
            skillReasons.Add("Co ky nang noi bat trung voi nhu cau du an.");
        }

        var categoryPortfolioCount = capability.PublicPortfolio.Count(item => item.DesignCategoryId == project.DesignCategoryId);
        if (categoryPortfolioCount > 0)
        {
            capabilityScore += Math.Min(16, categoryPortfolioCount * 6);
            portfolioReasons.Add($"Co {categoryPortfolioCount} portfolio cong khai cung nhom category.");
        }
        else if (capability.PublicPortfolio.Count > 0)
        {
            portfolioReasons.Add("Co portfolio cong khai de tham khao them.");
        }
        else
        {
            missingDataWarnings.Add("Student chua co portfolio cong khai.");
        }

        var featuredPortfolioCount = capability.FeaturedPortfolio.Count(item => item.DesignCategoryId == project.DesignCategoryId || item.IsFeatured);
        if (featuredPortfolioCount > 0)
        {
            capabilityScore += Math.Min(8, featuredPortfolioCount * 4);
            portfolioReasons.Add("Portfolio noi bat cung cap them bang chung nang luc.");
        }

        var completenessSignals = 0;
        if (!string.IsNullOrWhiteSpace(candidate.Bio))
        {
            completenessSignals++;
        }
        else
        {
            missingDataWarnings.Add("Student chua co phan gioi thieu ca nhan.");
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
            reasons.Add("Ho so co du lieu co ban de SME xem xet them.");
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
