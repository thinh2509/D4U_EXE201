namespace D4U.Api.Application.Features.Ai;

using D4U.Api.Domain.Entities;

public interface IMatchingCandidateBuilder
{
    Task<IReadOnlyList<MatchingCandidateInput>> BuildCandidatesAsync(
        Project project,
        CancellationToken cancellationToken = default);
}
