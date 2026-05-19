namespace D4U.Api.Application.Features.Profiles;

public sealed record UpsertStudentProfileRequest(
    string School,
    string Major,
    int StudyStartYear,
    string? Bio);

public sealed record StudentProfileResponse(
    Guid Id,
    Guid UserId,
    string School,
    string Major,
    int StudyStartYear,
    string? Bio,
    string OnboardingStatus,
    string VerificationStatus,
    decimal AverageRating,
    int CompletedProjectsCount,
    bool CanWithdraw,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record UpsertSmeProfileRequest(
    string CompanyName,
    string RepresentativeName,
    string PhoneNumber,
    string BusinessField,
    Guid? LogoFileId);

public sealed record SmeProfileResponse(
    Guid Id,
    Guid UserId,
    string CompanyName,
    string RepresentativeName,
    string PhoneNumber,
    string BusinessField,
    Guid? LogoFileId,
    string OnboardingStatus,
    decimal AverageRating,
    int CompletedProjectsCount,
    int ActiveOpenProjectCount,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record SubmitStudentVerificationRequest(
    string StorageProvider,
    string? Bucket,
    string StorageKey,
    string OriginalFilename,
    string MimeType,
    string FileExtension,
    long FileSizeBytes,
    string? Checksum);

public sealed record StudentVerificationResponse(
    Guid Id,
    Guid StudentProfileId,
    Guid DocumentFileId,
    string Status,
    Guid? ReviewedByAdminId,
    string? RejectionReason,
    DateTimeOffset SubmittedAt,
    DateTimeOffset? ReviewedAt);

public sealed record RejectStudentVerificationRequest(
    string RejectionReason);
