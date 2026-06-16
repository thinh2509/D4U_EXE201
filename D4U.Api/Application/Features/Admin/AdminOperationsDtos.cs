namespace D4U.Api.Application.Features.Admin;

using D4U.Api.Domain.Enums;

public sealed record AdminUserLifecycleActionRequest(
    string? Reason);

public sealed record AdminUserListItemResponse(
    Guid Id,
    string FullName,
    string Email,
    string Username,
    UserRole Role,
    UserStatus Status,
    DateTimeOffset? EmailVerifiedAt,
    DateTimeOffset? LastLoginAt,
    DateTimeOffset CreatedAt,
    bool HasStudentProfile,
    bool HasSmeProfile,
    string? VerificationStatus,
    string? OnboardingStatus,
    string? CompanyName);

public sealed record AdminUserProfileSnapshotResponse(
    Guid Id,
    string Type,
    string DisplayName,
    string? SecondaryLine,
    string OnboardingStatus,
    string? VerificationStatus,
    int CompletedProjectsCount,
    int ActiveOpenProjectCount,
    bool CanWithdraw);

public sealed record AdminUserPackageSummaryResponse(
    int TotalPurchases,
    int PendingPurchases,
    int ActivePurchases,
    int FailedPurchases,
    int ActiveEntitlements);

public sealed record AdminUserWithdrawalSummaryResponse(
    int TotalRequests,
    int PendingRequests,
    int ProcessingRequests,
    int CompletedRequests,
    int FailedRequests);

public sealed record AdminUserProjectSummaryResponse(
    int OpenProjects,
    int InProgressProjects,
    int AdminReviewProjects,
    int CompletedProjects);

public sealed record AdminUserDetailResponse(
    Guid Id,
    string FullName,
    string Email,
    string Username,
    string? AvatarUrl,
    UserRole Role,
    UserStatus Status,
    DateTimeOffset? EmailVerifiedAt,
    DateTimeOffset? LastLoginAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    AdminUserProfileSnapshotResponse? StudentProfile,
    AdminUserProfileSnapshotResponse? SmeProfile,
    AdminUserPackageSummaryResponse PackageSummary,
    AdminUserWithdrawalSummaryResponse WithdrawalSummary,
    AdminUserProjectSummaryResponse ProjectSummary);

public sealed record AdminProjectListItemResponse(
    Guid Id,
    string Title,
    string DesignCategoryName,
    ProjectStatus Status,
    decimal BudgetAmount,
    string Currency,
    DateTimeOffset UpdatedAt,
    Guid SmeUserId,
    string SmeFullName,
    string? SmeCompanyName,
    Guid? StudentUserId,
    string? StudentFullName,
    PaymentStatus? PaymentStatus,
    EscrowStatus? EscrowStatus,
    SubmissionStatus? LatestSubmissionStatus,
    bool CanModerate);

public sealed record AdminProjectParticipantResponse(
    Guid UserId,
    Guid ProfileId,
    string FullName,
    string? CompanyName,
    string Role,
    string? VerificationStatus);

public sealed record AdminProjectExecutionSnapshotResponse(
    PaymentStatus? PaymentStatus,
    EscrowStatus? EscrowStatus,
    SubmissionStatus? LatestSubmissionStatus,
    DateTimeOffset? LatestSubmissionAt,
    int TotalApplications,
    int TotalOffers,
    string? AdminReviewReason);

public sealed record AdminProjectTimelineItemResponse(
    Guid Id,
    string Action,
    string? ActorName,
    DateTimeOffset CreatedAt,
    string? Note);

public sealed record AdminProjectDetailResponse(
    Guid Id,
    string Title,
    string Brief,
    string? UsagePurpose,
    string DesignCategoryName,
    ProjectType ProjectType,
    ProjectStatus Status,
    decimal BudgetAmount,
    string Currency,
    DateTimeOffset TotalDeadlineAt,
    DateTimeOffset SketchDeadlineAt,
    DateTimeOffset FinalDeadlineAt,
    int CurrentRevisionRound,
    int MaxRevisionRounds,
    bool IsConfidential,
    bool AllowStudentPortfolio,
    DateTimeOffset? PublishedAt,
    DateTimeOffset? AcceptedAt,
    DateTimeOffset? CompletedAt,
    DateTimeOffset? CancelledAt,
    string? CancellationReason,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    bool CanModerate,
    AdminProjectParticipantResponse Sme,
    AdminProjectParticipantResponse? Student,
    AdminProjectExecutionSnapshotResponse Execution,
    IReadOnlyList<AdminProjectTimelineItemResponse> Timeline);
