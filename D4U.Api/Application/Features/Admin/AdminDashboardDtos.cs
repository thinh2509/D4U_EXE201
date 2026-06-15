namespace D4U.Api.Application.Features.Admin;

using D4U.Api.Domain.Enums;

public sealed record AdminDashboardStatsResponse(
    AdminDashboardSummaryDto Summary,
    AdminDashboardQueuesDto Queues,
    AdminDashboardPackageSnapshotDto Packages,
    AdminDashboardRecentItemsDto Recent,
    AdminDashboardActionsDto Actions);

public sealed record AdminDashboardSummaryDto(
    int TotalUsers,
    int TotalStudents,
    int TotalSmes,
    int TotalProjects,
    int OpenProjects,
    int CompletedProjects);

public sealed record AdminDashboardQueuesDto(
    int PendingVerifications,
    int PendingWithdrawals,
    int ProcessingWithdrawals,
    int PendingRefunds,
    int PendingPackagePurchases);

public sealed record AdminDashboardPackageSnapshotDto(
    int TotalPurchases,
    int ActivePurchases,
    int PendingPurchases,
    int FailedPurchases);

public sealed record AdminDashboardRecentItemsDto(
    IReadOnlyList<AdminDashboardRecentVerificationDto> LatestVerifications,
    IReadOnlyList<AdminDashboardRecentWithdrawalDto> LatestWithdrawals,
    IReadOnlyList<AdminDashboardRecentPackagePurchaseDto> LatestPackagePurchases);

public sealed record AdminDashboardRecentVerificationDto(
    Guid Id,
    string StudentFullName,
    string School,
    string Status,
    DateTimeOffset SubmittedAt);

public sealed record AdminDashboardRecentWithdrawalDto(
    Guid Id,
    string StudentFullName,
    decimal Amount,
    string Status,
    DateTimeOffset CreatedAt);

public sealed record AdminDashboardRecentPackagePurchaseDto(
    Guid Id,
    string BuyerName,
    string PackageName,
    string Status,
    PaymentStatus? PaymentStatus,
    DateTimeOffset CreatedAt);

public sealed record AdminDashboardActionsDto(
    int NeedsAttentionCount);
