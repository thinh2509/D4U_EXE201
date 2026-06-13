namespace D4U.Api.Application.Features.FeaturePackages;

using D4U.Api.Domain.Enums;

public sealed record FeaturePackageResponse(
    Guid Id,
    FeaturePackageRole Role,
    string Code,
    string Name,
    string Description,
    decimal Price,
    string Currency,
    int DurationDays,
    string EntitlementCode,
    int? UsageLimit,
    int? MaxActiveOpenProjectsOverride,
    bool IsActive);

public sealed record CreateFeaturePackagePurchaseRequest(
    Guid PackageId);

public sealed record FeaturePackagePurchaseResponse(
    Guid Id,
    Guid PackageId,
    string PackageCode,
    string PackageName,
    FeaturePackageRole Role,
    FeaturePackagePurchaseStatus Status,
    decimal Price,
    string Currency,
    DateTimeOffset? ActivatedAt,
    DateTimeOffset? ExpiresAt,
    DateTimeOffset? CancelledAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    Guid? PaymentId,
    PaymentStatus? PaymentStatus,
    string? CheckoutUrl,
    DateTimeOffset? PaymentExpiresAt,
    Guid? EntitlementId,
    FeatureEntitlementStatus? EntitlementStatus);

public sealed record FeaturePackagePaymentResponse(
    Guid PurchaseId,
    Guid PaymentId,
    PaymentStatus Status,
    string? CheckoutUrl,
    string? QrCode,
    DateTimeOffset? ExpiresAt);

public sealed record UserFeatureEntitlementResponse(
    Guid Id,
    Guid PackageId,
    Guid PurchaseId,
    string EntitlementCode,
    FeatureEntitlementStatus Status,
    int? UsageLimit,
    int UsageConsumed,
    DateTimeOffset ActivatedAt,
    DateTimeOffset ExpiresAt);

public sealed record ActiveFeaturePackageSummaryResponse(
    Guid PackageId,
    string PackageCode,
    string PackageName,
    string Description,
    string EntitlementCode,
    decimal Price,
    string Currency,
    int DurationDays,
    int? MaxActiveOpenProjectsOverride,
    DateTimeOffset ActivatedAt,
    DateTimeOffset ExpiresAt);

public sealed record UsableFeatureEntitlementResponse(
    Guid EntitlementId,
    string EntitlementCode,
    int? UsageLimit,
    int UsageConsumed,
    int RemainingUsage,
    DateTimeOffset ActivatedAt,
    DateTimeOffset ExpiresAt);

public sealed record FeatureUsageConsumptionResponse(
    Guid EntitlementId,
    int UsageConsumed,
    int RemainingUsage);
