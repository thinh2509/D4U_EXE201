namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class StudentPortfolioItem
{
    public Guid Id { get; set; }
    public Guid StudentProfileId { get; set; }
    public Guid? SourceProjectId { get; set; }
    public Guid? DesignCategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string? ProjectUrl { get; set; }
    public string? FileUrl { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public PortfolioItemStatus Status { get; set; } = PortfolioItemStatus.PRIVATE;
    public bool IsFeatured { get; set; }
    public DateTimeOffset? PublishedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
