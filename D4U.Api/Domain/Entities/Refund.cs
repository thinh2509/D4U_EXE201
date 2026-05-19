namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class Refund
{
    public Guid Id { get; set; }
    public Guid EscrowId { get; set; }
    public Guid? PaymentId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "VND";
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "PENDING";
    public string? ProviderRefundId { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
}

