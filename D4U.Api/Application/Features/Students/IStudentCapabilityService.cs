namespace D4U.Api.Application.Features.Students;

public interface IStudentCapabilityService
{
    Task<IReadOnlyList<StudentSkillResponse>> ListMySkillsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<StudentSkillResponse> CreateSkillAsync(
        Guid userId,
        UpsertStudentSkillRequest request,
        CancellationToken cancellationToken = default);

    Task<StudentSkillResponse> UpdateSkillAsync(
        Guid userId,
        Guid skillId,
        UpsertStudentSkillRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteSkillAsync(
        Guid userId,
        Guid skillId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<StudentPortfolioItemResponse>> ListMyPortfolioAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<StudentPortfolioItemResponse> CreatePortfolioItemAsync(
        Guid userId,
        UpsertStudentPortfolioItemRequest request,
        CancellationToken cancellationToken = default);

    Task<StudentPortfolioItemResponse> UpdatePortfolioItemAsync(
        Guid userId,
        Guid portfolioItemId,
        UpsertStudentPortfolioItemRequest request,
        CancellationToken cancellationToken = default);

    Task DeletePortfolioItemAsync(
        Guid userId,
        Guid portfolioItemId,
        CancellationToken cancellationToken = default);

    Task<StudentPortfolioItemResponse> PublishPortfolioItemAsync(
        Guid userId,
        Guid portfolioItemId,
        CancellationToken cancellationToken = default);

    Task<StudentPortfolioItemResponse> UnpublishPortfolioItemAsync(
        Guid userId,
        Guid portfolioItemId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<StudentPortfolioItemResponse>> ListStudentPortfolioForViewerAsync(
        Guid viewerUserId,
        Guid studentProfileId,
        CancellationToken cancellationToken = default);

    Task<PublicStudentProfileResponse> GetStudentProfileForViewerAsync(
        Guid viewerUserId,
        Guid studentProfileId,
        CancellationToken cancellationToken = default);

    Task<StudentCapabilitySummaryResponse> GetStudentCapabilitySummaryAsync(
        Guid studentProfileId,
        Guid? designCategoryId = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyDictionary<Guid, StudentCapabilitySummaryResponse>> GetStudentCapabilitySummariesAsync(
        IReadOnlyList<Guid> studentProfileIds,
        Guid? designCategoryId = null,
        CancellationToken cancellationToken = default);
}
