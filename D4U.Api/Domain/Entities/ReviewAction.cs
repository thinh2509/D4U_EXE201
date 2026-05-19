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
    public DateTimeOffset CreatedAt { get; set; }
}

