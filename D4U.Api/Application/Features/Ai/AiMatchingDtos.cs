namespace D4U.Api.Application.Features.Ai;

public sealed record MatchStudentsForProjectRequest(
    int? MaxResults);

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
    IReadOnlyList<string> Reasons,
    IReadOnlyList<string> MissingDataWarnings);

public sealed record MatchStudentsForProjectResponse(
    Guid ProjectId,
    string ProjectTitle,
    string Provider,
    IReadOnlyList<string> Warnings,
    IReadOnlyList<StudentMatchRecommendationResponse> Recommendations);
