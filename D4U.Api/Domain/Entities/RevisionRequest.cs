namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class RevisionRequest
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid SubmissionId { get; set; }
    public Guid RequestedByUserId { get; set; }
    public int RevisionRound { get; set; }
    public string RequestedChanges { get; set; } = string.Empty;
    public string Status { get; set; } = "OPEN";
    public DateTimeOffset DueAt { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

