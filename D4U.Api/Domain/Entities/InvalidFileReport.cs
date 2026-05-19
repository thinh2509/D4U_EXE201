namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class InvalidFileReport
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid SubmissionId { get; set; }
    public Guid ReportedByUserId { get; set; }
    public InvalidFileReason ReasonCode { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = "OPEN";
    public DateTimeOffset ReuploadDueAt { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

