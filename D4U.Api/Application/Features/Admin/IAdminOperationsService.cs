namespace D4U.Api.Application.Features.Admin;

public interface IAdminOperationsService
{
    Task<IReadOnlyList<AdminUserListItemResponse>> ListUsersAsync(
        string? role,
        string? status,
        string? keyword,
        CancellationToken cancellationToken = default);

    Task<AdminUserDetailResponse> GetUserDetailAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<AdminUserDetailResponse> SuspendUserAsync(
        Guid actorUserId,
        Guid userId,
        AdminUserLifecycleActionRequest request,
        CancellationToken cancellationToken = default);

    Task<AdminUserDetailResponse> ReactivateUserAsync(
        Guid actorUserId,
        Guid userId,
        AdminUserLifecycleActionRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AdminProjectListItemResponse>> ListProjectsAsync(
        string? status,
        string? keyword,
        Guid? smeUserId,
        Guid? studentUserId,
        CancellationToken cancellationToken = default);

    Task<AdminProjectDetailResponse> GetProjectDetailAsync(
        Guid projectId,
        CancellationToken cancellationToken = default);
}
