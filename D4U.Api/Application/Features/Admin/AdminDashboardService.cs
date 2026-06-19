namespace D4U.Api.Application.Features.Admin;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

public sealed class AdminDashboardService(D4UDbContext dbContext) : IAdminDashboardService
{
    private const int RecentItemsLimit = 5;
    private static readonly TimeSpan AdminQueueOverdueThreshold = TimeSpan.FromHours(24);

    public async Task<AdminDashboardStatsResponse> GetStatsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var overdueCutoff = now - AdminQueueOverdueThreshold;

        var totalUsers = await dbContext.Users.CountAsync(cancellationToken);
        var totalStudents = await dbContext.Users.CountAsync(value => value.Role == UserRole.STUDENT, cancellationToken);
        var totalSmes = await dbContext.Users.CountAsync(value => value.Role == UserRole.SME, cancellationToken);
        var totalProjects = await dbContext.Projects.CountAsync(cancellationToken);
        var openProjects = await dbContext.Projects.CountAsync(value => value.Status == ProjectStatus.OPEN, cancellationToken);
        var completedProjects = await dbContext.Projects.CountAsync(value => value.Status == ProjectStatus.COMPLETED, cancellationToken);
        var totalPlatformRevenue = await dbContext.Disbursements
            .SumAsync(value => (decimal?)value.PlatformFeeAmount, cancellationToken) ?? 0m;
        var totalPackageRevenue = await dbContext.Payments
            .Where(value =>
                value.TargetType == PaymentTargetType.FEATURE_PACKAGE_PURCHASE &&
                value.Status == PaymentStatus.SUCCESS)
            .SumAsync(value => (decimal?)value.Amount, cancellationToken) ?? 0m;

        var pendingVerifications = await dbContext.StudentVerifications.CountAsync(value => value.Status == "PENDING", cancellationToken);
        var pendingWithdrawals = await dbContext.WithdrawalRequests.CountAsync(value => value.Status == "PENDING", cancellationToken);
        var processingWithdrawals = await dbContext.WithdrawalRequests.CountAsync(value => value.Status == "PROCESSING", cancellationToken);
        var pendingRefunds = await dbContext.Refunds.CountAsync(value => value.Status == "PENDING", cancellationToken);
        var pendingPackagePurchases = await dbContext.FeaturePackagePurchases.CountAsync(
            value => value.Status == FeaturePackagePurchaseStatus.PENDING,
            cancellationToken);

        var pendingVerificationsOverdue = await dbContext.StudentVerifications.CountAsync(
            value => value.Status == "PENDING" && value.SubmittedAt <= overdueCutoff,
            cancellationToken);
        var pendingWithdrawalsOverdue = await dbContext.WithdrawalRequests.CountAsync(
            value => value.Status == "PENDING" && value.RequestedAt <= overdueCutoff,
            cancellationToken);
        var pendingRefundsOverdue = await dbContext.Refunds.CountAsync(
            value => value.Status == "PENDING" && value.CreatedAt <= overdueCutoff,
            cancellationToken);

        var totalPackagePurchases = await dbContext.FeaturePackagePurchases.CountAsync(cancellationToken);
        var activePackagePurchases = await dbContext.FeaturePackagePurchases.CountAsync(
            value => value.Status == FeaturePackagePurchaseStatus.ACTIVE,
            cancellationToken);
        var failedPackagePurchases = await dbContext.FeaturePackagePurchases.CountAsync(
            value => value.Status == FeaturePackagePurchaseStatus.FAILED,
            cancellationToken);

        var escrowHeldAmount = await dbContext.Escrows
            .Where(value =>
                value.Status == EscrowStatus.FUNDED ||
                value.Status == EscrowStatus.RELEASE_PENDING ||
                value.Status == EscrowStatus.REFUND_PENDING)
            .SumAsync(value => (decimal?)value.Amount, cancellationToken) ?? 0m;
        var pendingDisbursementAmount = await dbContext.Escrows
            .Where(value => value.Status == EscrowStatus.RELEASE_PENDING)
            .SumAsync(value => (decimal?)(value.Amount - (value.PlatformFeeAmount ?? 0m)), cancellationToken) ?? 0m;
        var pendingRefundAmount = await dbContext.Refunds
            .Where(value => value.Status == "PENDING")
            .SumAsync(value => (decimal?)value.Amount, cancellationToken) ?? 0m;

