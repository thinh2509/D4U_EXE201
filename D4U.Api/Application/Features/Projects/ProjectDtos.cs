namespace D4U.Api.Application.Features.Projects;

using D4U.Api.Domain.Enums;

public sealed record UpsertProjectDraftRequest(
    Guid DesignCategoryId,
    string Title,
    string Brief,
    string? UsagePurpose,
    ProjectType ProjectType,
    decimal BudgetAmount,
    string Currency,
    DateTimeOffset TotalDeadlineAt,
    DateTimeOffset SketchDeadlineAt,
    DateTimeOffset FinalDeadlineAt,
    int MaxRevisionRounds,
    bool IsConfidential,
    bool AllowStudentPortfolio);

public sealed record ProjectResponse(
    Guid Id,
    Guid SmeProfileId,
    Guid DesignCategoryId,
    string DesignCategoryName,
    string Title,
    string Brief,
    string? UsagePurpose,
    ProjectType ProjectType,
    ProjectStatus Status,
    decimal BudgetAmount,
    string Currency,
    DateTimeOffset TotalDeadlineAt,
    DateTimeOffset SketchDeadlineAt,
    DateTimeOffset FinalDeadlineAt,
    int MaxRevisionRounds,
    int CurrentRevisionRound,
    bool IsConfidential,
    bool AllowStudentPortfolio,
    DateTimeOffset? PublishedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

