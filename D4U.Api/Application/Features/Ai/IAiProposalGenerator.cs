namespace D4U.Api.Application.Features.Ai;

public interface IAiProposalGenerator
{
    Task<AiProposalGeneratorResponse> GenerateAsync(
        AiProposalGeneratorRequest request,
        CancellationToken cancellationToken = default);
}