        var waitingStudentAcceptance = await dbContext.ProjectOffers.CountAsync(
            value => value.Status == OfferStatus.WAITING_ACCEPTANCE,
            cancellationToken);
        var waitingSmePayment = await dbContext.ProjectOffers.CountAsync(
            value => value.Status == OfferStatus.PENDING_PAYMENT,
            cancellationToken);
        var projectsInReview = await dbContext.Projects.CountAsync(
            value =>
                value.Status == ProjectStatus.SKETCH_REVIEW ||
                value.Status == ProjectStatus.FINAL_REVIEW ||
                value.Status == ProjectStatus.ADMIN_REVIEW,
            cancellationToken);

        var latestVerifications = await (
            from verification in dbContext.StudentVerifications
            join profile in dbContext.StudentProfiles on verification.StudentProfileId equals profile.Id
            join user in dbContext.Users on profile.UserId equals user.Id
            orderby verification.SubmittedAt descending
            select new AdminDashboardRecentVerificationDto(
                verification.Id,
                user.FullName,
                profile.School,
                verification.Status,
                verification.SubmittedAt))
            .Take(RecentItemsLimit)
            .ToListAsync(cancellationToken);

        var latestWithdrawals = await (
            from withdrawal in dbContext.WithdrawalRequests
            join user in dbContext.Users on withdrawal.RequestedByUserId equals user.Id
            orderby withdrawal.RequestedAt descending
            select new AdminDashboardRecentWithdrawalDto(
                withdrawal.Id,
                user.FullName,
                withdrawal.Amount,
                withdrawal.Status,
                withdrawal.RequestedAt))
            .Take(RecentItemsLimit)
            .ToListAsync(cancellationToken);

        var latestPackagePurchases = await (
            from purchase in dbContext.FeaturePackagePurchases
            join user in dbContext.Users on purchase.BuyerUserId equals user.Id
            join package in dbContext.FeaturePackages on purchase.FeaturePackageId equals package.Id
            join payment in dbContext.Payments on purchase.Id equals payment.FeaturePackagePurchaseId into paymentGroup
            from latestPayment in paymentGroup
                .OrderByDescending(value => value.CreatedAt)
                .Take(1)
                .DefaultIfEmpty()
            orderby purchase.CreatedAt descending
            select new AdminDashboardRecentPackagePurchaseDto(
                purchase.Id,
                user.FullName,
                package.Name,
                purchase.Status.ToString(),
                latestPayment == null ? null : latestPayment.Status,
                purchase.CreatedAt))
            .Take(RecentItemsLimit)
            .ToListAsync(cancellationToken);

        var queues = new AdminDashboardQueuesDto(
            pendingVerifications,
            pendingWithdrawals,
            processingWithdrawals,
            pendingRefunds,
            pendingPackagePurchases);

        return new AdminDashboardStatsResponse(
            new AdminDashboardSummaryDto(
                totalUsers,
                totalStudents,
                totalSmes,
                totalProjects,
                openProjects,
                completedProjects,
                totalPlatformRevenue + totalPackageRevenue),
            queues,
            new AdminDashboardPackageSnapshotDto(
                totalPackagePurchases,
                activePackagePurchases,
                pendingPackagePurchases,
                failedPackagePurchases),
            new AdminDashboardRecentItemsDto(
                latestVerifications,
                latestWithdrawals,
                latestPackagePurchases),
            new AdminDashboardActionsDto(
                queues.PendingVerifications +
                queues.PendingWithdrawals +
                queues.ProcessingWithdrawals +
                queues.PendingRefunds +
                queues.PendingPackagePurchases),
            new AdminDashboardOverdueDto(
                pendingVerificationsOverdue,
                pendingWithdrawalsOverdue,
                pendingRefundsOverdue),
            new AdminDashboardMoneyPipelineDto(
                escrowHeldAmount,
                pendingDisbursementAmount,
                pendingRefundAmount),
            new AdminDashboardWorkflowBottlenecksDto(
                waitingStudentAcceptance,
                waitingSmePayment,
                projectsInReview));
    }
}
