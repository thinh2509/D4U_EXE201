namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class Wallet
{
    public Guid Id { get; set; }
    public Guid OwnerUserId { get; set; }
    public Guid? StudentProfileId { get; set; }
    public string Currency { get; set; } = "VND";
    public decimal AvailableBalance { get; set; }
    public decimal PendingBalance { get; set; }
    public decimal LockedBalance { get; set; }
    public WalletStatus Status { get; set; } = WalletStatus.ACTIVE;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

