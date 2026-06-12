namespace D4U.Api.Controllers;

using System.Security.Claims;
using D4U.Api.Application.Features.Ai;
using D4U.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1/ai")]
[Authorize(Roles = nameof(UserRole.SME))]
public sealed class AiController(
    IAiProjectBriefAssistant projectBriefAssistant,
    IAiMatchingService aiMatchingService) : ControllerBase
{
    [HttpPost("project-brief-assistant")]
    public async Task<ActionResult<AiProjectBriefAssistantResponse>> GenerateProjectBrief(
        AiProjectBriefAssistantRequest request,
        CancellationToken cancellationToken)
    {
        var response = await projectBriefAssistant.GenerateAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("matching/projects/{projectId:guid}/students")]
    public async Task<ActionResult<MatchStudentsForProjectResponse>> MatchStudentsForProject(
        Guid projectId,
        MatchStudentsForProjectRequest request,
        CancellationToken cancellationToken)
    {
        var response = await aiMatchingService.MatchStudentsForProjectAsync(
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

