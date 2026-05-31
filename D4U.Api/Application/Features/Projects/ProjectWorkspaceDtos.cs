namespace D4U.Api.Application.Features.Projects;

using D4U.Api.Domain.Enums;

public sealed record SubmissionUploadResponse(
    Guid Id,
    string OriginalFilename,
    string MimeType,
    string FileExtension,
    long FileSizeBytes,
    string DownloadUrl);

public sealed record ProjectWorkspaceResponse(
    Guid ProjectId,
    string ProjectTitle,
    ProjectStatus ProjectStatus,
    string ViewerRole,
    string NextAction,
    string NextActionRole,
    decimal BudgetAmount,
    string Currency,
    DateTimeOffset TotalDeadlineAt,
    int CurrentRevisionRound,
    WorkspaceOfferResponse? Offer,
    WorkspacePaymentResponse? Payment,
    WorkspaceEscrowResponse? Escrow,
    IReadOnlyList<WorkspaceSubmissionResponse> Submissions,
    IReadOnlyList<WorkspaceReviewActionResponse> ReviewActions);

public sealed record WorkspaceOfferResponse(
    Guid Id,
    OfferStatus Status,
    decimal OfferedAmount,
    DateTimeOffset? ExpiresAt,
    DateTimeOffset? PaymentDueAt,
    string StudentFullName);

public sealed record WorkspacePaymentResponse(
    Guid Id,
    PaymentStatus Status,
    string Provider,
    string? CheckoutUrl,
    string? QrCode,
    DateTimeOffset? ExpiresAt,
    DateTimeOffset? PaidAt);

public sealed record WorkspaceEscrowResponse(
    Guid Id,
    EscrowStatus Status,
    decimal Amount,
    decimal? PlatformFeeAmount,
    DateTimeOffset? FundedAt,
    DateTimeOffset? ReleasedAt);

public sealed record WorkspaceSubmissionResponse(
    Guid Id,
    SubmissionType SubmissionType,
    SubmissionStage MilestoneType,
    int RevisionRound,
    string? Description,
    SubmissionStatus Status,
    DateTimeOffset SubmittedAt,
    DateTimeOffset? ReviewDueAt,
    DateTimeOffset? ApprovedAt,
    DateTimeOffset? AutoApprovedAt,
    IReadOnlyList<WorkspaceSubmissionFileResponse> Files);

public sealed record WorkspaceSubmissionFileResponse(
    Guid Id,
    Guid FileId,
    string OriginalFilename,
    string MimeType,
    bool IsOriginalDownloadable,
    string DownloadUrl);

public sealed record WorkspaceReviewActionResponse(
    Guid Id,
    Guid SubmissionId,
    ReviewActionType Action,
    string? Comment,
    string? RequestedChanges,
    int? RevisionRound,
    DateTimeOffset? DueAt,
    InvalidFileReason? InvalidFileReason,
    DateTimeOffset? ReuploadDueAt,
    DateTimeOffset CreatedAt);
