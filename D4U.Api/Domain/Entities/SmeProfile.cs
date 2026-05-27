namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class SmeProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string RepresentativeName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string BusinessField { get; set; } = string.Empty;
    public Guid? LogoFileId { get; set; }
    public string OnboardingStatus { get; set; } = "INCOMPLETE";
    public decimal AverageRating { get; set; }
    public int CompletedProjectsCount { get; set; }
    public int ActiveOpenProjectCount { get; set; }
    public Guid SubscriptionPlanId { get; set; }
    public DateTimeOffset SubscriptionStartedAt { get; set; }
    public DateTimeOffset? SubscriptionCurrentPeriodEnd { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

