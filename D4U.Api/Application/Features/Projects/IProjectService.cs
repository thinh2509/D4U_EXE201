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

    Task<ProjectResponse> CancelAsync(
        Guid userId,
        Guid projectId,
        CancelProjectRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProjectResponse>> ListOpenProjectsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProjectResponse>> ListMyProjectsAsync(
        Guid userId,
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

    Task<IReadOnlyList<SmeProjectApplicationSummaryResponse>> ListMyApplicationsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<StudentProjectApplicationSummaryResponse>> ListMyStudentApplicationsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProjectOfferFlowResponse>> ListMyStudentOffersAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<StudentProjectSummaryResponse>> ListMyStudentProjectsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProjectOfferFlowResponse>> ListMySmeOffersAsync(
        Guid userId,
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

    Task<ProjectSubmissionResponse> SubmitProjectSubmissionAsync(
        Guid userId,
        Guid projectId,
        SubmitProjectSubmissionRequest request,
        CancellationToken cancellationToken = default);

    Task<ProjectSubmissionResponse> ApproveSubmissionAsync(
        Guid userId,
        Guid projectId,
        Guid submissionId,
        ApproveSubmissionRequest request,
        CancellationToken cancellationToken = default);

    Task<ProjectSubmissionResponse> RequestRevisionAsync(
        Guid userId,
        Guid projectId,
        Guid submissionId,
        RequestRevisionRequest request,
        CancellationToken cancellationToken = default);

    Task<ProjectSubmissionResponse> ReportInvalidFileAsync(
        Guid userId,
        Guid projectId,
        Guid submissionId,
        ReportInvalidFileRequest request,
        CancellationToken cancellationToken = default);

    Task<ProjectResponse> AdminForceCompleteAsync(
        Guid userId,
        Guid projectId,
        AdminProjectDecisionRequest request,
        CancellationToken cancellationToken = default);

    Task<ProjectResponse> AdminCancelInReviewAsync(
        Guid userId,
        Guid projectId,
        AdminProjectDecisionRequest request,
        CancellationToken cancellationToken = default);
}
