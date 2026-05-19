namespace D4U.Api.Application.Features.Profiles;

using D4U.Api.Application.Common.Data;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;

public sealed class ProfileService(IUnitOfWork unitOfWork) : IProfileService
{
    public async Task<StudentProfileResponse?> GetStudentProfileAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var profile = await unitOfWork.Repository<StudentProfile>().FirstOrDefaultAsync(
            studentProfile => studentProfile.UserId == userId,
            cancellationToken);

        return profile is null ? null : ToStudentProfileResponse(profile);
    }

    public async Task<StudentProfileResponse> UpsertStudentProfileAsync(
        Guid userId,
        UpsertStudentProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);

        if (user.Role != UserRole.STUDENT)
        {
            throw new InvalidOperationException("Only STUDENT users can manage a student profile.");
        }

        var profiles = unitOfWork.Repository<StudentProfile>();
        var profile = await profiles.FirstOrDefaultAsync(
            studentProfile => studentProfile.UserId == userId,
            cancellationToken);

        var now = DateTimeOffset.UtcNow;

        if (profile is null)
        {
            profile = new StudentProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CreatedAt = now
            };

            await profiles.AddAsync(profile, cancellationToken);
        }

        profile.School = request.School.Trim();
        profile.Major = request.Major.Trim();
        profile.StudyStartYear = request.StudyStartYear;
        profile.Bio = string.IsNullOrWhiteSpace(request.Bio) ? null : request.Bio.Trim();
        profile.OnboardingStatus = "COMPLETED";
        profile.UpdatedAt = now;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToStudentProfileResponse(profile);
    }

    public async Task<StudentVerificationResponse> SubmitStudentVerificationAsync(
        Guid userId,
        SubmitStudentVerificationRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);

        if (user.Role != UserRole.STUDENT)
        {
            throw new InvalidOperationException("Only STUDENT users can submit student verification.");
        }

        var profile = await unitOfWork.Repository<StudentProfile>().FirstOrDefaultAsync(
            studentProfile => studentProfile.UserId == userId,
            cancellationToken);

        if (profile is null)
        {
            throw new InvalidOperationException("Student profile must be created before submitting verification.");
        }

        if (profile.VerificationStatus == "APPROVED")
        {
            throw new InvalidOperationException("Student profile is already verified.");
        }

        var verifications = unitOfWork.Repository<StudentVerification>();
        var hasPendingVerification = await verifications.AnyAsync(
            verification => verification.StudentProfileId == profile.Id && verification.Status == "PENDING",
            cancellationToken);

        if (hasPendingVerification)
        {
            throw new InvalidOperationException("A pending student verification already exists.");
        }

        var now = DateTimeOffset.UtcNow;
        var file = new FileAsset
        {
            Id = Guid.NewGuid(),
            OwnerUserId = userId,
            StorageProvider = request.StorageProvider.Trim(),
            Bucket = string.IsNullOrWhiteSpace(request.Bucket) ? null : request.Bucket.Trim(),
            StorageKey = request.StorageKey.Trim(),
            OriginalFilename = request.OriginalFilename.Trim(),
            MimeType = request.MimeType.Trim(),
            FileExtension = request.FileExtension.TrimStart('.').ToLowerInvariant(),
            FileSizeBytes = request.FileSizeBytes,
            Checksum = string.IsNullOrWhiteSpace(request.Checksum) ? null : request.Checksum.Trim(),
            Visibility = "PRIVATE",
            ScanStatus = "PENDING",
            CreatedAt = now
        };

        var verification = new StudentVerification
        {
            Id = Guid.NewGuid(),
            StudentProfileId = profile.Id,
            DocumentFileId = file.Id,
            Status = "PENDING",
            SubmittedAt = now
        };

        profile.VerificationStatus = "PENDING";
        profile.CanWithdraw = false;
        profile.UpdatedAt = now;

        await unitOfWork.Repository<FileAsset>().AddAsync(file, cancellationToken);
        await verifications.AddAsync(verification, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToStudentVerificationResponse(verification);
    }

    public async Task<SmeProfileResponse?> GetSmeProfileAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var profile = await unitOfWork.Repository<SmeProfile>().FirstOrDefaultAsync(
            smeProfile => smeProfile.UserId == userId,
            cancellationToken);

        return profile is null ? null : ToSmeProfileResponse(profile);
    }

    public async Task<SmeProfileResponse> UpsertSmeProfileAsync(
        Guid userId,
        UpsertSmeProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);

        if (user.Role != UserRole.SME)
        {
            throw new InvalidOperationException("Only SME users can manage an SME profile.");
        }

        var profiles = unitOfWork.Repository<SmeProfile>();
        var profile = await profiles.FirstOrDefaultAsync(
            smeProfile => smeProfile.UserId == userId,
            cancellationToken);

        var now = DateTimeOffset.UtcNow;

        if (profile is null)
        {
            profile = new SmeProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CreatedAt = now
            };

            await profiles.AddAsync(profile, cancellationToken);
        }

        profile.CompanyName = request.CompanyName.Trim();
        profile.RepresentativeName = request.RepresentativeName.Trim();
        profile.PhoneNumber = request.PhoneNumber.Trim();
        profile.BusinessField = request.BusinessField.Trim();
        profile.LogoFileId = request.LogoFileId;
        profile.OnboardingStatus = "COMPLETED";
        profile.UpdatedAt = now;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToSmeProfileResponse(profile);
    }

    public async Task<StudentVerificationResponse> ApproveStudentVerificationAsync(
        Guid verificationId,
        Guid adminUserId,
        CancellationToken cancellationToken = default)
    {
        var admin = await RequireUserAsync(adminUserId, cancellationToken);

        if (admin.Role != UserRole.ADMIN)
        {
            throw new UnauthorizedAccessException("Only ADMIN users can approve student verification.");
        }

        var verification = await RequireVerificationAsync(verificationId, cancellationToken);
        var profile = await RequireStudentProfileAsync(verification.StudentProfileId, cancellationToken);
        var studentUser = await RequireUserAsync(profile.UserId, cancellationToken);
        var now = DateTimeOffset.UtcNow;

        verification.Status = "APPROVED";
        verification.ReviewedByAdminId = adminUserId;
        verification.RejectionReason = null;
        verification.ReviewedAt = now;

        profile.VerificationStatus = "APPROVED";
        profile.CanWithdraw = true;
        profile.UpdatedAt = now;

        studentUser.Status = UserStatus.ACTIVE;
        studentUser.UpdatedAt = now;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToStudentVerificationResponse(verification);
    }

    public async Task<StudentVerificationResponse> RejectStudentVerificationAsync(
        Guid verificationId,
        Guid adminUserId,
        RejectStudentVerificationRequest request,
        CancellationToken cancellationToken = default)
    {
        var admin = await RequireUserAsync(adminUserId, cancellationToken);

        if (admin.Role != UserRole.ADMIN)
        {
            throw new UnauthorizedAccessException("Only ADMIN users can reject student verification.");
        }

        var verification = await RequireVerificationAsync(verificationId, cancellationToken);
        var profile = await RequireStudentProfileAsync(verification.StudentProfileId, cancellationToken);
        var now = DateTimeOffset.UtcNow;

        verification.Status = "REJECTED";
        verification.ReviewedByAdminId = adminUserId;
        verification.RejectionReason = request.RejectionReason.Trim();
        verification.ReviewedAt = now;

        profile.VerificationStatus = "REJECTED";
        profile.CanWithdraw = false;
        profile.UpdatedAt = now;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToStudentVerificationResponse(verification);
    }

    private async Task<User> RequireUserAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var user = await unitOfWork.Repository<User>().GetByIdAsync(userId, cancellationToken);

        return user ?? throw new UnauthorizedAccessException("User not found.");
    }

    private async Task<StudentVerification> RequireVerificationAsync(
        Guid verificationId,
        CancellationToken cancellationToken)
    {
        var verification = await unitOfWork.Repository<StudentVerification>().GetByIdAsync(verificationId, cancellationToken);

        return verification ?? throw new InvalidOperationException("Student verification was not found.");
    }

    private async Task<StudentProfile> RequireStudentProfileAsync(
        Guid studentProfileId,
        CancellationToken cancellationToken)
    {
        var profile = await unitOfWork.Repository<StudentProfile>().GetByIdAsync(studentProfileId, cancellationToken);

        return profile ?? throw new InvalidOperationException("Student profile was not found.");
    }

    private static StudentProfileResponse ToStudentProfileResponse(StudentProfile profile)
    {
        return new StudentProfileResponse(
            profile.Id,
            profile.UserId,
            profile.School,
            profile.Major,
            profile.StudyStartYear,
            profile.Bio,
            profile.OnboardingStatus,
            profile.VerificationStatus,
            profile.AverageRating,
            profile.CompletedProjectsCount,
            profile.CanWithdraw,
            profile.CreatedAt,
            profile.UpdatedAt);
    }

    private static SmeProfileResponse ToSmeProfileResponse(SmeProfile profile)
    {
        return new SmeProfileResponse(
            profile.Id,
            profile.UserId,
            profile.CompanyName,
            profile.RepresentativeName,
            profile.PhoneNumber,
            profile.BusinessField,
            profile.LogoFileId,
            profile.OnboardingStatus,
            profile.AverageRating,
            profile.CompletedProjectsCount,
            profile.ActiveOpenProjectCount,
            profile.CreatedAt,
            profile.UpdatedAt);
    }

    private static StudentVerificationResponse ToStudentVerificationResponse(StudentVerification verification)
    {
        return new StudentVerificationResponse(
            verification.Id,
            verification.StudentProfileId,
            verification.DocumentFileId,
            verification.Status,
            verification.ReviewedByAdminId,
            verification.RejectionReason,
            verification.SubmittedAt,
            verification.ReviewedAt);
    }
}
