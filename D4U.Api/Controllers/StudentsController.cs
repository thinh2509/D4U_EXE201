namespace D4U.Api.Controllers;

using System.Security.Claims;
using D4U.Api.Application.Features.Profiles;
using D4U.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1/students")]
[Authorize(Roles = nameof(UserRole.STUDENT))]
public sealed class StudentsController(IProfileService profileService) : ControllerBase
{
    [HttpGet("me")]
    public async Task<ActionResult<StudentProfileResponse>> GetMe(CancellationToken cancellationToken)
    {
        var userId = GetRequiredUserId();
        var profile = await profileService.GetStudentProfileAsync(userId, cancellationToken);

        return profile is null ? NotFound() : Ok(profile);
    }

    [HttpPut("me")]
    public async Task<ActionResult<StudentProfileResponse>> UpsertMe(
        UpsertStudentProfileRequest request,
        CancellationToken cancellationToken)
    {
        var response = await profileService.UpsertStudentProfileAsync(
            GetRequiredUserId(),
            request,
            cancellationToken);

        return Ok(response);
    }

    [HttpPost("me/verification")]
    public async Task<ActionResult<StudentVerificationResponse>> SubmitVerification(
        SubmitStudentVerificationRequest request,
        CancellationToken cancellationToken)
    {
        var response = await profileService.SubmitStudentVerificationAsync(
            GetRequiredUserId(),
            request,
            cancellationToken);

        return Created(string.Empty, response);
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
