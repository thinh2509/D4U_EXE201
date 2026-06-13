namespace D4U.Api.Application.Features.Ai;

public interface IAiProposalWriterService
{
    Task<GenerateAiProposalResponse> GenerateProposalAsync(
        Guid userId,
        GenerateAiProposalRequest request,
        CancellationToken cancellationToken = default);
}
