namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class DesignCategory
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}

