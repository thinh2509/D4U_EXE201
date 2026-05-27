namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class ReviewAction
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid SubmissionId { get; set; }
    public Guid? ReviewerUserId { get; set; }
    public ReviewActionType Action { get; set; }
    public string? Comment { get; set; }
    public string? RequestedChanges { get; set; }
    public int? RevisionRound { get; set; }
    public DateTimeOffset? DueAt { get; set; }
    public InvalidFileReason? InvalidFileReason { get; set; }
    public DateTimeOffset? ReuploadDueAt { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public string? MetadataJson { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

