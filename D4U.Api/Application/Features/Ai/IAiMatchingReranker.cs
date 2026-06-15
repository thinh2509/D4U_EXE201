namespace D4U.Api.Application.Features.Ai;

public interface IAiMatchingReranker
{
    Task<AiMatchingRerankerResponse> RerankAsync(
        AiMatchingRerankerRequest request,
        CancellationToken cancellationToken = default);
}
