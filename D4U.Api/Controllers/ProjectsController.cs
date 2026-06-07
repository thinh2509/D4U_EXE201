namespace D4U.Api.Controllers;

using System.Security.Claims;
using D4U.Api.Application.Features.Projects;
using D4U.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1/projects")]
[Authorize]
public sealed class ProjectsController(
    IProjectService projectService,
    IProjectWorkspaceService projectWorkspaceService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProjectResponse>>> ListOpen(CancellationToken cancellationToken)
    {
        var response = await projectService.ListOpenProjectsAsync(GetRequiredUserId(), cancellationToken);
        return Ok(response);
    }

    [HttpGet("mine")]
    [Authorize(Roles = nameof(UserRole.SME))]
    public async Task<ActionResult<IReadOnlyList<ProjectResponse>>> ListMine(CancellationToken cancellationToken)
    {
        var response = await projectService.ListMyProjectsAsync(GetRequiredUserId(), cancellationToken);
        return Ok(response);
    }

    [HttpGet("{projectId:guid}")]
    public async Task<ActionResult<ProjectResponse>> Get(
        Guid projectId,
        CancellationToken cancellationToken)
    {
        var response = await projectService.GetProjectAsync(GetRequiredUserId(), projectId, cancellationToken);
        return Ok(response);
    }

    [HttpGet("{projectId:guid}/workspace")]
    public async Task<ActionResult<ProjectWorkspaceResponse>> GetWorkspace(
        Guid projectId,
        CancellationToken cancellationToken)
    {
        var response = await projectWorkspaceService.GetAsync(GetRequiredUserId(), projectId, cancellationToken);
        return Ok(response);
    }

    [HttpGet("{projectId:guid}/submissions")]
    public async Task<ActionResult<IReadOnlyList<WorkspaceSubmissionResponse>>> ListSubmissions(
        Guid projectId,
        CancellationToken cancellationToken)
    {
        var response = await projectWorkspaceService.ListSubmissionsAsync(
            GetRequiredUserId(),
            projectId,
            cancellationToken);

        return Ok(response);
    }

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.SME))]
    public async Task<ActionResult<ProjectResponse>> CreateDraft(
        UpsertProjectDraftRequest request,
        CancellationToken cancellationToken)
    {
        var response = await projectService.CreateDraftAsync(GetRequiredUserId(), request, cancellationToken);
        return CreatedAtAction(nameof(Get), new { projectId = response.Id }, response);
    }

    [HttpPut("{projectId:guid}")]
    [Authorize(Roles = nameof(UserRole.SME))]
    public async Task<ActionResult<ProjectResponse>> UpdateDraft(
        Guid projectId,
        UpsertProjectDraftRequest request,
        CancellationToken cancellationToken)
    {
        var response = await projectService.UpdateDraftAsync(GetRequiredUserId(), projectId, request, cancellationToken);
        return Ok(response);
    }

    [HttpPatch("{projectId:guid}/deadlines")]
    [Authorize(Roles = nameof(UserRole.SME))]
    public async Task<ActionResult<ProjectResponse>> UpdateDeadlines(
        Guid projectId,
        UpdateProjectDeadlinesRequest request,
        CancellationToken cancellationToken)
    {
        var response = await projectService.UpdateDeadlinesAsync(
            GetRequiredUserId(),
            projectId,
            request,
            cancellationToken);

        return Ok(response);
    }

    [HttpPost("{projectId:guid}/publish")]
    [Authorize(Roles = nameof(UserRole.SME))]
    public async Task<ActionResult<ProjectResponse>> Publish(
        Guid projectId,
        CancellationToken cancellationToken)
    {
        var response = await projectService.PublishAsync(GetRequiredUserId(), projectId, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{projectId:guid}/cancel")]
    [Authorize(Roles = nameof(UserRole.SME))]
    public async Task<ActionResult<ProjectResponse>> Cancel(
        Guid projectId,
        CancelProjectRequest request,
        CancellationToken cancellationToken)
    {
        var response = await projectService.CancelAsync(GetRequiredUserId(), projectId, request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("{projectId:guid}/abandon")]
    [Authorize(Roles = nameof(UserRole.STUDENT))]
    public async Task<ActionResult<ProjectResponse>> Abandon(
        Guid projectId,
        CancelProjectRequest request,
        CancellationToken cancellationToken)
    {
        var response = await projectService.AbandonAsync(GetRequiredUserId(), projectId, request, cancellationToken);
        return Ok(response);
    }

    [HttpDelete("{projectId:guid}")]
    [Authorize(Roles = nameof(UserRole.SME))]
    public async Task<ActionResult<ProjectResponse>> Delete(
        Guid projectId,
        CancellationToken cancellationToken)
    {
        var response = await projectService.CancelAsync(
            GetRequiredUserId(),
            projectId,
            new CancelProjectRequest("Deleted by SME."),
            cancellationToken);

        return Ok(response);
    }

    [HttpPost("{projectId:guid}/applications")]
    [Authorize(Roles = nameof(UserRole.STUDENT))]
    public async Task<ActionResult<ProjectApplicationResponse>> SubmitApplication(
        Guid projectId,
        SubmitProjectApplicationRequest request,
        CancellationToken cancellationToken)
    {
        var response = await projectService.SubmitApplicationAsync(
            GetRequiredUserId(),
            projectId,
            request,
            cancellationToken);

        return Created(string.Empty, response);
    }

    [HttpGet("{projectId:guid}/applications")]
    [Authorize(Roles = nameof(UserRole.SME))]
    public async Task<ActionResult<IReadOnlyList<ProjectApplicationResponse>>> ListApplications(
        Guid projectId,
        CancellationToken cancellationToken)
    {
        var response = await projectService.ListApplicationsAsync(
            GetRequiredUserId(),
            projectId,
            cancellationToken);

        return Ok(response);
    }

    [HttpPost("{projectId:guid}/offers")]
    [Authorize(Roles = nameof(UserRole.SME))]
    public async Task<ActionResult<ProjectOfferResponse>> CreateOffer(
        Guid projectId,
        CreateProjectOfferRequest request,
        CancellationToken cancellationToken)
    {
        var response = await projectService.CreateOfferAsync(
            GetRequiredUserId(),
            projectId,
            request,
            cancellationToken);

        return Created(string.Empty, response);
    }

    [HttpPost("{projectId:guid}/submissions")]
    [Authorize(Roles = nameof(UserRole.STUDENT))]
    public async Task<ActionResult<ProjectSubmissionResponse>> SubmitProjectSubmission(
        Guid projectId,
        SubmitProjectSubmissionRequest request,
        CancellationToken cancellationToken)
    {
        var response = await projectService.SubmitProjectSubmissionAsync(
            GetRequiredUserId(),
            projectId,
            request,
            cancellationToken);

        return Created(string.Empty, response);
    }

    [HttpPost("{projectId:guid}/submissions/{submissionId:guid}/approve")]
    [Authorize(Roles = nameof(UserRole.SME))]
    public async Task<ActionResult<ProjectSubmissionResponse>> ApproveSubmission(
        Guid projectId,
        Guid submissionId,
        ApproveSubmissionRequest request,
        CancellationToken cancellationToken)
    {
        var response = await projectService.ApproveSubmissionAsync(
            GetRequiredUserId(),
            projectId,
            submissionId,
            request,
            cancellationToken);

        return Ok(response);
    }

    [HttpPost("{projectId:guid}/submissions/{submissionId:guid}/revision-requests")]
    [Authorize(Roles = nameof(UserRole.SME))]
    public async Task<ActionResult<ProjectSubmissionResponse>> RequestRevision(
        Guid projectId,
        Guid submissionId,
        RequestRevisionRequest request,
        CancellationToken cancellationToken)
    {
        var response = await projectService.RequestRevisionAsync(
            GetRequiredUserId(),
            projectId,
            submissionId,
            request,
            cancellationToken);

        return Ok(response);
    }

    [HttpPost("{projectId:guid}/submissions/{submissionId:guid}/invalid-file-reports")]
    [Authorize(Roles = nameof(UserRole.SME))]
    public async Task<ActionResult<ProjectSubmissionResponse>> ReportInvalidFile(
        Guid projectId,
        Guid submissionId,
        ReportInvalidFileRequest request,
        CancellationToken cancellationToken)
    {
        var response = await projectService.ReportInvalidFileAsync(
            GetRequiredUserId(),
            projectId,
            submissionId,
            request,
            cancellationToken);

        return Ok(response);
    }

    [HttpPost("{projectId:guid}/admin/force-complete")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<ProjectResponse>> AdminForceComplete(
        Guid projectId,
        AdminProjectDecisionRequest request,
        CancellationToken cancellationToken)
    {
        var response = await projectService.AdminForceCompleteAsync(
            GetRequiredUserId(),
            projectId,
            request,
            cancellationToken);

        return Ok(response);
    }

    [HttpPost("{projectId:guid}/admin/cancel")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<ProjectResponse>> AdminCancelInReview(
        Guid projectId,
        AdminProjectDecisionRequest request,
        CancellationToken cancellationToken)
    {
        var response = await projectService.AdminCancelInReviewAsync(
            GetRequiredUserId(),
            projectId,
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
