namespace D4U.Api.Application.Features.FeaturePackages;

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
