namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class UserFeatureEntitlement
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid FeaturePackageId { get; set; }
    public Guid FeaturePackagePurchaseId { get; set; }
    public string EntitlementCode { get; set; } = string.Empty;
    public FeatureEntitlementStatus Status { get; set; } = FeatureEntitlementStatus.ACTIVE;
    public int? UsageLimit { get; set; }
    public int UsageConsumed { get; set; }
    public DateTimeOffset ActivatedAt { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
