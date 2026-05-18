namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class ProjectStatusHistory
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public ProjectStatus? FromStatus { get; set; }
    public ProjectStatus ToStatus { get; set; }
    public Guid? ChangedByUserId { get; set; }
    public string? ChangeReason { get; set; }
    public string? MetadataJson { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

