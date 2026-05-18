namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class Dispute
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid? EscrowId { get; set; }
    public Guid OpenedByUserId { get; set; }
    public Guid? AgainstUserId { get; set; }
    public string ReasonCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DisputeStatus Status { get; set; } = DisputeStatus.OPEN;
    public Guid? AssignedAdminId { get; set; }
    public string? DecisionType { get; set; }
    public decimal SmeRefundAmount { get; set; }
    public decimal StudentPayoutAmount { get; set; }
    public decimal PlatformFeeAmount { get; set; }
    public string? DecisionRationale { get; set; }
    public DateTimeOffset OpenedAt { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
}

