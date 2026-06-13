namespace D4U.Api.Application.Features.FeaturePackages;

using D4U.Api.Domain.Enums;

public interface IFeatureEntitlementService
{
    Task<bool> HasActiveEntitlementAsync(
        Guid userId,
        string entitlementCode,
        CancellationToken cancellationToken = default);

    Task<ActiveFeaturePackageSummaryResponse?> GetActivePackageSummaryAsync(
        Guid userId,
        FeaturePackageRole role,
        CancellationToken cancellationToken = default);

    Task<bool> HasExpiredOpenProjectBoostPackageAsync(
        Guid userId,
        FeaturePackageRole role,
        int? minimumOverrideExclusive,
        CancellationToken cancellationToken = default);

    Task<UsableFeatureEntitlementResponse> EnsureUsableEntitlementAsync(
        Guid userId,
        string entitlementCode,
        string featureDisplayName,
        CancellationToken cancellationToken = default);

    Task<FeatureUsageConsumptionResponse> ConsumeUsageAsync(
        Guid entitlementId,
        int amount,
        string featureDisplayName,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<UserFeatureEntitlementResponse>> ListMyEntitlementsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}
