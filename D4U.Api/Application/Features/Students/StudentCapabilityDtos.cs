namespace D4U.Api.Application.Features.Students;

using D4U.Api.Domain.Enums;

public sealed record UpsertStudentSkillRequest(
    string SkillName,
    StudentSkillLevel Level,
    int? YearsOfExperience,
    string? ExperienceNote,
    bool IsHighlighted);

public sealed record StudentSkillResponse(
    Guid Id,
    Guid StudentProfileId,
    string SkillName,
    StudentSkillLevel Level,
    int? YearsOfExperience,
    string? ExperienceNote,
    bool IsHighlighted,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record StudentSkillReferenceResponse(
    Guid Id,
    string SkillName,
    StudentSkillLevel Level,
    bool IsHighlighted);

public sealed record UpsertStudentPortfolioItemRequest(
    Guid? SourceProjectId,
    Guid? DesignCategoryId,
    string Title,
    string Description,
    string? ThumbnailUrl,
    string? ProjectUrl,
    string? FileUrl,
    DateTimeOffset? CompletedAt,
    IReadOnlyList<Guid>? StudentSkillIds,
    bool IsFeatured);

public sealed record StudentPortfolioItemResponse(
    Guid Id,
    Guid StudentProfileId,
    Guid? SourceProjectId,
    Guid? DesignCategoryId,
    string? DesignCategoryName,
    string Title,
    string Description,
    string? ThumbnailUrl,
    string? ProjectUrl,
    string? FileUrl,
    DateTimeOffset? CompletedAt,
    PortfolioItemStatus Status,
    bool IsPublic,
    bool IsFeatured,
    IReadOnlyList<StudentSkillReferenceResponse> SkillsUsed,
    DateTimeOffset? PublishedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record PublicStudentProfileResponse(
    Guid StudentProfileId,
    Guid StudentUserId,
    string FullName,
    string? AvatarUrl,
    string School,
    string Major,
    int StudyStartYear,
    string? Bio,
    string VerificationStatus,
    decimal AverageRating,
    int CompletedProjectsCount,
    IReadOnlyList<StudentSkillResponse> PublicSkills,
    IReadOnlyList<StudentSkillResponse> FeaturedSkills,
    IReadOnlyList<StudentPortfolioItemResponse> PublicPortfolio,
    IReadOnlyList<StudentPortfolioItemResponse> FeaturedPortfolio);

public sealed record StudentBasicProfileSummaryResponse(
    Guid StudentProfileId,
    Guid StudentUserId,
    string FullName,
    string School,
    string Major,
    string? Bio,
    string VerificationStatus,
    decimal AverageRating,
    int CompletedProjectsCount);

public sealed record StudentCapabilitySummaryResponse(
    Guid StudentProfileId,
    StudentBasicProfileSummaryResponse BasicProfileSummary,
    string SkillsSummary,
    string PortfolioSummary,
    IReadOnlyList<StudentSkillResponse> HighlightedSkills,
    IReadOnlyList<StudentPortfolioItemResponse> FeaturedPortfolio,
    IReadOnlyList<StudentSkillResponse> RelatedSkillsByCategory);
