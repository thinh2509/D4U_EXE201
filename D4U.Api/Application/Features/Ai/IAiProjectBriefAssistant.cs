namespace D4U.Api.Application.Features.Ai;

public interface IAiProjectBriefAssistant
{
    Task<AiProjectBriefAssistantResponse> GenerateAsync(
        AiProjectBriefAssistantRequest request,
        CancellationToken cancellationToken = default);
}

