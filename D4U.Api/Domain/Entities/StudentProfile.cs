namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class StudentProfile
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string School { get; set; } = string.Empty;
    public string Major { get; set; } = string.Empty;
    public int StudyStartYear { get; set; }
    public string? Bio { get; set; }
    public string OnboardingStatus { get; set; } = "INCOMPLETE";
    public string VerificationStatus { get; set; } = "NOT_SUBMITTED";
    public decimal AverageRating { get; set; }
    public int CompletedProjectsCount { get; set; }
    public bool CanWithdraw { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

