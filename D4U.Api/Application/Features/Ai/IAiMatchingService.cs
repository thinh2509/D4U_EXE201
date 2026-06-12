namespace D4U.Api.Application.Features.Ai;

public interface IAiMatchingService
{
    Task<MatchStudentsForProjectResponse> MatchStudentsForProjectAsync(
        Guid userId,
        Guid projectId,
        MatchStudentsForProjectRequest request,
        CancellationToken cancellationToken = default);
}
