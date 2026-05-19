namespace D4U.Api.Controllers;

using System.Security.Claims;
using D4U.Api.Application.Features.Profiles;
using D4U.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1/admin/student-verifications")]
[Authorize(Roles = nameof(UserRole.ADMIN))]
public sealed class AdminStudentVerificationsController(IProfileService profileService) : ControllerBase
{
    [HttpPost("{verificationId:guid}/approve")]
    public async Task<ActionResult<StudentVerificationResponse>> Approve(
        Guid verificationId,
        CancellationToken cancellationToken)
    {
        var response = await profileService.ApproveStudentVerificationAsync(
            verificationId,
            GetRequiredUserId(),
            cancellationToken);

        return Ok(response);
    }

    [HttpPost("{verificationId:guid}/reject")]
    public async Task<ActionResult<StudentVerificationResponse>> Reject(
        Guid verificationId,
        RejectStudentVerificationRequest request,
        CancellationToken cancellationToken)
    {
        var response = await profileService.RejectStudentVerificationAsync(
            verificationId,
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
