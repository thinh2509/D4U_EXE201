namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class DisputeEvidence
{
    public Guid Id { get; set; }
    public Guid DisputeId { get; set; }
    public Guid SubmittedByUserId { get; set; }
    public Guid? FileId { get; set; }
    public string? Comment { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

