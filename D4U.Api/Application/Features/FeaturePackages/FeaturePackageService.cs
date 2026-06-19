namespace D4U.Api.Application.Features.FeaturePackages;

using D4U.Api.Application.Common.Exceptions;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

public sealed class FeaturePackageService(D4UDbContext dbContext) : IFeaturePackageService
{
    public async Task<IReadOnlyList<FeaturePackageResponse>> ListPackagesAsync(
        Guid userId,
        FeaturePackageRole? role,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var effectiveRole = role ?? MapRole(user.Role);

        if (user.Role != UserRole.ADMIN && effectiveRole != MapRole(user.Role))
        {
            throw new UnauthorizedAccessException("User cannot view packages of another role.");
        }

        return await dbContext.FeaturePackages
            .Where(value => value.Role == effectiveRole && value.IsActive)
            .OrderBy(value => value.Price)
            .Select(value => new FeaturePackageResponse(
                value.Id,
                value.Role,
                value.Code,
                value.Name,
                value.Description,
                value.Price,
                value.Currency,
                value.DurationDays,
                value.EntitlementCode,
                value.UsageLimit,
                value.MaxActiveOpenProjectsOverride,
                value.IsActive))
            .ToListAsync(cancellationToken);
    }

    public async Task<FeaturePackagePurchaseResponse> CreatePurchaseAsync(
        Guid userId,
        CreateFeaturePackagePurchaseRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var package = await dbContext.FeaturePackages.FirstOrDefaultAsync(
            value => value.Id == request.PackageId && value.IsActive,
            cancellationToken) ?? throw new NotFoundException("Feature package was not found.");

        if (MapRole(user.Role) != package.Role)
        {
            throw new UnauthorizedAccessException("User cannot purchase a package for another role.");
        }

        await EnsurePurchaseEligibilityAsync(user, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var hasActiveEntitlement = await dbContext.UserFeatureEntitlements.AnyAsync(
            value => value.UserId == userId &&
                value.EntitlementCode == package.EntitlementCode &&
                value.Status == FeatureEntitlementStatus.ACTIVE &&
                value.ExpiresAt > now,
            cancellationToken);

        if (hasActiveEntitlement)
        {
            throw new ConflictException("An active entitlement already exists for this package feature.");
        }

        var purchase = new FeaturePackagePurchase
        {
            Id = Guid.NewGuid(),
            FeaturePackageId = package.Id,
            BuyerUserId = userId,
            Status = FeaturePackagePurchaseStatus.PENDING,
            Price = package.Price,
            Currency = package.Currency,
            CreatedAt = now,
            UpdatedAt = now
        };

        await dbContext.FeaturePackagePurchases.AddAsync(purchase, cancellationToken);
        await dbContext.AuditLogs.AddAsync(
            new AuditLog
            {
                Id = Guid.NewGuid(),
                ActorUserId = userId,
                Action = "FEATURE_PACKAGE_PURCHASE_CREATED",
                EntityType = nameof(FeaturePackagePurchase),
                EntityId = purchase.Id,
                AfterJson = $$"""{"packageId":"{{package.Id}}","packageCode":"{{package.Code}}","status":"{{purchase.Status}}","price":{{purchase.Price}}}""",
                CreatedAt = now
            },
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await BuildPurchaseResponseAsync(purchase.Id, cancellationToken)
            ?? throw new InvalidOperationException("Purchase could not be loaded after creation.");
    }

    public async Task<IReadOnlyList<FeaturePackagePurchaseResponse>> ListMyPurchasesAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var purchaseIds = await dbContext.FeaturePackagePurchases
            .Where(value => value.BuyerUserId == userId)
            .OrderByDescending(value => value.CreatedAt)
            .Select(value => value.Id)
            .ToListAsync(cancellationToken);

        var results = new List<FeaturePackagePurchaseResponse>(purchaseIds.Count);
        foreach (var purchaseId in purchaseIds)
        {
            var item = await BuildPurchaseResponseAsync(purchaseId, cancellationToken);
            if (item is not null)
            {
                results.Add(item);
            }
        }

        return results;
    }

    public async Task<IReadOnlyList<FeaturePackagePurchaseResponse>> ListAdminPurchasesAsync(
        CancellationToken cancellationToken = default)
    {
        var purchaseIds = await dbContext.FeaturePackagePurchases
            .OrderByDescending(value => value.CreatedAt)
            .Select(value => value.Id)
            .ToListAsync(cancellationToken);

        var results = new List<FeaturePackagePurchaseResponse>(purchaseIds.Count);
        foreach (var purchaseId in purchaseIds)
        {
            var item = await BuildPurchaseResponseAsync(purchaseId, cancellationToken);
            if (item is not null)
            {
                results.Add(item);
            }
        }

        return results;
    }

    private async Task<FeaturePackagePurchaseResponse?> BuildPurchaseResponseAsync(
        Guid purchaseId,
        CancellationToken cancellationToken)
    {
        var query =
            from purchase in dbContext.FeaturePackagePurchases
            join package in dbContext.FeaturePackages on purchase.FeaturePackageId equals package.Id
            where purchase.Id == purchaseId
            select new { purchase, package };

        var item = await query.FirstOrDefaultAsync(cancellationToken);
        if (item is null)
        {
            return null;
        }

        var payment = await dbContext.Payments
            .Where(value => value.FeaturePackagePurchaseId == purchaseId)
            .OrderByDescending(value => value.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
        var entitlement = await dbContext.UserFeatureEntitlements
            .FirstOrDefaultAsync(value => value.FeaturePackagePurchaseId == purchaseId, cancellationToken);

        return new FeaturePackagePurchaseResponse(
            item.purchase.Id,
            item.package.Id,
            item.package.Code,
            item.package.Name,
            item.package.Role,
            item.purchase.Status,
            item.purchase.Price,
            item.purchase.Currency,
            item.purchase.ActivatedAt,
            item.purchase.ExpiresAt,
            item.purchase.CancelledAt,
            item.purchase.CreatedAt,
            item.purchase.UpdatedAt,
            payment?.Id,
            payment?.Status,
            payment?.CheckoutUrl,
            payment?.ExpiresAt,
            entitlement?.Id,
            entitlement?.Status);
    }

    private async Task<User> RequireUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await dbContext.Users.FirstOrDefaultAsync(value => value.Id == userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("User was not found.");
    }

    private async Task EnsurePurchaseEligibilityAsync(User user, CancellationToken cancellationToken)
    {
        switch (user.Role)
        {
            case UserRole.STUDENT:
            {
                var profile = await dbContext.StudentProfiles.FirstOrDefaultAsync(
                    value => value.UserId == user.Id,
                    cancellationToken);

                if (profile is null)
                {
                    throw new ForbiddenException("Bạn cần tạo hồ sơ sinh viên trước khi mua gói tính năng.");
                }

                if (!string.Equals(profile.VerificationStatus, "APPROVED", StringComparison.OrdinalIgnoreCase))
                {
                    throw new ForbiddenException("Bạn cần hoàn tất xác thực sinh viên trước khi mua gói tính năng.");
                }

                break;
            }
            case UserRole.SME:
            {
                var profile = await dbContext.SmeProfiles.FirstOrDefaultAsync(
                    value => value.UserId == user.Id,
                    cancellationToken);

                if (profile is null)
                {
                    throw new ForbiddenException("Bạn cần tạo hồ sơ doanh nghiệp trước khi mua gói tính năng.");
                }

                break;
            }
        }
    }

    private static FeaturePackageRole MapRole(UserRole role)
    {
        return role switch
        {
            UserRole.SME => FeaturePackageRole.SME,
            UserRole.STUDENT => FeaturePackageRole.STUDENT,
            _ => throw new UnauthorizedAccessException("Admin users cannot purchase feature packages.")
        };
    }
}
