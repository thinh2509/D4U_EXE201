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

public sealed record SubmitProjectApplicationRequest(
    decimal ProposedPrice,
    string CoverLetter,
    int? EstimatedDurationDays);

public sealed record ProjectApplicationResponse(
    Guid Id,
    Guid ProjectId,
    Guid StudentProfileId,
    string StudentFullName,
    decimal ProposedPrice,
    string CoverLetter,
    int? EstimatedDurationDays,
    string Status,
    DateTimeOffset SubmittedAt,
    DateTimeOffset UpdatedAt);

public sealed record CreateProjectOfferRequest(
    Guid StudentProfileId,
    Guid? ApplicationId,
    decimal OfferedAmount,
    DateTimeOffset? ExpiresAt);

public sealed record ProjectOfferResponse(
    Guid Id,
    Guid ProjectId,
    Guid StudentProfileId,
    Guid? ApplicationId,
    OfferStatus Status,
    decimal OfferedAmount,
    DateTimeOffset? ExpiresAt,
    DateTimeOffset? AcceptedAt,
    DateTimeOffset? RejectedAt,
    DateTimeOffset? RevokedAt,
    DateTimeOffset CreatedAt);
