namespace D4U.Api.Controllers;

using D4U.Api.Application.Features.Ai;
using D4U.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1/ai")]
[Authorize(Roles = nameof(UserRole.SME))]
public sealed class AiController(IAiProjectBriefAssistant projectBriefAssistant) : ControllerBase
{
    [HttpPost("project-brief-assistant")]
    public async Task<ActionResult<AiProjectBriefAssistantResponse>> GenerateProjectBrief(
        AiProjectBriefAssistantRequest request,
        CancellationToken cancellationToken)
    {
        var response = await projectBriefAssistant.GenerateAsync(request, cancellationToken);
        return Ok(response);
    }
}

