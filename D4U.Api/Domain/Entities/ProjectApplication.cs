namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class ProjectApplication
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid StudentProfileId { get; set; }
    public decimal ProposedPrice { get; set; }
    public string CoverLetter { get; set; } = string.Empty;
    public int? EstimatedDurationDays { get; set; }
    public string Status { get; set; } = "SUBMITTED";
    public DateTimeOffset SubmittedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

