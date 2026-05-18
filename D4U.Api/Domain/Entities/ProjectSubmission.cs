namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class ProjectSubmission
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid MilestoneId { get; set; }
    public Guid SubmittedByStudentId { get; set; }
    public SubmissionType SubmissionType { get; set; }
    public int RevisionRound { get; set; }
    public string? Description { get; set; }
    public SubmissionStatus Status { get; set; } = SubmissionStatus.SUBMITTED;
    public DateTimeOffset SubmittedAt { get; set; }
}

