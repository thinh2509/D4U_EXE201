namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class AdminProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string PermissionLevel { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}

