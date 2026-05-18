namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class ProjectOffer
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid StudentProfileId { get; set; }
    public Guid? ApplicationId { get; set; }
    public OfferStatus Status { get; set; } = OfferStatus.PENDING_PAYMENT;
    public decimal OfferedAmount { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public DateTimeOffset? AcceptedAt { get; set; }
    public DateTimeOffset? RejectedAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

