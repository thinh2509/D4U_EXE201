namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class Project
{
    public Guid Id { get; set; }
    public Guid SmeProfileId { get; set; }
    public Guid? SelectedStudentProfileId { get; set; }
    public Guid DesignCategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Brief { get; set; } = string.Empty;
    public string? UsagePurpose { get; set; }
    public ProjectType ProjectType { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.DRAFT;
    public decimal BudgetAmount { get; set; }
    public string Currency { get; set; } = "VND";
    public DateTimeOffset TotalDeadlineAt { get; set; }
    public DateTimeOffset SketchDeadlineAt { get; set; }
    public DateTimeOffset FinalDeadlineAt { get; set; }
    public int MaxRevisionRounds { get; set; } = 2;
    public int CurrentRevisionRound { get; set; }
    public bool IsConfidential { get; set; }
    public bool AllowStudentPortfolio { get; set; } = true;
    public DateTimeOffset? RatingDueAt { get; set; }
    public DateTimeOffset? PublishedAt { get; set; }
    public DateTimeOffset? AcceptedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

