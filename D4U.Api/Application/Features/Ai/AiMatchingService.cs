namespace D4U.Api.Application.Features.Ai;

using D4U.Api.Application.Common.Data;
using D4U.Api.Application.Common.Exceptions;
using D4U.Api.Application.Features.FeaturePackages;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

public sealed class AiMatchingService(
    IUnitOfWork unitOfWork,
    IFeatureEntitlementService entitlementService,
    IMatchingCandidateBuilder candidateBuilder,
    IMatchingScoringService scoringService,
    IAiMatchingReranker reranker) : IAiMatchingService
{
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
        var designCategoryName = await unitOfWork.Repository<DesignCategory>().Query()
            .Where(value => value.Id == project.DesignCategoryId)
            .Select(value => value.Name)
            .FirstOrDefaultAsync(cancellationToken);

        var maxResults = Math.Clamp(request.MaxResults ?? 6, 1, 10);
        var mode = string.IsNullOrWhiteSpace(request.Mode) ? "HYBRID" : request.Mode.Trim().ToUpperInvariant();

        var candidates = await candidateBuilder.BuildCandidatesAsync(project, cancellationToken);
        if (candidates.Count == 0)
        {
            return new MatchStudentsForProjectResponse(
                project.Id,
                project.Title,
                "Deterministic",
                ["Chua tim thay student phu hop de goi y cho du an nay."],
                []);
        }

        var evaluations = candidates
            .Select(candidate => scoringService.Evaluate(project, designCategoryName, candidate))
            .OrderByDescending(candidate => candidate.BaseScore)
            .ThenByDescending(candidate => candidate.HasAppliedToProject)
            .ThenByDescending(candidate => candidate.AverageRating)
            .ThenByDescending(candidate => candidate.CompletedProjectsCount)
            .ToList();

        var rerankPoolSize = Math.Min(Math.Max(maxResults * 2, 10), 15);
        var rerankPool = evaluations.Take(rerankPoolSize).ToList();

        var rerankerResponse = await reranker.RerankAsync(
            new AiMatchingRerankerRequest(
                BuildProjectContext(project, designCategoryName),
                rerankPool,
                maxResults,
                mode),
            cancellationToken);

        var mergedRecommendations = MergeRecommendations(
            rerankerResponse.Recommendations,
            evaluations,
            maxResults);

        return new MatchStudentsForProjectResponse(
            project.Id,
            project.Title,
            rerankerResponse.Provider,
            rerankerResponse.Warnings,
            mergedRecommendations);
    }

    private async Task<Project> RequireOwnedProjectAsync(
        Guid userId,
        Guid projectId,
        CancellationToken cancellationToken)
    {
        var smeProfile = await unitOfWork.Repository<SmeProfile>().FirstOrDefaultAsync(
            value => value.UserId == userId,
            cancellationToken)
            ?? throw new UnauthorizedAccessException("SME profile was not found.");

        var project = await unitOfWork.Repository<Project>().Query()
            .FirstOrDefaultAsync(value => value.Id == projectId, cancellationToken)
            ?? throw new NotFoundException("Project was not found.");

        if (project.SmeProfileId != smeProfile.Id)
        {
            throw new ForbiddenException("Only the owner SME can use AI Matching for this project.");
        }

        if (!AllowedMatchingProjectStatuses.Contains(project.Status))
        {
            throw new ConflictException("Project is no longer in a recruiting stage that supports AI Matching.");
        }

        return project;
    }

    private async Task EnsureMatchingEntitlementAsync(Guid userId, CancellationToken cancellationToken)
    {
        var hasEntitlement = await entitlementService.HasActiveEntitlementAsync(
            userId,
            FeatureEntitlementCodes.SmeAiMatching,
            cancellationToken);

        if (!hasEntitlement)
        {
            throw new ForbiddenException("SME does not have an active AI Matching entitlement.");
        }
    }

    private static AiMatchingProjectContext BuildProjectContext(Project project, string? designCategoryName)
    {
        return new AiMatchingProjectContext(
            project.Id,
            project.Title,
            project.Brief,
            project.UsagePurpose,
            designCategoryName,
            project.BudgetAmount,
            project.Currency,
            project.SketchDeadlineAt,
            project.FinalDeadlineAt,
            project.TotalDeadlineAt,
            project.ProjectType.ToString(),
            project.Status.ToString());
    }

    private static IReadOnlyList<StudentMatchRecommendationResponse> MergeRecommendations(
        IReadOnlyList<AiMatchingRerankedCandidate> rerankedCandidates,
        IReadOnlyList<MatchingCandidateEvaluation> evaluations,
        int maxResults)
    {
        var evaluationMap = evaluations.ToDictionary(value => value.StudentProfileId);
        var merged = new List<StudentMatchRecommendationResponse>(maxResults);
        var includedIds = new HashSet<Guid>();

        foreach (var reranked in rerankedCandidates)
        {
            if (!evaluationMap.TryGetValue(reranked.StudentProfileId, out var evaluation))
            {
                continue;
            }

            includedIds.Add(reranked.StudentProfileId);
            merged.Add(ToRecommendation(evaluation, reranked));

            if (merged.Count >= maxResults)
            {
                return merged;
            }
        }

        foreach (var evaluation in evaluations)
        {
            if (!includedIds.Add(evaluation.StudentProfileId))
            {
                continue;
            }

            merged.Add(ToRecommendation(evaluation, null));
            if (merged.Count >= maxResults)
            {
                break;
            }
        }

        return merged;
    }

    private static StudentMatchRecommendationResponse ToRecommendation(
        MatchingCandidateEvaluation evaluation,
        AiMatchingRerankedCandidate? reranked)
    {
        var score = Math.Clamp(reranked?.MatchScore ?? evaluation.BaseScore, 1, 100);
        return new StudentMatchRecommendationResponse(
            evaluation.StudentProfileId,
            evaluation.StudentUserId,
            evaluation.StudentFullName,
            evaluation.School,
            evaluation.Major,
            evaluation.Bio,
            evaluation.VerificationStatus,
            evaluation.AverageRating,
            evaluation.CompletedProjectsCount,
            evaluation.HasAppliedToProject,
            evaluation.ProposedPrice,
            score,
            ClassifyMatchTier(score),
            (reranked?.Reasons?.Count ?? 0) > 0 ? reranked!.Reasons : evaluation.Reasons,
            evaluation.ReasonGroups,
            (reranked?.MissingDataWarnings?.Count ?? 0) > 0 ? reranked!.MissingDataWarnings : evaluation.MissingDataWarnings,
            (reranked?.FitWarnings?.Count ?? 0) > 0 ? reranked!.FitWarnings : evaluation.FitWarnings,
            evaluation.MatchedSkillNames,
            evaluation.MatchedPortfolioHighlights,
            evaluation.ProfileCompleteness);
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
