namespace D4U.Api.Application.Features.Ai;

using D4U.Api.Domain.Entities;

public interface IMatchingScoringService
{
    MatchingCandidateEvaluation Evaluate(
        Project project,
        string? designCategoryName,
        MatchingCandidateInput candidate);
}
