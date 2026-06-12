namespace D4U.Api.Application.Features.Profiles;

using System.Security.Cryptography;
using System.Text;
using Dapper;
using D4U.Api.Application.Common.Data;
using D4U.Api.Application.Common.Files;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Email;
using D4U.Api.Infrastructure.EmailVerification;
using Microsoft.Extensions.Options;

public sealed class ProfileService(
    IUnitOfWork unitOfWork,
    IDapperConnectionFactory connectionFactory,
    IEmailSender emailSender,
    IOptions<StudentEmailVerificationOptions> emailVerificationOptions) : IProfileService
{
    private const string BasicPlanCode = "BASIC";

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

        var normalizedExtension = FileMetadataRules.NormalizeExtension(request.FileExtension);

        if (!FileMetadataRules.IsAllowedExtension(normalizedExtension))
        {
            throw new InvalidOperationException("Verification document extension must be jpg, png, or pdf.");
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
            FileExtension = normalizedExtension,
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

    public async Task<StudentEmailVerificationResponse> RequestStudentEduEmailVerificationAsync(
        Guid userId,
        RequestStudentEduEmailVerificationRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);

        if (user.Role != UserRole.STUDENT)
        {
            throw new InvalidOperationException("Only STUDENT users can request EDU email verification.");
        }

        var profile = await unitOfWork.Repository<StudentProfile>().FirstOrDefaultAsync(
            studentProfile => studentProfile.UserId == userId,
            cancellationToken);

        if (profile is null)
        {
            throw new InvalidOperationException("Student profile must be created before requesting EDU email verification.");
        }

        if (profile.VerificationStatus == "APPROVED")
        {
            throw new InvalidOperationException("Student profile is already verified.");
        }

        var normalizedEmail = NormalizeEmail(request.Email);

        if (!IsAllowedEduEmail(normalizedEmail))
        {
            throw new InvalidOperationException("Student email must use an .edu or approved school domain.");
        }

        var now = DateTimeOffset.UtcNow;
        var options = emailVerificationOptions.Value;
        var code = CreateVerificationCode(options.CodeLength);
        var verifications = unitOfWork.Repository<StudentEmailVerification>();

        var existingPending = await verifications.FirstOrDefaultAsync(
            verification => verification.StudentProfileId == profile.Id &&
                            verification.Email == normalizedEmail &&
                            verification.Status == "PENDING",
            cancellationToken);

        if (existingPending is not null)
        {
            existingPending.Status = "EXPIRED";
        }

        var verification = new StudentEmailVerification
        {
            Id = Guid.NewGuid(),
            StudentProfileId = profile.Id,
            UserId = userId,
            Email = normalizedEmail,
            CodeHash = HashVerificationCode(code),
            Status = "PENDING",
            RequestedAt = now,
            ExpiresAt = now.AddMinutes(Math.Max(1, options.CodeExpiresMinutes))
        };

        profile.VerificationStatus = "PENDING";
        profile.CanWithdraw = false;
        profile.UpdatedAt = now;

        await verifications.AddAsync(verification, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await SendStudentEduEmailVerificationCodeAsync(
            user,
            verification.Email,
            code,
            verification.ExpiresAt,
            cancellationToken);

        return ToStudentEmailVerificationResponse(verification);
    }

    public async Task<StudentEmailVerificationResponse> ConfirmStudentEduEmailVerificationAsync(
        Guid userId,
        ConfirmStudentEduEmailVerificationRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);

        if (user.Role != UserRole.STUDENT)
        {
            throw new InvalidOperationException("Only STUDENT users can confirm EDU email verification.");
        }

        var profile = await unitOfWork.Repository<StudentProfile>().FirstOrDefaultAsync(
            studentProfile => studentProfile.UserId == userId,
            cancellationToken);

        if (profile is null)
        {
            throw new InvalidOperationException("Student profile must be created before confirming EDU email verification.");
        }

        var normalizedEmail = NormalizeEmail(request.Email);
        var codeHash = HashVerificationCode(request.Code.Trim());
        var verification = await unitOfWork.Repository<StudentEmailVerification>().FirstOrDefaultAsync(
            item => item.StudentProfileId == profile.Id &&
                    item.Email == normalizedEmail &&
                    item.Status == "PENDING",
            cancellationToken);

        if (verification is null)
        {
            throw new InvalidOperationException("Pending EDU email verification was not found.");
        }

        var now = DateTimeOffset.UtcNow;

        if (verification.ExpiresAt <= now)
        {
            verification.Status = "EXPIRED";
            await unitOfWork.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("EDU email verification code has expired.");
        }

        if (!CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(verification.CodeHash),
                Encoding.UTF8.GetBytes(codeHash)))
        {
            throw new InvalidOperationException("EDU email verification code is invalid.");
        }

        verification.Status = "APPROVED";
        verification.ConfirmedAt = now;

        profile.VerificationStatus = "APPROVED";
        profile.CanWithdraw = true;
        profile.UpdatedAt = now;

        user.Status = UserStatus.ACTIVE;
        if (string.Equals(user.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase))
        {
            user.EmailVerifiedAt ??= now;
        }
        user.UpdatedAt = now;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToStudentEmailVerificationResponse(verification);
    }

    public async Task<SmeProfileResponse?> GetSmeProfileAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var profile = await unitOfWork.Repository<SmeProfile>().FirstOrDefaultAsync(
            smeProfile => smeProfile.UserId == userId,
            cancellationToken);

        if (profile is null)
        {
            return null;
        }

        var plan = await GetSubscriptionPlanAsync(profile.SubscriptionPlanId, cancellationToken);
        return ToSmeProfileResponse(profile, plan);
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
            var basicPlan = await RequireBasicSubscriptionPlanAsync(cancellationToken);
            profile = new SmeProfile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                SubscriptionPlanId = basicPlan.Id,
                SubscriptionStartedAt = now,
                CreatedAt = now
            };

            await profiles.AddAsync(profile, cancellationToken);
        }
        else if (profile.SubscriptionPlanId == Guid.Empty)
        {
            var basicPlan = await RequireBasicSubscriptionPlanAsync(cancellationToken);
            profile.SubscriptionPlanId = basicPlan.Id;
            profile.SubscriptionStartedAt = profile.SubscriptionStartedAt == default ? now : profile.SubscriptionStartedAt;
        }

        profile.CompanyName = request.CompanyName.Trim();
        profile.RepresentativeName = request.RepresentativeName.Trim();
        profile.PhoneNumber = request.PhoneNumber.Trim();
        profile.BusinessField = request.BusinessField.Trim();
        profile.LogoFileId = request.LogoFileId;
        profile.OnboardingStatus = "COMPLETED";
        profile.UpdatedAt = now;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        var subscriptionPlan = await GetSubscriptionPlanAsync(profile.SubscriptionPlanId, cancellationToken);
        return ToSmeProfileResponse(profile, subscriptionPlan);
    }

    private async Task<SubscriptionPlan> RequireBasicSubscriptionPlanAsync(CancellationToken cancellationToken)
    {
        return await unitOfWork.Repository<SubscriptionPlan>().FirstOrDefaultAsync(
            plan => plan.Code == BasicPlanCode && plan.IsActive,
            cancellationToken) ?? throw new InvalidOperationException("Basic subscription plan was not found.");
    }

    public async Task<IReadOnlyList<AdminStudentVerificationListItemResponse>> ListStudentVerificationsAsync(
        string? status,
        CancellationToken cancellationToken = default)
    {
        var normalizedStatus = string.IsNullOrWhiteSpace(status) ? null : status.Trim().ToUpperInvariant();
        const string sql = """
            select
                sv.id as Id,
                sv.status as Status,
                sv.submitted_at as SubmittedAt,
                sv.reviewed_at as ReviewedAt,
                sp.id as StudentProfileId,
                u.id as StudentUserId,
                u.email as StudentEmail,
                u.full_name as StudentFullName,
                sp.school as School,
                sp.major as Major,
                f.original_filename as OriginalFilename,
                f.mime_type as MimeType,
                f.file_size_bytes as FileSizeBytes
            from public.student_verifications sv
            join public.student_profiles sp on sp.id = sv.student_profile_id
            join public.users u on u.id = sp.user_id
            join public.files f on f.id = sv.document_file_id
            where (@Status is null or sv.status = @Status)
            order by sv.submitted_at desc
            """;

        await using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<AdminStudentVerificationListItemResponse>(
            new CommandDefinition(sql, new { Status = normalizedStatus }, cancellationToken: cancellationToken));

        return rows.AsList();
    }

    public async Task<AdminStudentVerificationDetailResponse> GetStudentVerificationDetailAsync(
        Guid verificationId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
            select
                sv.id as Id,
                sv.status as Status,
                sv.rejection_reason as RejectionReason,
                sv.submitted_at as SubmittedAt,
                sv.reviewed_at as ReviewedAt,
                sv.reviewed_by_admin_id as ReviewedByAdminId,
                sp.id as StudentProfileId,
                u.id as StudentUserId,
                u.email as StudentEmail,
                u.username as StudentUsername,
                u.full_name as StudentFullName,
                sp.school as School,
                sp.major as Major,
                sp.study_start_year as StudyStartYear,
                sp.bio as Bio,
                sp.verification_status as VerificationStatus,
                sp.can_withdraw as CanWithdraw,
                f.id as DocumentFileId,
                f.storage_provider as StorageProvider,
                f.bucket as Bucket,
                f.storage_key as StorageKey,
                f.original_filename as OriginalFilename,
                f.mime_type as MimeType,
                f.file_extension as FileExtension,
                f.file_size_bytes as FileSizeBytes,
                f.checksum as Checksum
            from public.student_verifications sv
            join public.student_profiles sp on sp.id = sv.student_profile_id
            join public.users u on u.id = sp.user_id
            join public.files f on f.id = sv.document_file_id
            where sv.id = @VerificationId
            """;

        await using var connection = connectionFactory.CreateConnection();
        var detail = await connection.QuerySingleOrDefaultAsync<AdminStudentVerificationDetailResponse>(
            new CommandDefinition(sql, new { VerificationId = verificationId }, cancellationToken: cancellationToken));

        if (detail is null)
        {
            throw new InvalidOperationException("Student verification was not found.");
        }

        detail.DocumentPreviewUrl = $"/api/v1/admin/student-verifications/{detail.Id}/document";
        return detail;
    }

    public async Task<StudentVerificationDocumentResponse> GetStudentVerificationDocumentAsync(
        Guid verificationId,
        CancellationToken cancellationToken = default)
    {
        var verification = await RequireVerificationAsync(verificationId, cancellationToken);
        var file = await unitOfWork.Repository<FileAsset>().GetByIdAsync(verification.DocumentFileId, cancellationToken);

        if (file is null)
        {
            throw new InvalidOperationException("Verification document was not found.");
        }

        if (!string.Equals(file.StorageProvider, "LOCAL", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Verification document is not stored locally.");
        }

        return new StudentVerificationDocumentResponse(
            file.StorageKey,
            file.OriginalFilename,
            file.MimeType);
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

    private async Task<SubscriptionPlan?> GetSubscriptionPlanAsync(
        Guid subscriptionPlanId,
        CancellationToken cancellationToken)
    {
        if (subscriptionPlanId == Guid.Empty)
        {
            return null;
        }

        return await unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(subscriptionPlanId, cancellationToken);
    }

    private static SmeProfileResponse ToSmeProfileResponse(
        SmeProfile profile,
        SubscriptionPlan? subscriptionPlan)
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
            subscriptionPlan is null
                ? null
                : new SubscriptionPlanSummaryResponse(
                    subscriptionPlan.Id,
                    subscriptionPlan.Code,
                    subscriptionPlan.Name,
                    subscriptionPlan.MonthlyPrice,
                    subscriptionPlan.PlatformFeeRate,
                    subscriptionPlan.MaxActiveOpenProjects,
                    subscriptionPlan.MaxProjectBudget,
                    subscriptionPlan.IsActive),
            profile.SubscriptionStartedAt,
            profile.SubscriptionCurrentPeriodEnd,
            string.Equals(subscriptionPlan?.Code, BasicPlanCode, StringComparison.OrdinalIgnoreCase) &&
                subscriptionPlan?.MonthlyPrice == 0m &&
                profile.SubscriptionCurrentPeriodEnd is null,
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

    private static StudentEmailVerificationResponse ToStudentEmailVerificationResponse(
        StudentEmailVerification verification)
    {
        return new StudentEmailVerificationResponse(
            verification.Id,
            verification.StudentProfileId,
            verification.Email,
            verification.Status,
            verification.RequestedAt,
            verification.ExpiresAt,
            verification.ConfirmedAt);
    }

    private async Task SendStudentEduEmailVerificationCodeAsync(
        User user,
        string eduEmail,
        string code,
        DateTimeOffset expiresAt,
        CancellationToken cancellationToken)
    {
        var html = $"""
            <p>Xin chào {System.Net.WebUtility.HtmlEncode(user.FullName)},</p>
            <p>Bạn đang xác thực email sinh viên trên D4U.</p>
            <p>Mã xác thực email EDU của bạn là:</p>
            <h2 style="letter-spacing: 4px;">{code}</h2>
            <p>Mã này hết hạn lúc {expiresAt:yyyy-MM-dd HH:mm:ss} UTC.</p>
            <p>Không chia sẻ mã này cho bất kỳ ai. Nếu bạn không yêu cầu xác thực email sinh viên, vui lòng bỏ qua email này.</p>
            """;

        await emailSender.SendAsync(eduEmail, "D4U - Mã xác thực email sinh viên", html, cancellationToken);
    }

    private bool IsAllowedEduEmail(string email)
    {
        var atIndex = email.LastIndexOf('@');

        if (atIndex < 0 || atIndex == email.Length - 1)
        {
            return false;
        }

        var domain = email[(atIndex + 1)..].ToLowerInvariant();
        var allowedDomains = emailVerificationOptions.Value.AllowedDomains
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim().TrimStart('@').TrimStart('.').ToLowerInvariant())
            .ToArray();

        return allowedDomains.Any(allowedDomain =>
            domain == allowedDomain || domain.EndsWith($".{allowedDomain}", StringComparison.OrdinalIgnoreCase));
    }

    private static string CreateVerificationCode(int length)
    {
        var normalizedLength = Math.Clamp(length, 4, 12);
        var builder = new StringBuilder(normalizedLength);
        builder.Append(RandomNumberGenerator.GetInt32(1, 10));

        for (var index = 1; index < normalizedLength; index++)
        {
            builder.Append(RandomNumberGenerator.GetInt32(0, 10));
        }

        return builder.ToString();
    }

    private static string HashVerificationCode(string code)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(code.Trim()));
        return Convert.ToHexString(bytes);
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }
}
