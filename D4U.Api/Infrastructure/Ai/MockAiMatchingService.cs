namespace D4U.Api.Infrastructure.Ai;

using D4U.Api.Application.Features.Ai;
using D4U.Api.Application.Features.FeaturePackages;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

public sealed class MockAiMatchingService(
    D4UDbContext dbContext,
    IFeatureEntitlementService entitlementService) : IAiMatchingService
{
    private static readonly HashSet<string> ApprovedVerificationStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "APPROVED",
        "VERIFIED"
    };
    private static readonly ProjectStatus[] AllowedMatchingProjectStatuses =
    [
        ProjectStatus.DRAFT,
        ProjectStatus.OPEN,
        ProjectStatus.PRIVATE_INVITED
    ];

    public async Task<MatchStudentsForProjectResponse> MatchStudentsForProjectAsync(
        Guid userId,
        Guid projectId,
        MatchStudentsForProjectRequest request,
        CancellationToken cancellationToken = default)
    {
        var project = await RequireOwnedProjectAsync(userId, projectId, cancellationToken);
        await EnsureMatchingEntitlementAsync(userId, cancellationToken);

        var candidateModels = await LoadCandidatesAsync(projectId, cancellationToken);
        if (candidateModels.Count == 0)
        {
            return new MatchStudentsForProjectResponse(
                project.Id,
                project.Title,
                "MockFallback",
                ["Chưa có dữ liệu sinh viên phù hợp để gợi ý cho dự án này."],
                []);
        }

        var maxResults = Math.Clamp(request.MaxResults ?? 5, 1, 10);
        var ranked = candidateModels
            .Select(model => new
            {
                Candidate = model,
                Score = BuildScore(project, model),
                Reasons = BuildReasons(model),
                Warnings = BuildWarnings(model)
            })
            .OrderByDescending(value => value.Score)
            .ThenByDescending(value => value.Candidate.HasAppliedToProject)
            .ThenByDescending(value => value.Candidate.AverageRating)
            .Take(maxResults)
            .Select(value => new StudentMatchRecommendationResponse(
                value.Candidate.StudentProfileId,
                value.Candidate.StudentUserId,
                value.Candidate.StudentFullName,
                value.Candidate.School,
                value.Candidate.Major,
                value.Candidate.Bio,
                value.Candidate.VerificationStatus,
                value.Candidate.AverageRating,
                value.Candidate.CompletedProjectsCount,
                value.Candidate.HasAppliedToProject,
                value.Candidate.ProposedPrice,
                value.Score,
                value.Reasons,
                value.Warnings))
            .ToList();

        return new MatchStudentsForProjectResponse(
            project.Id,
            project.Title,
            "MockFallback",
            ["Hệ thống đang dùng matching fallback deterministic khi OpenAI không khả dụng hoặc chưa được cấu hình."],
            ranked);
    }

    internal async Task<Project> RequireOwnedProjectAsync(Guid userId, Guid projectId, CancellationToken cancellationToken)
    {
        var smeProfile = await dbContext.SmeProfiles.FirstOrDefaultAsync(value => value.UserId == userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("SME profile was not found.");
        var project = await dbContext.Projects.FirstOrDefaultAsync(value => value.Id == projectId, cancellationToken)
            ?? throw new InvalidOperationException("Project was not found.");

        if (project.SmeProfileId != smeProfile.Id)
        {
            throw new UnauthorizedAccessException("Only the owner SME can request AI Matching for this project.");
        }

        EnsureProjectSupportsMatching(project);
        return project;
    }

    internal static void EnsureProjectSupportsMatching(Project project)
    {
        if (!AllowedMatchingProjectStatuses.Contains(project.Status))
        {
            throw new InvalidOperationException("Project is no longer in a recruiting stage that supports AI Matching.");
        }
    }

    internal async Task EnsureMatchingEntitlementAsync(Guid userId, CancellationToken cancellationToken)
    {
        var hasEntitlement = await entitlementService.HasActiveEntitlementAsync(
            userId,
            FeatureEntitlementCodes.SmeAiMatching,
            cancellationToken);

        if (!hasEntitlement)
        {
            throw new UnauthorizedAccessException("SME does not have an active AI Matching entitlement.");
        }
    }

    internal async Task<List<StudentCandidateModel>> LoadCandidatesAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var applications = await dbContext.ProjectApplications
            .Where(value => value.ProjectId == projectId)
            .ToListAsync(cancellationToken);

        var studentProfiles = await (
            from profile in dbContext.StudentProfiles
            join user in dbContext.Users on profile.UserId equals user.Id
            orderby profile.CompletedProjectsCount descending, profile.AverageRating descending, profile.UpdatedAt descending
            select new StudentCandidateModel(
                profile.Id,
                profile.UserId,
                user.FullName,
                profile.School,
                profile.Major,
                profile.Bio,
                profile.VerificationStatus,
                profile.AverageRating,
                profile.CompletedProjectsCount,
                false,
                null))
            .Take(25)
            .ToListAsync(cancellationToken);

        foreach (var candidate in studentProfiles)
        {
            var application = applications.FirstOrDefault(value => value.StudentProfileId == candidate.StudentProfileId);
            if (application is null)
            {
                continue;
            }

            candidate.HasAppliedToProject = true;
            candidate.ProposedPrice = application.ProposedPrice;
        }

        return studentProfiles;
    }

    private static int BuildScore(Project project, StudentCandidateModel candidate)
    {
        var score = 40;

        if (candidate.HasAppliedToProject)
        {
            score += 20;
        }

        if (ApprovedVerificationStatuses.Contains(candidate.VerificationStatus))
        {
            score += 15;
        }

        score += Math.Min(15, candidate.CompletedProjectsCount * 3);
        score += (int)Math.Min(10m, Math.Round(candidate.AverageRating * 2m, MidpointRounding.AwayFromZero));

        if (candidate.ProposedPrice.HasValue)
        {
            var delta = Math.Abs(project.BudgetAmount - candidate.ProposedPrice.Value);
            var ratio = project.BudgetAmount <= 0 ? 1m : delta / project.BudgetAmount;
            if (ratio <= 0.1m)
            {
                score += 5;
            }
            else if (ratio <= 0.25m)
            {
                score += 2;
            }
        }

        return Math.Clamp(score, 1, 100);
    }

    private static IReadOnlyList<string> BuildReasons(StudentCandidateModel candidate)
    {
        var reasons = new List<string>();

        if (candidate.HasAppliedToProject)
        {
            reasons.Add("Đã từng chủ động nộp ứng tuyển cho dự án này.");
        }

        if (ApprovedVerificationStatuses.Contains(candidate.VerificationStatus))
        {
            reasons.Add("Hồ sơ sinh viên đã được xác thực.");
        }

        if (candidate.AverageRating > 0)
        {
            reasons.Add($"Điểm đánh giá trung bình hiện tại là {candidate.AverageRating:0.00}.");
        }

        if (candidate.CompletedProjectsCount > 0)
        {
            reasons.Add($"Đã hoàn thành {candidate.CompletedProjectsCount} dự án.");
        }

        if (!string.IsNullOrWhiteSpace(candidate.Major))
        {
            reasons.Add($"Chuyên ngành khai báo: {candidate.Major}.");
        }

        return reasons.Count == 0
            ? ["Hồ sơ sinh viên có dữ liệu cơ bản để xem xét thêm."]
            : reasons;
    }

    private static IReadOnlyList<string> BuildWarnings(StudentCandidateModel candidate)
    {
        var warnings = new List<string>();

        if (string.IsNullOrWhiteSpace(candidate.Bio))
        {
            warnings.Add("Chưa có phần giới thiệu để đánh giá phong cách làm việc chi tiết.");
        }

        warnings.Add("Hệ thống chưa có dữ liệu kỹ năng khai báo riêng cho matching trong phase này.");
        return warnings;
    }

    internal sealed class StudentCandidateModel(
        Guid StudentProfileId,
        Guid StudentUserId,
        string StudentFullName,
        string School,
        string Major,
        string? Bio,
        string VerificationStatus,
        decimal AverageRating,
        int CompletedProjectsCount,
        bool hasAppliedToProject,
        decimal? proposedPrice)
    {
        public Guid StudentProfileId { get; } = StudentProfileId;
        public Guid StudentUserId { get; } = StudentUserId;
        public string StudentFullName { get; } = StudentFullName;
        public string School { get; } = School;
        public string Major { get; } = Major;
        public string? Bio { get; } = Bio;
        public string VerificationStatus { get; } = VerificationStatus;
        public decimal AverageRating { get; } = AverageRating;
        public int CompletedProjectsCount { get; } = CompletedProjectsCount;
        public bool HasAppliedToProject { get; set; } = hasAppliedToProject;
        public decimal? ProposedPrice { get; set; } = proposedPrice;
    }
}
