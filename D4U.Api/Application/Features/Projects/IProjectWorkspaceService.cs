namespace D4U.Api.Application.Features.Projects;

public interface IProjectWorkspaceService
{
    Task<ProjectWorkspaceResponse> GetAsync(
        Guid userId,
        Guid projectId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<WorkspaceSubmissionResponse>> ListSubmissionsAsync(
        Guid userId,
        Guid projectId,
        CancellationToken cancellationToken = default);
}
