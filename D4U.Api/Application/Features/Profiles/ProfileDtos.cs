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

public sealed class AdminStudentVerificationListItemResponse
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public Guid StudentProfileId { get; set; }
    public Guid StudentUserId { get; set; }
    public string StudentEmail { get; set; } = string.Empty;
    public string StudentFullName { get; set; } = string.Empty;
    public string School { get; set; } = string.Empty;
    public string Major { get; set; } = string.Empty;
    public string OriginalFilename { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
}

public sealed class AdminStudentVerificationDetailResponse
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? RejectionReason { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public Guid? ReviewedByAdminId { get; set; }
    public Guid StudentProfileId { get; set; }
    public Guid StudentUserId { get; set; }
    public string StudentEmail { get; set; } = string.Empty;
    public string StudentUsername { get; set; } = string.Empty;
    public string StudentFullName { get; set; } = string.Empty;
    public string School { get; set; } = string.Empty;
    public string Major { get; set; } = string.Empty;
    public int StudyStartYear { get; set; }
    public string? Bio { get; set; }
    public string VerificationStatus { get; set; } = string.Empty;
    public bool CanWithdraw { get; set; }
    public Guid DocumentFileId { get; set; }
    public string StorageProvider { get; set; } = string.Empty;
    public string? Bucket { get; set; }
    public string StorageKey { get; set; } = string.Empty;
    public string OriginalFilename { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public string FileExtension { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string? Checksum { get; set; }
}
