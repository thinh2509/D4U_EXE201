namespace D4U.Api.Application.Features.Admin;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

public sealed class AdminDashboardService(D4UDbContext dbContext) : IAdminDashboardService
{
    private const int RecentItemsLimit = 5;

    public async Task<AdminDashboardStatsResponse> GetStatsAsync(CancellationToken cancellationToken = default)
    {
        var totalUsersTask = dbContext.Users.CountAsync(cancellationToken);
        var totalStudentsTask = dbContext.Users.CountAsync(value => value.Role == UserRole.STUDENT, cancellationToken);
        var totalSmesTask = dbContext.Users.CountAsync(value => value.Role == UserRole.SME, cancellationToken);
        var totalProjectsTask = dbContext.Projects.CountAsync(cancellationToken);
        var openProjectsTask = dbContext.Projects.CountAsync(value => value.Status == ProjectStatus.OPEN, cancellationToken);
        var completedProjectsTask = dbContext.Projects.CountAsync(value => value.Status == ProjectStatus.COMPLETED, cancellationToken);

        var pendingVerificationsTask = dbContext.StudentVerifications.CountAsync(value => value.Status == "PENDING", cancellationToken);
        var pendingWithdrawalsTask = dbContext.WithdrawalRequests.CountAsync(value => value.Status == "PENDING", cancellationToken);
        var processingWithdrawalsTask = dbContext.WithdrawalRequests.CountAsync(value => value.Status == "PROCESSING", cancellationToken);
        var pendingRefundsTask = dbContext.Refunds.CountAsync(value => value.Status == "PENDING", cancellationToken);
        var pendingPackagePurchasesTask = dbContext.FeaturePackagePurchases.CountAsync(
            value => value.Status == FeaturePackagePurchaseStatus.PENDING,
            cancellationToken);

        var totalPackagePurchasesTask = dbContext.FeaturePackagePurchases.CountAsync(cancellationToken);
        var activePackagePurchasesTask = dbContext.FeaturePackagePurchases.CountAsync(
            value => value.Status == FeaturePackagePurchaseStatus.ACTIVE,
            cancellationToken);
        var failedPackagePurchasesTask = dbContext.FeaturePackagePurchases.CountAsync(
            value => value.Status == FeaturePackagePurchaseStatus.FAILED,
            cancellationToken);

        var latestVerificationsTask = (
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

        var latestWithdrawalsTask = (
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

        var latestPackagePurchasesTask = (
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

        await Task.WhenAll(
            totalUsersTask,
            totalStudentsTask,
            totalSmesTask,
            totalProjectsTask,
            openProjectsTask,
            completedProjectsTask,
            pendingVerificationsTask,
            pendingWithdrawalsTask,
            processingWithdrawalsTask,
            pendingRefundsTask,
            pendingPackagePurchasesTask,
            totalPackagePurchasesTask,
            activePackagePurchasesTask,
            failedPackagePurchasesTask,
            latestVerificationsTask,
            latestWithdrawalsTask,
            latestPackagePurchasesTask);

        var queues = new AdminDashboardQueuesDto(
            pendingVerificationsTask.Result,
            pendingWithdrawalsTask.Result,
            processingWithdrawalsTask.Result,
            pendingRefundsTask.Result,
            pendingPackagePurchasesTask.Result);

        return new AdminDashboardStatsResponse(
            new AdminDashboardSummaryDto(
                totalUsersTask.Result,
                totalStudentsTask.Result,
                totalSmesTask.Result,
                totalProjectsTask.Result,
                openProjectsTask.Result,
                completedProjectsTask.Result),
            queues,
            new AdminDashboardPackageSnapshotDto(
                totalPackagePurchasesTask.Result,
                activePackagePurchasesTask.Result,
                pendingPackagePurchasesTask.Result,
                failedPackagePurchasesTask.Result),
            new AdminDashboardRecentItemsDto(
                latestVerificationsTask.Result,
                latestWithdrawalsTask.Result,
                latestPackagePurchasesTask.Result),
            new AdminDashboardActionsDto(
                queues.PendingVerifications +
                queues.PendingWithdrawals +
                queues.ProcessingWithdrawals +
                queues.PendingRefunds +
                queues.PendingPackagePurchases));
    }
}
