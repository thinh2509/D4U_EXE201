namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class UserSession
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string RefreshTokenHash { get; set; } = string.Empty;
    public string? DeviceInfo { get; set; }
    public string? IpAddress { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class AdminProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string PermissionLevel { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class StudentProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string School { get; set; } = string.Empty;
    public string Major { get; set; } = string.Empty;
    public int StudyStartYear { get; set; }
    public string? Bio { get; set; }
    public string OnboardingStatus { get; set; } = "INCOMPLETE";
    public string VerificationStatus { get; set; } = "NOT_SUBMITTED";
    public decimal AverageRating { get; set; }
    public int CompletedProjectsCount { get; set; }
    public bool CanWithdraw { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public sealed class StudentVerification
{
    public Guid Id { get; set; }
    public Guid StudentProfileId { get; set; }
    public Guid DocumentFileId { get; set; }
    public string Status { get; set; } = "PENDING";
    public Guid? ReviewedByAdminId { get; set; }
    public string? RejectionReason { get; set; }
    public DateTimeOffset SubmittedAt { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
}

public sealed class SmeProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string RepresentativeName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string BusinessField { get; set; } = string.Empty;
    public Guid? LogoFileId { get; set; }
    public string OnboardingStatus { get; set; } = "INCOMPLETE";
    public decimal AverageRating { get; set; }
    public int CompletedProjectsCount { get; set; }
    public int ActiveOpenProjectCount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public sealed class SubscriptionPlan
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal MonthlyPrice { get; set; }
    public decimal PlatformFeeRate { get; set; }
    public int? MaxActiveOpenProjects { get; set; }
    public decimal? MaxProjectBudget { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class SmeSubscription
{
    public Guid Id { get; set; }
    public Guid SmeProfileId { get; set; }
    public Guid SubscriptionPlanId { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? CurrentPeriodEnd { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class DesignCategory
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class Project
{
    public Guid Id { get; set; }
    public Guid SmeProfileId { get; set; }
    public Guid? SelectedStudentProfileId { get; set; }
    public Guid DesignCategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Brief { get; set; } = string.Empty;
    public string? UsagePurpose { get; set; }
    public ProjectType ProjectType { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.DRAFT;
    public decimal BudgetAmount { get; set; }
    public string Currency { get; set; } = "VND";
    public DateTimeOffset TotalDeadlineAt { get; set; }
    public DateTimeOffset SketchDeadlineAt { get; set; }
    public DateTimeOffset FinalDeadlineAt { get; set; }
    public int MaxRevisionRounds { get; set; } = 2;
    public int CurrentRevisionRound { get; set; }
    public bool IsConfidential { get; set; }
    public bool AllowStudentPortfolio { get; set; } = true;
    public DateTimeOffset? RatingDueAt { get; set; }
    public DateTimeOffset? PublishedAt { get; set; }
    public DateTimeOffset? AcceptedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public sealed class ProjectAttachment
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid FileId { get; set; }
    public string AttachmentType { get; set; } = "BRIEF";
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class ProjectApplication
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid StudentProfileId { get; set; }
    public decimal ProposedPrice { get; set; }
    public string CoverLetter { get; set; } = string.Empty;
    public int? EstimatedDurationDays { get; set; }
    public string Status { get; set; } = "SUBMITTED";
    public DateTimeOffset SubmittedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public sealed class ProjectOffer
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid StudentProfileId { get; set; }
    public Guid? ApplicationId { get; set; }
    public OfferStatus Status { get; set; } = OfferStatus.PENDING_PAYMENT;
    public decimal OfferedAmount { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public DateTimeOffset? AcceptedAt { get; set; }
    public DateTimeOffset? RejectedAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class ProjectStatusHistory
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public ProjectStatus? FromStatus { get; set; }
    public ProjectStatus ToStatus { get; set; }
    public Guid? ChangedByUserId { get; set; }
    public string? ChangeReason { get; set; }
    public string? MetadataJson { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class ProjectMilestone
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public MilestoneType MilestoneType { get; set; }
    public MilestoneStatus Status { get; set; } = MilestoneStatus.PENDING;
    public DateTimeOffset DeadlineAt { get; set; }
    public DateTimeOffset? SubmittedAt { get; set; }
    public DateTimeOffset? ReviewDueAt { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }
    public DateTimeOffset? AutoApprovedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public sealed class ProjectSubmission
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid MilestoneId { get; set; }
    public Guid SubmittedByStudentId { get; set; }
    public SubmissionType SubmissionType { get; set; }
    public int RevisionRound { get; set; }
    public string? Description { get; set; }
    public SubmissionStatus Status { get; set; } = SubmissionStatus.SUBMITTED;
    public DateTimeOffset SubmittedAt { get; set; }
}

public sealed class SubmissionFile
{
    public Guid Id { get; set; }
    public Guid SubmissionId { get; set; }
    public Guid FileId { get; set; }
    public Guid? WatermarkedFileId { get; set; }
    public bool IsOriginalDownloadable { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class ReviewAction
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid SubmissionId { get; set; }
    public Guid? ReviewerUserId { get; set; }
    public ReviewActionType Action { get; set; }
    public string? Comment { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class RevisionRequest
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid SubmissionId { get; set; }
    public Guid RequestedByUserId { get; set; }
    public int RevisionRound { get; set; }
    public string RequestedChanges { get; set; } = string.Empty;
    public string Status { get; set; } = "OPEN";
    public DateTimeOffset DueAt { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class InvalidFileReport
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid SubmissionId { get; set; }
    public Guid ReportedByUserId { get; set; }
    public InvalidFileReason ReasonCode { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = "OPEN";
    public DateTimeOffset ReuploadDueAt { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class FileAsset
{
    public Guid Id { get; set; }
    public Guid? OwnerUserId { get; set; }
    public string StorageProvider { get; set; } = string.Empty;
    public string? Bucket { get; set; }
    public string StorageKey { get; set; } = string.Empty;
    public string OriginalFilename { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public string FileExtension { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string? Checksum { get; set; }
    public string Visibility { get; set; } = "PRIVATE";
    public string? ScanStatus { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
}

public sealed class Escrow
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid SmeProfileId { get; set; }
    public Guid StudentProfileId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "VND";
    public decimal PlatformFeeRate { get; set; }
    public decimal? PlatformFeeAmount { get; set; }
    public EscrowStatus Status { get; set; } = EscrowStatus.PENDING_PAYMENT;
    public DateTimeOffset? FundedAt { get; set; }
    public DateTimeOffset? ReleasedAt { get; set; }
    public DateTimeOffset? RefundedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public sealed class Payment
{
    public Guid Id { get; set; }
    public Guid PayerUserId { get; set; }
    public Guid? EscrowId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "VND";
    public string Provider { get; set; } = string.Empty;
    public string? ProviderTransactionId { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.PENDING;
    public DateTimeOffset? PaidAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class Refund
{
    public Guid Id { get; set; }
    public Guid EscrowId { get; set; }
    public Guid? PaymentId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "VND";
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "PENDING";
    public string? ProviderRefundId { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
}

public sealed class Disbursement
{
    public Guid Id { get; set; }
    public Guid EscrowId { get; set; }
    public Guid WalletId { get; set; }
    public decimal GrossAmount { get; set; }
    public decimal PlatformFeeAmount { get; set; }
    public decimal NetAmount { get; set; }
    public string Status { get; set; } = "PENDING";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
}

public sealed class Wallet
{
    public Guid Id { get; set; }
    public Guid OwnerUserId { get; set; }
    public Guid? StudentProfileId { get; set; }
    public string Currency { get; set; } = "VND";
    public decimal AvailableBalance { get; set; }
    public decimal PendingBalance { get; set; }
    public decimal LockedBalance { get; set; }
    public WalletStatus Status { get; set; } = WalletStatus.ACTIVE;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public sealed class WalletTransaction
{
    public Guid Id { get; set; }
    public Guid WalletId { get; set; }
    public WalletTransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public string? ReferenceType { get; set; }
    public Guid? ReferenceId { get; set; }
    public string? Description { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class PaymentMethod
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string MethodType { get; set; } = "BANK_ACCOUNT";
    public string? AccountHolderName { get; set; }
    public string? MaskedAccountNumber { get; set; }
    public string? ProviderToken { get; set; }
    public bool IsDefault { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class WithdrawalRequest
{
    public Guid Id { get; set; }
    public Guid WalletId { get; set; }
    public Guid RequestedByUserId { get; set; }
    public Guid PaymentMethodId { get; set; }
    public decimal Amount { get; set; }
    public decimal FeeAmount { get; set; } = 5000m;
    public decimal NetAmount { get; set; }
    public string Status { get; set; } = "PENDING";
    public string? FailureReason { get; set; }
    public DateTimeOffset RequestedAt { get; set; }
    public DateTimeOffset? ProcessedAt { get; set; }
}

public sealed class Dispute
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid? EscrowId { get; set; }
    public Guid OpenedByUserId { get; set; }
    public Guid? AgainstUserId { get; set; }
    public string ReasonCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DisputeStatus Status { get; set; } = DisputeStatus.OPEN;
    public Guid? AssignedAdminId { get; set; }
    public string? DecisionType { get; set; }
    public decimal SmeRefundAmount { get; set; }
    public decimal StudentPayoutAmount { get; set; }
    public decimal PlatformFeeAmount { get; set; }
    public string? DecisionRationale { get; set; }
    public DateTimeOffset OpenedAt { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
}

public sealed class DisputeEvidence
{
    public Guid Id { get; set; }
    public Guid DisputeId { get; set; }
    public Guid SubmittedByUserId { get; set; }
    public Guid? FileId { get; set; }
    public string? Comment { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class Rating
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid RaterUserId { get; set; }
    public Guid RatedUserId { get; set; }
    public int RatingValue { get; set; }
    public string? Comment { get; set; }
    public bool IsPublic { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class Notification
{
    public Guid Id { get; set; }
    public Guid RecipientUserId { get; set; }
    public Guid? ActorUserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Body { get; set; }
    public string? ReferenceType { get; set; }
    public Guid? ReferenceId { get; set; }
    public NotificationStatus Status { get; set; } = NotificationStatus.UNREAD;
    public DateTimeOffset? ReadAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class AuditLog
{
    public Guid Id { get; set; }
    public Guid? ActorUserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string? BeforeJson { get; set; }
    public string? AfterJson { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
