namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class SmeSubscription
{
    public Guid Id { get; set; }
    public Guid SmeProfileId { get; set; }
    public Guid SubscriptionPlanId { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? CurrentPeriodEnd { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

