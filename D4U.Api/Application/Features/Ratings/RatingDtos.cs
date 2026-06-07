namespace D4U.Api.Application.Features.Ratings;

public sealed record SubmitRatingRequest(
    int RatingValue,
    string? Comment,
    bool IsPublic = true);

public sealed record RatingResponse(
    Guid Id,
    Guid ProjectId,
    Guid RaterUserId,
    Guid RatedUserId,
    int RatingValue,
    string? Comment,
    bool IsPublic,
    DateTimeOffset CreatedAt);
