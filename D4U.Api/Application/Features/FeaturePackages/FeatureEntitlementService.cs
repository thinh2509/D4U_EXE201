namespace D4U.Api.Application.Features.FeaturePackages;

using D4U.Api.Application.Common.Exceptions;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

public sealed class FeatureEntitlementService(D4UDbContext dbContext) : IFeatureEntitlementService
{
    public async Task<bool> HasActiveEntitlementAsync(
        Guid userId,
        string entitlementCode,
        CancellationToken cancellationToken = default)
    {
        await ExpireOverdueEntitlementsAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;
        return await dbContext.UserFeatureEntitlements.AnyAsync(
            value => value.UserId == userId &&
                value.EntitlementCode == entitlementCode &&
                value.Status == FeatureEntitlementStatus.ACTIVE &&
                value.ExpiresAt > now,
            cancellationToken);
    }

    public async Task<ActiveFeaturePackageSummaryResponse?> GetActivePackageSummaryAsync(
        Guid userId,
        FeaturePackageRole role,
        CancellationToken cancellationToken = default)
    {
        await ExpireOverdueEntitlementsAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;
        return await (
            from entitlement in dbContext.UserFeatureEntitlements
            join package in dbContext.FeaturePackages on entitlement.FeaturePackageId equals package.Id
            where entitlement.UserId == userId &&
                entitlement.Status == FeatureEntitlementStatus.ACTIVE &&
                entitlement.ExpiresAt > now &&
                package.Role == role &&
                package.IsActive
            orderby package.MaxActiveOpenProjectsOverride descending, entitlement.ExpiresAt descending
            select new ActiveFeaturePackageSummaryResponse(
                package.Id,
                package.Code,
                package.Name,
                package.Description,
                entitlement.EntitlementCode,
                package.Price,
                package.Currency,
                package.DurationDays,
                package.MaxActiveOpenProjectsOverride,
                entitlement.ActivatedAt,
                entitlement.ExpiresAt))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<bool> HasExpiredOpenProjectBoostPackageAsync(
        Guid userId,
        FeaturePackageRole role,
        int? minimumOverrideExclusive,
        CancellationToken cancellationToken = default)
    {
        await ExpireOverdueEntitlementsAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var threshold = minimumOverrideExclusive ?? 0;

        return await (
            from entitlement in dbContext.UserFeatureEntitlements
            join package in dbContext.FeaturePackages on entitlement.FeaturePackageId equals package.Id
            where entitlement.UserId == userId &&
                package.Role == role &&
                package.MaxActiveOpenProjectsOverride.HasValue &&
                package.MaxActiveOpenProjectsOverride.Value > threshold &&
                (entitlement.Status != FeatureEntitlementStatus.ACTIVE || entitlement.ExpiresAt <= now)
            select entitlement.Id)
            .AnyAsync(cancellationToken);
    }

    public async Task<UsableFeatureEntitlementResponse> EnsureUsableEntitlementAsync(
        Guid userId,
        string entitlementCode,
        string featureDisplayName,
        CancellationToken cancellationToken = default)
    {
        await ExpireOverdueEntitlementsAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var entitlement = await dbContext.UserFeatureEntitlements
            .Where(value => value.UserId == userId && value.EntitlementCode == entitlementCode)
            .OrderByDescending(value => value.ExpiresAt)
            .ThenByDescending(value => value.UpdatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (entitlement is null)
        {
            throw new ForbiddenException($"Bạn cần mua gói AI để {featureDisplayName}.");
        }

        if (entitlement.Status != FeatureEntitlementStatus.ACTIVE || entitlement.ExpiresAt <= now)
        {
            throw new ForbiddenException($"Gói AI của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục {featureDisplayName}.");
        }

        var remainingUsage = entitlement.UsageLimit.HasValue
            ? Math.Max(0, entitlement.UsageLimit.Value - entitlement.UsageConsumed)
            : int.MaxValue;

        if (entitlement.UsageLimit.HasValue && remainingUsage <= 0)
        {
            throw new ConflictException($"Bạn đã dùng hết lượt {featureDisplayName} của gói hiện tại.");
        }

        return new UsableFeatureEntitlementResponse(
            entitlement.Id,
            entitlement.EntitlementCode,
            entitlement.UsageLimit,
            entitlement.UsageConsumed,
            remainingUsage,
            entitlement.ActivatedAt,
            entitlement.ExpiresAt);
    }

    public async Task<FeatureUsageConsumptionResponse> ConsumeUsageAsync(
        Guid entitlementId,
        int amount,
        string featureDisplayName,
        CancellationToken cancellationToken = default)
    {
        if (amount <= 0)
        {
            throw new ValidationException("Usage amount must be greater than 0.");
        }

        await ExpireOverdueEntitlementsAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var updatedRows = await dbContext.UserFeatureEntitlements
            .Where(value =>
                value.Id == entitlementId &&
                value.Status == FeatureEntitlementStatus.ACTIVE &&
                value.ExpiresAt > now &&
                (!value.UsageLimit.HasValue || value.UsageConsumed + amount <= value.UsageLimit.Value))
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(value => value.UsageConsumed, value => value.UsageConsumed + amount)
                    .SetProperty(value => value.UpdatedAt, now),
                cancellationToken);

        if (updatedRows == 0)
        {
            throw new ConflictException($"Bạn đã dùng hết lượt {featureDisplayName} của gói hiện tại.");
        }

        var entitlement = await dbContext.UserFeatureEntitlements
            .Where(value => value.Id == entitlementId)
            .Select(value => new
            {
                value.Id,
                value.UsageLimit,
                value.UsageConsumed
            })
            .FirstAsync(cancellationToken);

        var remainingUsage = entitlement.UsageLimit.HasValue
            ? Math.Max(0, entitlement.UsageLimit.Value - entitlement.UsageConsumed)
            : int.MaxValue;

        return new FeatureUsageConsumptionResponse(
            entitlement.Id,
            entitlement.UsageConsumed,
            remainingUsage);
    }

    public async Task<IReadOnlyList<UserFeatureEntitlementResponse>> ListMyEntitlementsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await ExpireOverdueEntitlementsAsync(cancellationToken);

        return await dbContext.UserFeatureEntitlements
            .Where(value => value.UserId == userId)
            .OrderByDescending(value => value.CreatedAt)
            .Select(value => new UserFeatureEntitlementResponse(
                value.Id,
                value.FeaturePackageId,
                value.FeaturePackagePurchaseId,
                value.EntitlementCode,
                value.Status,
                value.UsageLimit,
                value.UsageConsumed,
                value.ActivatedAt,
                value.ExpiresAt))
            .ToListAsync(cancellationToken);
    }

    public async Task ExpireOverdueEntitlementsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var overdue = await dbContext.UserFeatureEntitlements
            .Where(value => value.Status == FeatureEntitlementStatus.ACTIVE && value.ExpiresAt <= now)
            .ToListAsync(cancellationToken);

        if (overdue.Count == 0)
        {
            return;
        }

        foreach (var entitlement in overdue)
        {
            entitlement.Status = FeatureEntitlementStatus.EXPIRED;
            entitlement.UpdatedAt = now;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
