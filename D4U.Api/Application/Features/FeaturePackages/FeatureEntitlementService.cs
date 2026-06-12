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
