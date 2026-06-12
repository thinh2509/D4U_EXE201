namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class FeaturePackagePurchase
{
    public Guid Id { get; set; }
    public Guid FeaturePackageId { get; set; }
    public Guid BuyerUserId { get; set; }
    public FeaturePackagePurchaseStatus Status { get; set; } = FeaturePackagePurchaseStatus.PENDING;
    public decimal Price { get; set; }
    public string Currency { get; set; } = "VND";
    public DateTimeOffset? ActivatedAt { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
