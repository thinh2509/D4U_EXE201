namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class Escrow
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid SmeProfileId { get; set; }
    public Guid StudentProfileId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "VND";
    public decimal PlatformFeeRate { get; set; }
    public decimal? PlatformFeeAmount { get; set; }
    public EscrowStatus Status { get; set; } = EscrowStatus.PENDING_PAYMENT;
    public DateTimeOffset? FundedAt { get; set; }
    public DateTimeOffset? ReleasedAt { get; set; }
    public DateTimeOffset? RefundedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

