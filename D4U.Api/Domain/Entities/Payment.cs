namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class Payment
{
    public Guid Id { get; set; }
    public Guid PayerUserId { get; set; }
    public Guid? EscrowId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "VND";
    public string Provider { get; set; } = string.Empty;
    public long? ProviderOrderCode { get; set; }
    public string? ProviderTransactionId { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.PENDING;
    public string? CheckoutUrl { get; set; }
    public string? QrCode { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public DateTimeOffset? PaidAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public string? RawProviderResponseJson { get; set; }
}

