namespace D4U.Api.Controllers;

using D4U.Api.Application.Features.Admin;
using D4U.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1/admin/projects")]
[Authorize(Roles = nameof(UserRole.ADMIN))]
public sealed class AdminProjectsController(IAdminOperationsService adminOperationsService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminProjectListItemResponse>>> List(
        [FromQuery] string? status,
        [FromQuery] string? keyword,
        [FromQuery] Guid? smeUserId,
        [FromQuery] Guid? studentUserId,
        CancellationToken cancellationToken)
    {
        var response = await adminOperationsService.ListProjectsAsync(
            status,
            keyword,
            smeUserId,
            studentUserId,
            cancellationToken);

        return Ok(response);
    }

    [HttpGet("{projectId:guid}")]
    public async Task<ActionResult<AdminProjectDetailResponse>> Get(
        Guid projectId,
        CancellationToken cancellationToken)
    {
        var response = await adminOperationsService.GetProjectDetailAsync(projectId, cancellationToken);
        return Ok(response);
    }
}
