namespace D4U.Api.Controllers;

using D4U.Api.Application.Features.Admin;
using D4U.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1/admin/dashboard")]
[Authorize(Roles = nameof(UserRole.ADMIN))]
public sealed class AdminDashboardController(IAdminDashboardService adminDashboardService) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<ActionResult<AdminDashboardStatsResponse>> GetStats(CancellationToken cancellationToken)
    {
        var response = await adminDashboardService.GetStatsAsync(cancellationToken);
        return Ok(response);
    }
}
