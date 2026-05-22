namespace D4U.Api.Application.Features.Projects;

public interface IProjectService
{
    Task<ProjectResponse> CreateDraftAsync(
        Guid userId,
        UpsertProjectDraftRequest request,
        CancellationToken cancellationToken = default);

    Task<ProjectResponse> UpdateDraftAsync(
        Guid userId,
        Guid projectId,
        UpsertProjectDraftRequest request,
        CancellationToken cancellationToken = default);

    Task<ProjectResponse> PublishAsync(
        Guid userId,
        Guid projectId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProjectResponse>> ListOpenProjectsAsync(
        CancellationToken cancellationToken = default);

    Task<ProjectResponse> GetProjectAsync(
        Guid userId,
        Guid projectId,
        CancellationToken cancellationToken = default);
}

