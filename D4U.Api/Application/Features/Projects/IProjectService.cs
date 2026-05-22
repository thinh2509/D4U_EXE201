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

    Task<ProjectApplicationResponse> SubmitApplicationAsync(
        Guid userId,
        Guid projectId,
        SubmitProjectApplicationRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProjectApplicationResponse>> ListApplicationsAsync(
        Guid userId,
        Guid projectId,
        CancellationToken cancellationToken = default);

    Task<ProjectOfferResponse> CreateOfferAsync(
        Guid userId,
        Guid projectId,
        CreateProjectOfferRequest request,
        CancellationToken cancellationToken = default);

    Task<ProjectOfferResponse> AcceptOfferAsync(
        Guid userId,
        Guid offerId,
        CancellationToken cancellationToken = default);

    Task<ProjectOfferResponse> RejectOfferAsync(
        Guid userId,
        Guid offerId,
        CancellationToken cancellationToken = default);
}
