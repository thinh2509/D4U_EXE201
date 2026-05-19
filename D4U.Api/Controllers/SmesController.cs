namespace D4U.Api.Controllers;

using System.Security.Claims;
using D4U.Api.Application.Features.Profiles;
using D4U.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1/smes")]
[Authorize(Roles = nameof(UserRole.SME))]
public sealed class SmesController(IProfileService profileService) : ControllerBase
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
