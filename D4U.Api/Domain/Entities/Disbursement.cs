namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class Disbursement
{
    public Guid Id { get; set; }
    public Guid EscrowId { get; set; }
    public Guid WalletId { get; set; }
    public decimal GrossAmount { get; set; }
    public decimal PlatformFeeAmount { get; set; }
    public decimal NetAmount { get; set; }
    public string Status { get; set; } = "PENDING";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
}

