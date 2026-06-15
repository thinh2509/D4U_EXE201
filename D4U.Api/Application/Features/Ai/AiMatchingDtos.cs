namespace D4U.Api.Application.Features.Ai;

public sealed record MatchStudentsForProjectRequest(
    int? MaxResults,
    string? Mode = null);

public sealed record MatchReasonGroupsResponse(
    IReadOnlyList<string> Skills,
    IReadOnlyList<string> Portfolio,
    IReadOnlyList<string> Trust,
    IReadOnlyList<string> Application);

public sealed record StudentMatchRecommendationResponse(
    Guid StudentProfileId,
    Guid StudentUserId,
    string StudentFullName,
    string School,
    string Major,
    string? Bio,
    string VerificationStatus,
    decimal AverageRating,
    int CompletedProjectsCount,
    bool HasAppliedToProject,
    decimal? ProposedPrice,
    int MatchScore,
    string MatchTier,
    IReadOnlyList<string> Reasons,
    MatchReasonGroupsResponse ReasonGroups,
    IReadOnlyList<string> MissingDataWarnings,
    IReadOnlyList<string> FitWarnings,
    IReadOnlyList<string> MatchedSkillNames,
    IReadOnlyList<string> MatchedPortfolioHighlights,
    int ProfileCompleteness);

public sealed record MatchStudentsForProjectResponse(
    Guid ProjectId,
    string ProjectTitle,
    string Provider,
    IReadOnlyList<string> Warnings,
    IReadOnlyList<StudentMatchRecommendationResponse> Recommendations);
