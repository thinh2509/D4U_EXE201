namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class StudentVerification
{
    public Guid Id { get; set; }
    public Guid StudentProfileId { get; set; }
    public Guid DocumentFileId { get; set; }
    public string Status { get; set; } = "PENDING";
    public Guid? ReviewedByAdminId { get; set; }
    public string? RejectionReason { get; set; }
    public DateTimeOffset SubmittedAt { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
}

