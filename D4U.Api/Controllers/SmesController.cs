namespace D4U.Api.Controllers;

using System.Security.Claims;
using D4U.Api.Application.Features.Profiles;
using D4U.Api.Application.Features.Projects;
using D4U.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1/smes")]
[Authorize(Roles = nameof(UserRole.SME))]
public sealed class SmesController(
    IProfileService profileService,
    IProjectService projectService) : ControllerBase
{
    [HttpGet("me")]
    public async Task<ActionResult<SmeProfileResponse>> GetMe(CancellationToken cancellationToken)
    {
        var userId = GetRequiredUserId();
        var profile = await profileService.GetSmeProfileAsync(userId, cancellationToken);

        return profile is null ? NotFound() : Ok(profile);
    }

    [HttpPut("me")]
    public async Task<ActionResult<SmeProfileResponse>> UpsertMe(
        UpsertSmeProfileRequest request,
        CancellationToken cancellationToken)
    {
        var response = await profileService.UpsertSmeProfileAsync(
            GetRequiredUserId(),
            request,
            cancellationToken);

        return Ok(response);
    }

    [HttpGet("me/applications")]
    public async Task<ActionResult<IReadOnlyList<SmeProjectApplicationSummaryResponse>>> ListMyApplications(
        CancellationToken cancellationToken)
    {
        var response = await projectService.ListMyApplicationsAsync(GetRequiredUserId(), cancellationToken);
        return Ok(response);
    }

    [HttpGet("me/offers")]
    public async Task<ActionResult<IReadOnlyList<ProjectOfferFlowResponse>>> ListMyOffers(
        CancellationToken cancellationToken)
    {
        var response = await projectService.ListMySmeOffersAsync(GetRequiredUserId(), cancellationToken);
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
