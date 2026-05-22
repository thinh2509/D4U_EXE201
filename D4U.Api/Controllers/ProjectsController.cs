namespace D4U.Api.Controllers;

using System.Security.Claims;
using D4U.Api.Application.Features.Projects;
using D4U.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1/projects")]
[Authorize]
public sealed class ProjectsController(IProjectService projectService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProjectResponse>>> ListOpen(CancellationToken cancellationToken)
    {
        var response = await projectService.ListOpenProjectsAsync(cancellationToken);
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
