namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class ProjectAttachment
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid FileId { get; set; }
    public string AttachmentType { get; set; } = "BRIEF";
    public DateTimeOffset CreatedAt { get; set; }
}

