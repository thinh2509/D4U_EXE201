namespace D4U.Api.Application.Features.Admin;

using System.Text.Json;
using D4U.Api.Application.Common.Data;
using D4U.Api.Application.Common.Exceptions;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

public sealed class AdminOperationsService(IUnitOfWork unitOfWork) : IAdminOperationsService
{
    public async Task<IReadOnlyList<AdminUserListItemResponse>> ListUsersAsync(
        string? role,
        string? status,
        string? keyword,
        CancellationToken cancellationToken = default)
    {
        var users = unitOfWork.Repository<User>().Query().AsNoTracking();

        if (TryParseEnumFilter<UserRole>(role, out var roleFilter))
        {
            users = users.Where(user => user.Role == roleFilter);
        }

        if (TryParseEnumFilter<UserStatus>(status, out var statusFilter))
        {
            users = users.Where(user => user.Status == statusFilter);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var normalizedKeyword = keyword.Trim();
            users = users.Where(user =>
                EF.Functions.ILike(user.FullName, $"%{normalizedKeyword}%") ||
                EF.Functions.ILike(user.Email, $"%{normalizedKeyword}%") ||
                EF.Functions.ILike(user.Username, $"%{normalizedKeyword}%"));
        }

        var rows = await (
            from user in users
            join studentProfile in unitOfWork.Repository<StudentProfile>().Query().AsNoTracking()
                on user.Id equals studentProfile.UserId into studentProfiles
            from studentProfile in studentProfiles.DefaultIfEmpty()
            join smeProfile in unitOfWork.Repository<SmeProfile>().Query().AsNoTracking()
                on user.Id equals smeProfile.UserId into smeProfiles
            from smeProfile in smeProfiles.DefaultIfEmpty()
            orderby user.UpdatedAt descending, user.CreatedAt descending
            select new AdminUserListItemResponse(
                user.Id,
                user.FullName,
                user.Email,
                user.Username,
                user.Role,
                user.Status,
                user.EmailVerifiedAt,
                user.LastLoginAt,
                user.CreatedAt,
                studentProfile != null,
                smeProfile != null,
                studentProfile != null ? studentProfile.VerificationStatus : null,
                studentProfile != null
                    ? studentProfile.OnboardingStatus
                    : smeProfile != null
                        ? smeProfile.OnboardingStatus
                        : null,
                smeProfile != null ? smeProfile.CompanyName : null))
            .ToListAsync(cancellationToken);

        return rows;
    }

    public async Task<AdminUserDetailResponse> GetUserDetailAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await unitOfWork.Repository<User>().GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User was not found.");

        var studentProfile = await unitOfWork.Repository<StudentProfile>().FirstOrDefaultAsync(
            profile => profile.UserId == userId,
            cancellationToken);
        var smeProfile = await unitOfWork.Repository<SmeProfile>().FirstOrDefaultAsync(
            profile => profile.UserId == userId,
            cancellationToken);

        var purchaseSummary = await BuildPackageSummaryAsync(userId, cancellationToken);
        var withdrawalSummary = await BuildWithdrawalSummaryAsync(userId, cancellationToken);
        var projectSummary = await BuildProjectSummaryAsync(studentProfile?.Id, smeProfile?.Id, cancellationToken);

