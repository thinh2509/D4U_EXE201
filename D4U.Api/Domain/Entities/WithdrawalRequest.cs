namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class WithdrawalRequest
{
    public Guid Id { get; set; }
    public Guid WalletId { get; set; }
    public Guid RequestedByUserId { get; set; }
    public Guid PaymentMethodId { get; set; }
    public decimal Amount { get; set; }
    public decimal FeeAmount { get; set; } = 5000m;
    public decimal NetAmount { get; set; }
    public string Status { get; set; } = "PENDING";
    public string? FailureReason { get; set; }
    public DateTimeOffset RequestedAt { get; set; }
    public DateTimeOffset? ProcessedAt { get; set; }
}

