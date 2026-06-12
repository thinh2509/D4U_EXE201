namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class FeaturePackage
{
    public Guid Id { get; set; }
    public FeaturePackageRole Role { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Currency { get; set; } = "VND";
    public int DurationDays { get; set; }
    public string EntitlementCode { get; set; } = string.Empty;
    public int? UsageLimit { get; set; }
    public int? MaxActiveOpenProjectsOverride { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
