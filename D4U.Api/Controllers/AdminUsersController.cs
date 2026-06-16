namespace D4U.Api.Controllers;

using System.Security.Claims;
using D4U.Api.Application.Features.Admin;
using D4U.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1/admin/users")]
[Authorize(Roles = nameof(UserRole.ADMIN))]
public sealed class AdminUsersController(IAdminOperationsService adminOperationsService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminUserListItemResponse>>> List(
        [FromQuery] string? role,
        [FromQuery] string? status,
        [FromQuery] string? keyword,
        CancellationToken cancellationToken)
    {
        var response = await adminOperationsService.ListUsersAsync(role, status, keyword, cancellationToken);
        return Ok(response);
    }

    [HttpGet("{userId:guid}")]
    public async Task<ActionResult<AdminUserDetailResponse>> Get(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var response = await adminOperationsService.GetUserDetailAsync(userId, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{userId:guid}/suspend")]
    public async Task<ActionResult<AdminUserDetailResponse>> Suspend(
        Guid userId,
        AdminUserLifecycleActionRequest request,
        CancellationToken cancellationToken)
    {
        var response = await adminOperationsService.SuspendUserAsync(
            GetRequiredUserId(),
            userId,
            request,
            cancellationToken);

        return Ok(response);
    }

    [HttpPost("{userId:guid}/reactivate")]
    public async Task<ActionResult<AdminUserDetailResponse>> Reactivate(
        Guid userId,
        AdminUserLifecycleActionRequest request,
        CancellationToken cancellationToken)
    {
        var response = await adminOperationsService.ReactivateUserAsync(
            GetRequiredUserId(),
            userId,
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
