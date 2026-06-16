namespace D4U.Api.Infrastructure.Ai;

using D4U.Api.Application.Features.Ai;

public sealed class MockAiMatchingService : IAiMatchingReranker
{
    public Task<AiMatchingRerankerResponse> RerankAsync(
        AiMatchingRerankerRequest request,
        CancellationToken cancellationToken = default)
    {
        var recommendations = request.Candidates
            .OrderByDescending(candidate => candidate.BaseScore)
            .ThenByDescending(candidate => candidate.HasAppliedToProject)
            .ThenByDescending(candidate => candidate.AverageRating)
            .ThenByDescending(candidate => candidate.CompletedProjectsCount)
            .Take(request.MaxResults)
            .Select(candidate => new AiMatchingRerankedCandidate(
                candidate.StudentProfileId,
                candidate.BaseScore,
                candidate.Reasons,
                candidate.MissingDataWarnings,
                candidate.FitWarnings))
            .ToList();

        return Task.FromResult(new AiMatchingRerankerResponse(
            "Deterministic",
            ["Đang dùng chế độ gợi ý dự phòng dựa trên dữ liệu hồ sơ và lịch sử ứng tuyển hiện có."],
            recommendations));
    }
}
