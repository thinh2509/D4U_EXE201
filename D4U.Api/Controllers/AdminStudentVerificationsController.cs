namespace D4U.Api.Controllers;

using System.Security.Claims;
using D4U.Api.Application.Common.Files;
using D4U.Api.Application.Features.Profiles;
using D4U.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1/admin/student-verifications")]
[Authorize(Roles = nameof(UserRole.ADMIN))]
public sealed class AdminStudentVerificationsController(
    IProfileService profileService,
    IUploadPathResolver uploadPathResolver) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminStudentVerificationListItemResponse>>> List(
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        var response = await profileService.ListStudentVerificationsAsync(status, cancellationToken);
        return Ok(response);
    }

    [HttpGet("{verificationId:guid}")]
    public async Task<ActionResult<AdminStudentVerificationDetailResponse>> GetDetail(
        Guid verificationId,
        CancellationToken cancellationToken)
    {
        var response = await profileService.GetStudentVerificationDetailAsync(verificationId, cancellationToken);
        return Ok(response);
    }

    [HttpGet("{verificationId:guid}/document")]
    public async Task<IActionResult> GetDocument(
        Guid verificationId,
        CancellationToken cancellationToken)
    {
        var document = await profileService.GetStudentVerificationDocumentAsync(verificationId, cancellationToken);
        var absolutePath = uploadPathResolver.GetAbsolutePath(document.StorageKey);

        if (!System.IO.File.Exists(absolutePath))
        {
            return NotFound();
        }

        return PhysicalFile(absolutePath, document.MimeType, document.OriginalFilename);
    }

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
