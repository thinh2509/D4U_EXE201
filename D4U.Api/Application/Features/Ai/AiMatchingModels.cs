namespace D4U.Api.Application.Features.Ai;

using D4U.Api.Application.Features.Students;

public sealed record MatchingCandidateInput(
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
    StudentCapabilitySummaryResponse CapabilitySummary);

public sealed record MatchingCandidateEvaluation(
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
    int BaseScore,
    string MatchTier,
    IReadOnlyList<string> Reasons,
    MatchReasonGroupsResponse ReasonGroups,
    IReadOnlyList<string> MissingDataWarnings,
    IReadOnlyList<string> FitWarnings,
    IReadOnlyList<string> MatchedSkillNames,
    IReadOnlyList<string> MatchedPortfolioHighlights,
    int ProfileCompleteness);

public sealed record AiMatchingProjectContext(
    Guid ProjectId,
    string ProjectTitle,
    string Brief,
    string? UsagePurpose,
    string? DesignCategoryName,
    decimal BudgetAmount,
    string Currency,
    DateTimeOffset SketchDeadlineAt,
    DateTimeOffset FinalDeadlineAt,
    DateTimeOffset TotalDeadlineAt,
    string ProjectType,
    string ProjectStatus);

public sealed record AiMatchingRerankerRequest(
    AiMatchingProjectContext Project,
    IReadOnlyList<MatchingCandidateEvaluation> Candidates,
    int MaxResults,
    string Mode);

public sealed record AiMatchingRerankedCandidate(
    Guid StudentProfileId,
    int MatchScore,
    IReadOnlyList<string> Reasons,
    IReadOnlyList<string> MissingDataWarnings,
    IReadOnlyList<string> FitWarnings);

public sealed record AiMatchingRerankerResponse(
    string Provider,
    IReadOnlyList<string> Warnings,
    IReadOnlyList<AiMatchingRerankedCandidate> Recommendations);
