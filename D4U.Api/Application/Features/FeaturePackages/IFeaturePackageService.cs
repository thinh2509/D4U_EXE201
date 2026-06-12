namespace D4U.Api.Application.Features.FeaturePackages;

using D4U.Api.Domain.Enums;

public interface IFeaturePackageService
{
    Task<IReadOnlyList<FeaturePackageResponse>> ListPackagesAsync(
        Guid userId,
        FeaturePackageRole? role,
        CancellationToken cancellationToken = default);

    Task<FeaturePackagePurchaseResponse> CreatePurchaseAsync(
        Guid userId,
        CreateFeaturePackagePurchaseRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<FeaturePackagePurchaseResponse>> ListMyPurchasesAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<FeaturePackagePurchaseResponse>> ListAdminPurchasesAsync(
        CancellationToken cancellationToken = default);
}
