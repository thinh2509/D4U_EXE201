namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class SubscriptionPlan
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal MonthlyPrice { get; set; }
    public decimal PlatformFeeRate { get; set; }
    public int? MaxActiveOpenProjects { get; set; }
    public decimal? MaxProjectBudget { get; set; }
    public bool IsActive { get; set; } = true;
}

