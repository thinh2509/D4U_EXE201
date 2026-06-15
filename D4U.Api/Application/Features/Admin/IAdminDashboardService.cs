namespace D4U.Api.Application.Features.Admin;

public interface IAdminDashboardService
{
    Task<AdminDashboardStatsResponse> GetStatsAsync(CancellationToken cancellationToken = default);
}
