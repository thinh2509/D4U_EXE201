namespace D4U.Api.Application.Features.Ai;

public sealed record GenerateAiProposalRequest(
    Guid ProjectId);

public sealed record GenerateAiProposalResponse(
    string ProposalText,
    IReadOnlyList<string> Strengths,
    int RemainingUsage,
    string Provider,
    IReadOnlyList<string> Warnings);

public sealed record AiProposalProjectContext(
    Guid ProjectId,
    string Title,
    string Brief,
    string DesignCategoryName,
    decimal BudgetAmount,
    string Currency,
    DateTimeOffset SketchDeadlineAt,
    DateTimeOffset FinalDeadlineAt,
    DateTimeOffset TotalDeadlineAt);

public sealed record AiProposalStudentContext(
    Guid StudentProfileId,
    Guid StudentUserId,
    string FullName,
    string School,
    string Major,
    string? Bio,
    string VerificationStatus,
    decimal AverageRating,
    int CompletedProjectsCount,
    string SkillsSummary,
    IReadOnlyList<string> HighlightedSkills,
    IReadOnlyList<string> RelatedSkills,
    string PortfolioSummary,
    string FeaturedPortfolioSummary);

public sealed record AiProposalGeneratorRequest(
    AiProposalProjectContext Project,
    AiProposalStudentContext Student);

public sealed record AiProposalGeneratorResponse(
    string ProposalText,
    IReadOnlyList<string> Strengths,
    IReadOnlyList<string> Warnings,
    string Provider);
