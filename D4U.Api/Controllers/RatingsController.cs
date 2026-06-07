namespace D4U.Api.Controllers;

using System.Security.Claims;
using D4U.Api.Application.Features.Ratings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1")]
[Authorize]
public sealed class RatingsController(IRatingService ratingService) : ControllerBase
{
    [HttpPost("projects/{projectId:guid}/ratings")]
    public async Task<ActionResult<RatingResponse>> SubmitProjectRating(
        Guid projectId,
        SubmitRatingRequest request,
        CancellationToken cancellationToken)
    {
        var response = await ratingService.SubmitProjectRatingAsync(
            GetRequiredUserId(),
            projectId,
            request,
            cancellationToken);

        return Created(string.Empty, response);
    }

    [HttpGet("ratings/me")]
    public async Task<ActionResult<IReadOnlyList<RatingResponse>>> ListMyRatings(CancellationToken cancellationToken)
    {
        var response = await ratingService.ListMyRatingsAsync(GetRequiredUserId(), cancellationToken);
        return Ok(response);
    }

    private Guid GetRequiredUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out var userId)
            ? userId
            : throw new UnauthorizedAccessException("User id claim is missing.");
    }
}
