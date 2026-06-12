namespace D4U.Api.Application.Features.FeaturePackages;

public interface IFeatureEntitlementService
{
    Task<bool> HasActiveEntitlementAsync(
        Guid userId,
        string entitlementCode,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<UserFeatureEntitlementResponse>> ListMyEntitlementsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}
