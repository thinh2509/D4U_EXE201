namespace D4U.Api.Controllers;

using System.Security.Claims;
using D4U.Api.Application.Features.Projects;
using D4U.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1/offers")]
[Authorize(Roles = nameof(UserRole.STUDENT))]
public sealed class OffersController(IProjectService projectService) : ControllerBase
{
    [HttpPost("{offerId:guid}/accept")]
    public async Task<ActionResult<ProjectOfferResponse>> Accept(
        Guid offerId,
        CancellationToken cancellationToken)
    {
        var response = await projectService.AcceptOfferAsync(GetRequiredUserId(), offerId, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{offerId:guid}/reject")]
    public async Task<ActionResult<ProjectOfferResponse>> Reject(
        Guid offerId,
        CancellationToken cancellationToken)
    {
        var response = await projectService.RejectOfferAsync(GetRequiredUserId(), offerId, cancellationToken);
        return Ok(response);
    }

    private Guid GetRequiredUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(value, out var userId))
        {
            throw new UnauthorizedAccessException("User id claim is missing.");
        }

        return userId;
    }
}
