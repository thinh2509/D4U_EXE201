namespace D4U.Api.Controllers;

using System.Security.Claims;
using D4U.Api.Application.Features.Projects;
using D4U.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1/files")]
[Authorize]
public sealed class FilesController(ISubmissionFileService submissionFileService) : ControllerBase
{
    [HttpPost("submissions")]
    [Authorize(Roles = nameof(UserRole.STUDENT))]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(20 * 1024 * 1024)]
    public async Task<ActionResult<SubmissionUploadResponse>> UploadSubmission(
        IFormFile file,
        CancellationToken cancellationToken)
    {
        var response = await submissionFileService.UploadAsync(GetRequiredUserId(), file, cancellationToken);
        return Created(string.Empty, response);
    }

    [HttpGet("{fileId:guid}/download")]
    public async Task<IActionResult> Download(
        Guid fileId,
        CancellationToken cancellationToken)
    {
        var file = await submissionFileService.GetDownloadAsync(GetRequiredUserId(), fileId, cancellationToken);
        var absolutePath = submissionFileService.GetAbsolutePath(file);

        if (!System.IO.File.Exists(absolutePath))
        {
            return NotFound();
        }

        return PhysicalFile(absolutePath, file.MimeType, file.OriginalFilename);
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