        return new AdminUserDetailResponse(
            user.Id,
            user.FullName,
            user.Email,
            user.Username,
            user.AvatarUrl,
            user.Role,
            user.Status,
            user.EmailVerifiedAt,
            user.LastLoginAt,
            user.CreatedAt,
            user.UpdatedAt,
            studentProfile == null ? null : new AdminUserProfileSnapshotResponse(
                studentProfile.Id,
                "STUDENT",
                studentProfile.School,
                studentProfile.Major,
                studentProfile.OnboardingStatus,
                studentProfile.VerificationStatus,
                studentProfile.CompletedProjectsCount,
                0,
                studentProfile.CanWithdraw),
            smeProfile == null ? null : new AdminUserProfileSnapshotResponse(
                smeProfile.Id,
                "SME",
                smeProfile.CompanyName,
                smeProfile.RepresentativeName,
                smeProfile.OnboardingStatus,
                null,
                smeProfile.CompletedProjectsCount,
                smeProfile.ActiveOpenProjectCount,
                false),
            purchaseSummary,
            withdrawalSummary,
            projectSummary);
    }

    public async Task<AdminUserDetailResponse> SuspendUserAsync(
        Guid actorUserId,
        Guid userId,
        AdminUserLifecycleActionRequest request,
        CancellationToken cancellationToken = default)
    {
        if (actorUserId == userId)
        {
            throw new ConflictException("Admin cannot suspend the current account.");
        }

        var user = await unitOfWork.Repository<User>().GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User was not found.");

        if (user.Status is UserStatus.BANNED or UserStatus.DELETED)
        {
            throw new ConflictException("This account cannot be suspended from the current state.");
        }

        if (user.Status == UserStatus.SUSPENDED)
        {
            throw new ConflictException("User is already suspended.");
        }

        var previousStatus = user.Status;
        var now = DateTimeOffset.UtcNow;
        user.Status = UserStatus.SUSPENDED;
        user.UpdatedAt = now;

        await AddUserAuditAsync(
            actorUserId,
            userId,
            "USER_SUSPENDED",
            previousStatus,
            user.Status,
            request.Reason,
            now,
            cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return await GetUserDetailAsync(userId, cancellationToken);
    }

    public async Task<AdminUserDetailResponse> ReactivateUserAsync(
        Guid actorUserId,
        Guid userId,
        AdminUserLifecycleActionRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await unitOfWork.Repository<User>().GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("User was not found.");

        if (user.Status != UserStatus.SUSPENDED)
        {
            throw new ConflictException("Only suspended accounts can be reactivated.");
        }

        var previousStatus = user.Status;
        var now = DateTimeOffset.UtcNow;
        user.Status = UserStatus.ACTIVE;
        user.UpdatedAt = now;

        await AddUserAuditAsync(
            actorUserId,
            userId,
            "USER_REACTIVATED",
            previousStatus,
            user.Status,
            request.Reason,
            now,
            cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return await GetUserDetailAsync(userId, cancellationToken);
    }

    public async Task<IReadOnlyList<AdminProjectListItemResponse>> ListProjectsAsync(
        string? status,
        string? keyword,
        Guid? smeUserId,
        Guid? studentUserId,
        CancellationToken cancellationToken = default)
    {
        var query =
            from project in unitOfWork.Repository<Project>().Query().AsNoTracking()
            join category in unitOfWork.Repository<DesignCategory>().Query().AsNoTracking()
                on project.DesignCategoryId equals category.Id
            join smeProfile in unitOfWork.Repository<SmeProfile>().Query().AsNoTracking()
                on project.SmeProfileId equals smeProfile.Id
            join smeUser in unitOfWork.Repository<User>().Query().AsNoTracking()
                on smeProfile.UserId equals smeUser.Id
            select new
            {
                Project = project,
                CategoryName = category.Name,
                SmeProfile = smeProfile,
                SmeUser = smeUser
            };

        if (TryParseEnumFilter<ProjectStatus>(status, out var statusFilter))
        {
            query = query.Where(row => row.Project.Status == statusFilter);
        }

        if (smeUserId.HasValue)
        {
            query = query.Where(row => row.SmeUser.Id == smeUserId.Value);
        }

        if (studentUserId.HasValue)
        {
            var selectedStudentProfileIds = await unitOfWork.Repository<StudentProfile>().Query()
                .Where(profile => profile.UserId == studentUserId.Value)
                .Select(profile => profile.Id)
                .ToListAsync(cancellationToken);

            query = query.Where(row =>
                row.Project.SelectedStudentProfileId.HasValue &&
                selectedStudentProfileIds.Contains(row.Project.SelectedStudentProfileId.Value));
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var normalizedKeyword = keyword.Trim();
            query = query.Where(row =>
                EF.Functions.ILike(row.Project.Title, $"%{normalizedKeyword}%") ||
                EF.Functions.ILike(row.Project.Brief, $"%{normalizedKeyword}%") ||
                EF.Functions.ILike(row.SmeUser.FullName, $"%{normalizedKeyword}%") ||
                EF.Functions.ILike(row.SmeProfile.CompanyName, $"%{normalizedKeyword}%"));
        }

        var rows = await query
            .OrderByDescending(row => row.Project.UpdatedAt)
            .Select(row => new AdminProjectBaseRow(row.Project, row.CategoryName, row.SmeProfile, row.SmeUser))
            .ToListAsync(cancellationToken);

        var projectIds = rows.Select(row => row.Project.Id).ToList();
        var snapshots = await BuildProjectExecutionSnapshotMapAsync(projectIds, cancellationToken);
        var studentParticipantMap = await BuildStudentParticipantMapAsync(rows, cancellationToken);

        return rows
            .Select(row =>
            {
                snapshots.TryGetValue(row.Project.Id, out var snapshot);
                studentParticipantMap.TryGetValue(row.Project.Id, out var studentParticipant);
                return new AdminProjectListItemResponse(
                    row.Project.Id,
                    row.Project.Title,
                    row.CategoryName,
                    row.Project.Status,
                    row.Project.BudgetAmount,
                    row.Project.Currency,
                    row.Project.UpdatedAt,
                    row.SmeUser.Id,
                    row.SmeUser.FullName,
                    row.SmeProfile.CompanyName,
                    studentParticipant?.UserId,
                    studentParticipant?.FullName,
                    snapshot?.PaymentStatus,
                    snapshot?.EscrowStatus,
                    snapshot?.LatestSubmissionStatus,
                    row.Project.Status == ProjectStatus.ADMIN_REVIEW);
            })
            .ToList();
    }

    public async Task<AdminProjectDetailResponse> GetProjectDetailAsync(
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        var row = await (
            from project in unitOfWork.Repository<Project>().Query().AsNoTracking()
            join category in unitOfWork.Repository<DesignCategory>().Query().AsNoTracking()
                on project.DesignCategoryId equals category.Id
            join smeProfile in unitOfWork.Repository<SmeProfile>().Query().AsNoTracking()
                on project.SmeProfileId equals smeProfile.Id
            join smeUser in unitOfWork.Repository<User>().Query().AsNoTracking()
                on smeProfile.UserId equals smeUser.Id
            where project.Id == projectId
            select new AdminProjectBaseRow(project, category.Name, smeProfile, smeUser))
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Project was not found.");

        var snapshotMap = await BuildProjectExecutionSnapshotMapAsync([projectId], cancellationToken);
        var snapshot = snapshotMap.GetValueOrDefault(projectId) ?? new ProjectExecutionSnapshotInternal();
        var timeline = await BuildProjectTimelineAsync(projectId, cancellationToken);
        var studentParticipant = await BuildStudentParticipantAsync(row.Project.SelectedStudentProfileId, cancellationToken);

        return new AdminProjectDetailResponse(
            row.Project.Id,
            row.Project.Title,
            row.Project.Brief,
            row.Project.UsagePurpose,
            row.CategoryName,
            row.Project.ProjectType,
            row.Project.Status,
            row.Project.BudgetAmount,
            row.Project.Currency,
            row.Project.TotalDeadlineAt,
            row.Project.SketchDeadlineAt,
            row.Project.FinalDeadlineAt,
            row.Project.CurrentRevisionRound,
            row.Project.MaxRevisionRounds,
            row.Project.IsConfidential,
            row.Project.AllowStudentPortfolio,
            row.Project.PublishedAt,
            row.Project.AcceptedAt,
            row.Project.CompletedAt,
            row.Project.CancelledAt,
            row.Project.CancellationReason,
            row.Project.CreatedAt,
            row.Project.UpdatedAt,
            row.Project.Status == ProjectStatus.ADMIN_REVIEW,
            new AdminProjectParticipantResponse(
                row.SmeUser.Id,
                row.SmeProfile.Id,
                row.SmeUser.FullName,
                row.SmeProfile.CompanyName,
                "SME",
                null),
            studentParticipant == null
                ? null
                : new AdminProjectParticipantResponse(
                    studentParticipant.UserId,
                    studentParticipant.ProfileId,
                    studentParticipant.FullName,
                    null,
                    "STUDENT",
                    studentParticipant.VerificationStatus),
            new AdminProjectExecutionSnapshotResponse(
                snapshot.PaymentStatus,
                snapshot.EscrowStatus,
                snapshot.LatestSubmissionStatus,
                snapshot.LatestSubmissionAt,
                snapshot.TotalApplications,
                snapshot.TotalOffers,
                snapshot.AdminReviewReason),
            timeline);
    }

    private async Task<AdminUserPackageSummaryResponse> BuildPackageSummaryAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var purchases = await unitOfWork.Repository<FeaturePackagePurchase>().Query()
            .Where(value => value.BuyerUserId == userId)
            .Select(value => value.Status)
            .ToListAsync(cancellationToken);

        var activeEntitlements = await unitOfWork.Repository<UserFeatureEntitlement>().Query()
            .CountAsync(
                value => value.UserId == userId && value.Status == FeatureEntitlementStatus.ACTIVE,
                cancellationToken);

        return new AdminUserPackageSummaryResponse(
            purchases.Count,
            purchases.Count(value => value == FeaturePackagePurchaseStatus.PENDING),
            purchases.Count(value => value == FeaturePackagePurchaseStatus.ACTIVE),
            purchases.Count(value => value == FeaturePackagePurchaseStatus.FAILED),
            activeEntitlements);
    }

    private async Task<AdminUserWithdrawalSummaryResponse> BuildWithdrawalSummaryAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var statuses = await unitOfWork.Repository<WithdrawalRequest>().Query()
            .Where(value => value.RequestedByUserId == userId)
            .Select(value => value.Status)
            .ToListAsync(cancellationToken);

        return new AdminUserWithdrawalSummaryResponse(
            statuses.Count,
            statuses.Count(value => value == "PENDING"),
            statuses.Count(value => value == "PROCESSING"),
            statuses.Count(value => value == "COMPLETED"),
            statuses.Count(value => value == "FAILED"));
    }

    private async Task<AdminUserProjectSummaryResponse> BuildProjectSummaryAsync(
        Guid? studentProfileId,
        Guid? smeProfileId,
        CancellationToken cancellationToken)
    {
        var projectStatuses = new List<ProjectStatus>();

        if (studentProfileId.HasValue)
        {
            projectStatuses.AddRange(await unitOfWork.Repository<Project>().Query()
                .Where(value => value.SelectedStudentProfileId == studentProfileId.Value)
                .Select(value => value.Status)
                .ToListAsync(cancellationToken));
        }

        if (smeProfileId.HasValue)
        {
            projectStatuses.AddRange(await unitOfWork.Repository<Project>().Query()
                .Where(value => value.SmeProfileId == smeProfileId.Value)
                .Select(value => value.Status)
                .ToListAsync(cancellationToken));
        }

        return new AdminUserProjectSummaryResponse(
            projectStatuses.Count(value => value == ProjectStatus.OPEN),
            projectStatuses.Count(value => value is ProjectStatus.IN_PROGRESS or ProjectStatus.SKETCH_REVIEW or ProjectStatus.FINAL_REVIEW or ProjectStatus.REVISION_REQUESTED),
            projectStatuses.Count(value => value == ProjectStatus.ADMIN_REVIEW),
            projectStatuses.Count(value => value == ProjectStatus.COMPLETED));
    }

    private async Task<Dictionary<Guid, ProjectExecutionSnapshotInternal>> BuildProjectExecutionSnapshotMapAsync(
        IReadOnlyCollection<Guid> projectIds,
        CancellationToken cancellationToken)
    {
        if (projectIds.Count == 0)
        {
            return [];
        }

        var submissions = await unitOfWork.Repository<ProjectSubmission>().Query()
            .Where(value => projectIds.Contains(value.ProjectId))
            .OrderByDescending(value => value.SubmittedAt)
            .ToListAsync(cancellationToken);

        var submissionByProjectId = submissions
            .GroupBy(value => value.ProjectId)
            .ToDictionary(group => group.Key, group => group.First());

        var applicationCounts = await unitOfWork.Repository<ProjectApplication>().Query()
            .Where(value => projectIds.Contains(value.ProjectId))
            .GroupBy(value => value.ProjectId)
            .ToDictionaryAsync(group => group.Key, group => group.Count(), cancellationToken);

        var offerCounts = await unitOfWork.Repository<ProjectOffer>().Query()
            .Where(value => projectIds.Contains(value.ProjectId))
            .GroupBy(value => value.ProjectId)
            .ToDictionaryAsync(group => group.Key, group => group.Count(), cancellationToken);

        var escrows = await unitOfWork.Repository<Escrow>().Query()
            .Where(value => projectIds.Contains(value.ProjectId))
            .OrderByDescending(value => value.CreatedAt)
            .ToListAsync(cancellationToken);

        var escrowByProjectId = escrows
            .GroupBy(value => value.ProjectId)
            .ToDictionary(group => group.Key, group => group.First());

        var escrowIds = escrows.Select(value => value.Id).ToList();
        List<Payment> payments = escrowIds.Count == 0
            ? []
            : await unitOfWork.Repository<Payment>().Query()
                .Where(value => value.EscrowId.HasValue && escrowIds.Contains(value.EscrowId.Value))
                .OrderByDescending(value => value.CreatedAt)
                .ToListAsync(cancellationToken);

        var paymentByEscrowId = payments
            .Where(value => value.EscrowId.HasValue)
            .GroupBy(value => value.EscrowId!.Value)
            .ToDictionary(group => group.Key, group => group.First());

        var adminReviewReasons = await unitOfWork.Repository<AuditLog>().Query()
            .Where(value => value.EntityType == nameof(Project) && value.EntityId.HasValue && projectIds.Contains(value.EntityId.Value))
            .OrderByDescending(value => value.CreatedAt)
            .Select(value => new { value.EntityId, value.AfterJson })
            .ToListAsync(cancellationToken);

        var reviewReasonByProjectId = adminReviewReasons
            .Where(value => value.EntityId.HasValue)
            .GroupBy(value => value.EntityId!.Value)
            .ToDictionary(
                group => group.Key,
                group => group
                    .Select(value => TryExtractReason(value.AfterJson))
                    .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value)));

        var snapshotMap = new Dictionary<Guid, ProjectExecutionSnapshotInternal>();

        foreach (var projectId in projectIds)
        {
            submissionByProjectId.TryGetValue(projectId, out var latestSubmission);
            escrowByProjectId.TryGetValue(projectId, out var escrow);
            Payment? payment = null;

            if (escrow is not null)
            {
                paymentByEscrowId.TryGetValue(escrow.Id, out payment);
            }

            snapshotMap[projectId] = new ProjectExecutionSnapshotInternal
            {
                PaymentStatus = payment?.Status,
                EscrowStatus = escrow?.Status,
                LatestSubmissionStatus = latestSubmission?.Status,
                LatestSubmissionAt = latestSubmission?.SubmittedAt,
                TotalApplications = applicationCounts.GetValueOrDefault(projectId),
                TotalOffers = offerCounts.GetValueOrDefault(projectId),
                AdminReviewReason = reviewReasonByProjectId.GetValueOrDefault(projectId)
            };
        }

        return snapshotMap;
    }

    private async Task<Dictionary<Guid, StudentParticipantInternal?>> BuildStudentParticipantMapAsync(
        IReadOnlyCollection<AdminProjectBaseRow> rows,
        CancellationToken cancellationToken)
    {
        var selectedStudentProfileIds = rows
            .Select(row => row.Project.SelectedStudentProfileId)
            .Where(value => value.HasValue)
            .Select(value => value!.Value)
            .Distinct()
            .ToList();

        if (selectedStudentProfileIds.Count == 0)
        {
            return [];
        }

        var participantRows = await (
            from profile in unitOfWork.Repository<StudentProfile>().Query().AsNoTracking()
            join user in unitOfWork.Repository<User>().Query().AsNoTracking()
                on profile.UserId equals user.Id
            where selectedStudentProfileIds.Contains(profile.Id)
            select new StudentParticipantInternal(
                profile.Id,
                user.Id,
                user.FullName,
                profile.VerificationStatus))
            .ToListAsync(cancellationToken);

        var participantByProfileId = participantRows.ToDictionary(value => value.ProfileId);

        return rows
            .Where(row => row.Project.SelectedStudentProfileId.HasValue)
            .ToDictionary(
                row => row.Project.Id,
                row => participantByProfileId.GetValueOrDefault(row.Project.SelectedStudentProfileId!.Value));
    }

    private async Task<StudentParticipantInternal?> BuildStudentParticipantAsync(
        Guid? studentProfileId,
        CancellationToken cancellationToken)
    {
        if (!studentProfileId.HasValue)
        {
            return null;
        }

        return await (
            from profile in unitOfWork.Repository<StudentProfile>().Query().AsNoTracking()
            join user in unitOfWork.Repository<User>().Query().AsNoTracking()
                on profile.UserId equals user.Id
            where profile.Id == studentProfileId.Value
            select new StudentParticipantInternal(
                profile.Id,
                user.Id,
                user.FullName,
                profile.VerificationStatus))
            .FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<IReadOnlyList<AdminProjectTimelineItemResponse>> BuildProjectTimelineAsync(
        Guid projectId,
        CancellationToken cancellationToken)
    {
        var rows = await (
            from audit in unitOfWork.Repository<AuditLog>().Query().AsNoTracking()
            join actor in unitOfWork.Repository<User>().Query().AsNoTracking()
                on audit.ActorUserId equals actor.Id into actors
            from actor in actors.DefaultIfEmpty()
            where audit.EntityType == nameof(Project) &&
                audit.EntityId == projectId
            orderby audit.CreatedAt descending
            select new AdminProjectTimelineItemResponse(
                audit.Id,
                audit.Action,
                actor != null ? actor.FullName : null,
                audit.CreatedAt,
                TryExtractReason(audit.AfterJson)))
            .Take(8)
            .ToListAsync(cancellationToken);

        return rows;
    }

    private async Task AddUserAuditAsync(
        Guid actorUserId,
        Guid userId,
        string action,
        UserStatus previousStatus,
        UserStatus nextStatus,
        string? reason,
        DateTimeOffset createdAt,
        CancellationToken cancellationToken)
    {
        await unitOfWork.Repository<AuditLog>().AddAsync(
            new AuditLog
            {
                Id = Guid.NewGuid(),
                ActorUserId = actorUserId,
                Action = action,
                EntityType = nameof(User),
                EntityId = userId,
                BeforeJson = $$"""{"status":"{{previousStatus}}"}""",
                AfterJson = $$"""{"status":"{{nextStatus}}","reason":"{{EscapeJsonString(reason)}}"}""",
                CreatedAt = createdAt
            },
            cancellationToken);
    }

    private static string? TryExtractReason(string? afterJson)
    {
        if (string.IsNullOrWhiteSpace(afterJson))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(afterJson);
            if (document.RootElement.TryGetProperty("reason", out var reasonElement) &&
                reasonElement.ValueKind == JsonValueKind.String)
            {
                return reasonElement.GetString();
            }

            return null;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static bool TryParseEnumFilter<TEnum>(string? value, out TEnum parsed)
        where TEnum : struct, Enum
    {
        if (!string.IsNullOrWhiteSpace(value) &&
            Enum.TryParse<TEnum>(value.Trim(), true, out parsed))
        {
            return true;
        }

        parsed = default;
        return false;
    }

    private static string EscapeJsonString(string? value)
    {
        return JsonSerializer.Serialize(value?.Trim() ?? string.Empty).Trim('"');
    }

    private sealed record ProjectExecutionSnapshotInternal
    {
        public PaymentStatus? PaymentStatus { get; init; }
        public EscrowStatus? EscrowStatus { get; init; }
        public SubmissionStatus? LatestSubmissionStatus { get; init; }
        public DateTimeOffset? LatestSubmissionAt { get; init; }
        public int TotalApplications { get; init; }
        public int TotalOffers { get; init; }
        public string? AdminReviewReason { get; init; }
    }

    private sealed record AdminProjectBaseRow(
        Project Project,
        string CategoryName,
        SmeProfile SmeProfile,
        User SmeUser);

    private sealed record StudentParticipantInternal(
        Guid ProfileId,
        Guid UserId,
        string FullName,
        string VerificationStatus);
}
