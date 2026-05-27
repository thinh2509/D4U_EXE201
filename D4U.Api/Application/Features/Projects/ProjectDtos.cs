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
    bool? IsConfidential,
    bool? AllowStudentPortfolio);

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
    DateTimeOffset UpdatedAt,
    bool HasApplied,
    Guid? MyApplicationId);

public sealed record CancelProjectRequest(
    string? CancellationReason);

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

public sealed record SmeProjectApplicationSummaryResponse(
    Guid Id,
    Guid ProjectId,
    string ProjectTitle,
    Guid StudentProfileId,
    string StudentFullName,
    decimal ProposedPrice,
    string CoverLetter,
    int? EstimatedDurationDays,
    string Status,
    DateTimeOffset SubmittedAt,
    DateTimeOffset UpdatedAt);

public sealed record StudentProjectApplicationSummaryResponse(
    Guid ApplicationId,
    Guid ProjectId,
    string ProjectTitle,
    string ApplicationStatus,
    decimal ProposedPrice,
    string CoverLetter,
    int? EstimatedDurationDays,
    DateTimeOffset SubmittedAt,
    DateTimeOffset UpdatedAt,
    Guid? OfferId,
    OfferStatus? OfferStatus,
    decimal? OfferedAmount,
    PaymentStatus? PaymentStatus,
    EscrowStatus? EscrowStatus);

public sealed record ProjectOfferFlowResponse(
    Guid OfferId,
    Guid ProjectId,
    string ProjectTitle,
    Guid StudentProfileId,
    string StudentFullName,
    Guid? ApplicationId,
    string? ApplicationStatus,
    OfferStatus OfferStatus,
    decimal OfferedAmount,
    DateTimeOffset? ExpiresAt,
    DateTimeOffset? PaymentDueAt,
    DateTimeOffset? AcceptedAt,
    DateTimeOffset? RejectedAt,
    DateTimeOffset CreatedAt,
    Guid? PaymentId,
    PaymentStatus? PaymentStatus,
    Guid? EscrowId,
    EscrowStatus? EscrowStatus,
    string? CheckoutUrl,
    DateTimeOffset? PaymentExpiresAt);

public sealed record StudentProjectSummaryResponse(
    Guid ProjectId,
    string ProjectTitle,
    ProjectStatus ProjectStatus,
    decimal BudgetAmount,
    string Currency,
    DateTimeOffset TotalDeadlineAt,
    DateTimeOffset? AcceptedAt,
    Guid? EscrowId,
    EscrowStatus? EscrowStatus);

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
    DateTimeOffset? PaymentDueAt,
    DateTimeOffset? AcceptedAt,
    DateTimeOffset? RejectedAt,
    DateTimeOffset? ExpiredAt,
    DateTimeOffset CreatedAt);
