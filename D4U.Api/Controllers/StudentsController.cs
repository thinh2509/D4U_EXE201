namespace D4U.Api.Controllers;

using System.Security.Cryptography;
using System.Security.Claims;
using D4U.Api.Application.Common.Files;
using D4U.Api.Application.Features.Profiles;
using D4U.Api.Application.Features.Projects;
using D4U.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1/students")]
[Authorize(Roles = nameof(UserRole.STUDENT))]
public sealed class StudentsController(
    IProfileService profileService,
    IProjectService projectService,
    IUploadPathResolver uploadPathResolver) : ControllerBase
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
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<StudentVerificationResponse>> SubmitVerification(
        [FromForm] SubmitStudentVerificationFormRequest request,
        CancellationToken cancellationToken)
    {
        if (request.File is null || request.File.Length == 0)
        {
            throw new InvalidOperationException("Verification file is required.");
        }

        var originalFilename = Path.GetFileName(request.File.FileName);
        var extension = FileMetadataRules.NormalizeExtension(Path.GetExtension(originalFilename));

        if (!FileMetadataRules.IsAllowedExtension(extension))
        {
            throw new InvalidOperationException("Verification document extension must be jpg, png, or pdf.");
        }

        var uploadsRoot = uploadPathResolver.GetUploadsRoot();
        var relativeStorageKey = Path.Combine("student-verifications", $"{Guid.NewGuid():N}.{extension}");
        var absolutePath = Path.Combine(uploadsRoot, relativeStorageKey);
        Directory.CreateDirectory(Path.GetDirectoryName(absolutePath)!);

        string checksum;
        await using (var output = System.IO.File.Create(absolutePath))
        await using (var input = request.File.OpenReadStream())
        {
            using var sha256 = SHA256.Create();
            var buffer = new byte[81920];
            int read;

            while ((read = await input.ReadAsync(buffer.AsMemory(0, buffer.Length), cancellationToken)) > 0)
            {
                await output.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
                sha256.TransformBlock(buffer, 0, read, null, 0);
            }

            sha256.TransformFinalBlock(Array.Empty<byte>(), 0, 0);
            checksum = Convert.ToHexString(sha256.Hash ?? []);
        }

        var metadata = new SubmitStudentVerificationRequest(
            "LOCAL",
            null,
            relativeStorageKey.Replace('\\', '/'),
            originalFilename,
            GetMimeType(extension),
            extension,
            request.File.Length,
            checksum);

        var response = await profileService.SubmitStudentVerificationAsync(
            GetRequiredUserId(),
            metadata,
            cancellationToken);

        return Created(string.Empty, response);
    }

    [HttpPost("me/edu-verification/request")]
    public async Task<ActionResult<StudentEmailVerificationResponse>> RequestEduEmailVerification(
        RequestStudentEduEmailVerificationRequest request,
        CancellationToken cancellationToken)
    {
        var response = await profileService.RequestStudentEduEmailVerificationAsync(
            GetRequiredUserId(),
            request,
            cancellationToken);

        return Ok(response);
    }

    [HttpPost("me/edu-verification/confirm")]
    public async Task<ActionResult<StudentEmailVerificationResponse>> ConfirmEduEmailVerification(
        ConfirmStudentEduEmailVerificationRequest request,
        CancellationToken cancellationToken)
    {
        var response = await profileService.ConfirmStudentEduEmailVerificationAsync(
            GetRequiredUserId(),
            request,
            cancellationToken);

        return Ok(response);
    }

    [HttpGet("me/applications")]
    public async Task<ActionResult<IReadOnlyList<StudentProjectApplicationSummaryResponse>>> ListMyApplications(
        CancellationToken cancellationToken)
    {
        var response = await projectService.ListMyStudentApplicationsAsync(GetRequiredUserId(), cancellationToken);
        return Ok(response);
    }

    [HttpGet("me/offers")]
    public async Task<ActionResult<IReadOnlyList<ProjectOfferFlowResponse>>> ListMyOffers(
        CancellationToken cancellationToken)
    {
        var response = await projectService.ListMyStudentOffersAsync(GetRequiredUserId(), cancellationToken);
        return Ok(response);
    }

    [HttpGet("me/projects")]
    public async Task<ActionResult<IReadOnlyList<StudentProjectSummaryResponse>>> ListMyProjects(
        CancellationToken cancellationToken)
    {
        var response = await projectService.ListMyStudentProjectsAsync(GetRequiredUserId(), cancellationToken);
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

    private static string GetMimeType(string extension)
    {
        return extension switch
        {
            "jpg" => "image/jpeg",
            "png" => "image/png",
            "pdf" => "application/pdf",
            _ => "application/octet-stream"
        };
    }
}

public sealed class SubmitStudentVerificationFormRequest
{
    public string DocumentType { get; set; } = string.Empty;
    public IFormFile? File { get; set; }
}
