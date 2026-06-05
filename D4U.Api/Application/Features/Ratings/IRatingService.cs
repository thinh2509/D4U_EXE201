namespace D4U.Api.Application.Features.Ratings;

public interface IRatingService
{
    Task<RatingResponse> SubmitProjectRatingAsync(
        Guid userId,
        Guid projectId,
        SubmitRatingRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RatingResponse>> ListMyRatingsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}
