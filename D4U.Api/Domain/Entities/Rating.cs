namespace D4U.Api.Domain.Entities;

using D4U.Api.Domain.Enums;

public sealed class Rating
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid RaterUserId { get; set; }
    public Guid RatedUserId { get; set; }
    public int RatingValue { get; set; }
    public string? Comment { get; set; }
    public bool IsPublic { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

