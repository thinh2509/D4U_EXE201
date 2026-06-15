namespace D4U.Api.Application.Features.Projects;

using D4U.Api.Application.Features.MoneyMovement;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

public sealed class ProjectWorkspaceService(D4UDbContext dbContext) : IProjectWorkspaceService
{
    public async Task<ProjectWorkspaceResponse> GetAsync(
        Guid userId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        var access = await RequireAccessAsync(userId, projectId, cancellationToken);
        var offer = await dbContext.ProjectOffers
            .Where(value => value.ProjectId == projectId)
            .OrderByDescending(value => value.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
        var escrow = await dbContext.Escrows
            .FirstOrDefaultAsync(value => value.ProjectId == projectId, cancellationToken);
        var refund = escrow is null
            ? null
            : await dbContext.Refunds
                .Where(value => value.EscrowId == escrow.Id)
                .OrderByDescending(value => value.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);
        var payment = escrow is null
            ? null
            : await dbContext.Payments
                .Where(value => value.EscrowId == escrow.Id)
                .OrderByDescending(value => value.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);
        var submissions = await LoadSubmissionsAsync(projectId, cancellationToken);
        var reviewActions = await dbContext.ReviewActions
            .Where(value => value.ProjectId == projectId)
            .OrderByDescending(value => value.CreatedAt)
            .Select(value => new WorkspaceReviewActionResponse(
                value.Id,
                value.SubmissionId,
                value.Action,
                value.Comment,
                value.RequestedChanges,
                value.RevisionRound,
                value.DueAt,
                value.InvalidFileReason,
                value.ReuploadDueAt,
                value.CreatedAt))
            .ToListAsync(cancellationToken);
        var studentFullName = offer is null
            ? null
            : await (
                from profile in dbContext.StudentProfiles
                join user in dbContext.Users on profile.UserId equals user.Id
                where profile.Id == offer.StudentProfileId
                select user.FullName)
                .FirstOrDefaultAsync(cancellationToken);
        var nextAction = GetNextAction(access.Project, offer, submissions);
        var currentRating = await dbContext.Ratings
            .Where(value => value.ProjectId == projectId && value.RaterUserId == userId)
            .OrderByDescending(value => value.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
        var isOwnerSme = access.User.Role == UserRole.SME;
        var isSelectedStudent = access.User.Role == UserRole.STUDENT;
        var ratingState = BuildRatingState(access.Project, access.User.Role, isOwnerSme, isSelectedStudent, currentRating, DateTimeOffset.UtcNow);

        return new ProjectWorkspaceResponse(
            access.Project.Id,
            access.Project.Title,
            access.Project.Status,
            access.User.Role.ToString(),
            nextAction.Action,
            nextAction.Role,
            access.Project.BudgetAmount,
            access.Project.Currency,
            access.Project.TotalDeadlineAt,
            access.Project.SketchDeadlineAt,
            access.Project.FinalDeadlineAt,
            access.Project.AcceptedAt,
            access.Project.CompletedAt,
            access.Project.RatingDueAt,
            ratingState.CanRate,
            ratingState.HasRated,
            ratingState.RatedAt,
            access.Project.CurrentRevisionRound,
            offer is null
                ? null
                : new WorkspaceOfferResponse(
                    offer.Id,
                    offer.Status,
                    offer.OfferedAmount,
                    offer.ExpiresAt,
                    offer.PaymentDueAt,
                    studentFullName ?? "Student",
                    offer.CreatedAt,
                    offer.AcceptedAt,
                    offer.RejectedAt,
                    offer.ExpiredAt),
            payment is null
                ? null
                : new WorkspacePaymentResponse(
                    payment.Id,
                    payment.Status,
                    payment.Provider,
                    access.User.Role == UserRole.SME ? payment.CheckoutUrl : null,
                    access.User.Role == UserRole.SME ? payment.QrCode : null,
                    payment.ExpiresAt,
                    payment.PaidAt,
                    payment.CreatedAt,
                    payment.UpdatedAt),
            escrow is null
                ? null
                : new WorkspaceEscrowResponse(
                    escrow.Id,
                    escrow.Status,
                    escrow.Amount,
                    escrow.PlatformFeeAmount,
                    escrow.FundedAt,
                    escrow.ReleasedAt,
                    escrow.CreatedAt),
            refund is null || escrow is null
                ? null
                : new RefundResponse(
                    refund.Id,
                    refund.EscrowId,
                    access.Project.Id,
                    access.Project.Title,
                    null,
                    offer is null ? null : studentFullName,
                    refund.Amount,
                    refund.Currency,
                    refund.Reason,
                    refund.Status,
                    refund.CreatedAt,
                    refund.CompletedAt,
                    refund.ProviderRefundId),
            submissions,
            reviewActions);
    }

    public async Task<IReadOnlyList<WorkspaceSubmissionResponse>> ListSubmissionsAsync(
        Guid userId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        await RequireAccessAsync(userId, projectId, cancellationToken);
        return await LoadSubmissionsAsync(projectId, cancellationToken);
    }

    private async Task<IReadOnlyList<WorkspaceSubmissionResponse>> LoadSubmissionsAsync(
        Guid projectId,
        CancellationToken cancellationToken)
    {
        var submissions = await dbContext.ProjectSubmissions
            .Where(value => value.ProjectId == projectId)
            .OrderByDescending(value => value.SubmittedAt)
            .ToListAsync(cancellationToken);
        var submissionIds = submissions.Select(value => value.Id).ToList();
        var files = await (
            from submissionFile in dbContext.SubmissionFiles
            join file in dbContext.Files on submissionFile.FileId equals file.Id
            where submissionIds.Contains(submissionFile.SubmissionId)
            orderby submissionFile.CreatedAt
            select new
            {
                SubmissionFile = submissionFile,
                File = file
            })
            .ToListAsync(cancellationToken);
        var filesBySubmissionId = files
            .GroupBy(value => value.SubmissionFile.SubmissionId)
            .ToDictionary(
                group => group.Key,
                group => (IReadOnlyList<WorkspaceSubmissionFileResponse>)group
                    .Select(value => new WorkspaceSubmissionFileResponse(
                        value.SubmissionFile.Id,
                        value.File.Id,
                        value.File.OriginalFilename,
                        value.File.MimeType,
                        value.SubmissionFile.IsOriginalDownloadable,
                        $"/api/v1/files/{value.File.Id}/download"))
                    .ToList());

        return submissions
            .Select(submission => new WorkspaceSubmissionResponse(
                submission.Id,
                submission.SubmissionType,
                submission.MilestoneType,
                submission.RevisionRound,
                submission.Description,
                submission.Status,
                submission.SubmittedAt,
                submission.ReviewDueAt,
                submission.ApprovedAt,
                submission.AutoApprovedAt,
                filesBySubmissionId.GetValueOrDefault(submission.Id, [])))
            .ToList();
    }

    private async Task<WorkspaceAccess> RequireAccessAsync(
        Guid userId,
        Guid projectId,
        CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(value => value.Id == userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("User was not found.");
        var project = await dbContext.Projects.FirstOrDefaultAsync(value => value.Id == projectId, cancellationToken)
            ?? throw new InvalidOperationException("Project was not found.");

        if (user.Role == UserRole.ADMIN)
        {
            return new WorkspaceAccess(user, project);
        }

        if (user.Role == UserRole.SME)
        {
            var ownsProject = await dbContext.SmeProfiles.AnyAsync(
                value => value.UserId == userId && value.Id == project.SmeProfileId,
                cancellationToken);

            if (ownsProject)
            {
                return new WorkspaceAccess(user, project);
            }
        }

        if (user.Role == UserRole.STUDENT && project.SelectedStudentProfileId.HasValue)
        {
            var isSelectedStudent = await dbContext.StudentProfiles.AnyAsync(
                value => value.UserId == userId && value.Id == project.SelectedStudentProfileId.Value,
                cancellationToken);

            if (isSelectedStudent)
            {
                return new WorkspaceAccess(user, project);
            }
        }

        throw new UnauthorizedAccessException("User cannot access this project workspace.");
    }

    private static WorkspaceNextAction GetNextAction(
        Project project,
        ProjectOffer? offer,
        IReadOnlyList<WorkspaceSubmissionResponse> submissions)
    {
        if (project.Status is ProjectStatus.DRAFT or ProjectStatus.OPEN or ProjectStatus.PRIVATE_INVITED)
        {
            return new WorkspaceNextAction("WAIT_STUDENT_APPLICATION", "SME");
        }

        if (project.Status == ProjectStatus.OFFER_SELECTED)
        {
            return offer?.Status switch
            {
                OfferStatus.WAITING_ACCEPTANCE => new WorkspaceNextAction("WAIT_STUDENT_ACCEPT", "STUDENT"),
                OfferStatus.ACCEPTED or OfferStatus.PAYMENT_FAILED or OfferStatus.PENDING_PAYMENT =>
                    new WorkspaceNextAction("PAY_ESCROW", "SME"),
                _ => new WorkspaceNextAction("CREATE_OFFER", "SME")
            };
        }

        if (project.Status == ProjectStatus.SKETCH_REVIEW)
        {
            return new WorkspaceNextAction("REVIEW_SKETCH", "SME");
        }

        if (project.Status == ProjectStatus.FINAL_REVIEW)
        {
            return new WorkspaceNextAction("REVIEW_FINAL", "SME");
        }

        if (project.Status == ProjectStatus.REVISION_REQUESTED)
        {
            return new WorkspaceNextAction("SUBMIT_REVISION", "STUDENT");
        }

        if (project.Status == ProjectStatus.ADMIN_REVIEW)
        {
            return new WorkspaceNextAction("ADMIN_REVIEW", "ADMIN");
        }

        if (project.Status == ProjectStatus.COMPLETED)
        {
            return new WorkspaceNextAction("COMPLETED", "SYSTEM");
        }

        if (project.Status == ProjectStatus.STUDENT_ABANDONED)
        {
            return new WorkspaceNextAction("STUDENT_ABANDONED", "SYSTEM");
        }

        if (project.Status == ProjectStatus.CANCELLED)
        {
            return new WorkspaceNextAction("CANCELLED", "SYSTEM");
        }

        var sketchApproved = submissions.Any(value =>
            value.MilestoneType == SubmissionStage.SKETCH &&
            value.Status == SubmissionStatus.APPROVED);

        return sketchApproved
            ? new WorkspaceNextAction("SUBMIT_FINAL", "STUDENT")
            : new WorkspaceNextAction("SUBMIT_SKETCH", "STUDENT");
    }

    private sealed record WorkspaceAccess(User User, Project Project);

    private sealed record WorkspaceNextAction(string Action, string Role);

    private static RatingStateSnapshot BuildRatingState(
        Project project,
        UserRole userRole,
        bool isOwnerSme,
        bool isSelectedStudent,
        Rating? existingRating,
        DateTimeOffset now)
    {
        var hasRated = existingRating is not null;
        var ratedAt = existingRating?.CreatedAt;

        if (project.Status != ProjectStatus.COMPLETED || !project.RatingDueAt.HasValue)
        {
            return new RatingStateSnapshot(false, hasRated, ratedAt);
        }

        if (hasRated)
        {
            return new RatingStateSnapshot(false, true, ratedAt);
        }

        if (project.RatingDueAt.Value <= now)
        {
            return new RatingStateSnapshot(false, false, null);
        }

        var canRate = userRole switch
        {
            UserRole.SME => isOwnerSme && project.SelectedStudentProfileId.HasValue,
            UserRole.STUDENT => isSelectedStudent,
            _ => false
        };

        return new RatingStateSnapshot(canRate, false, null);
    }

    private sealed record RatingStateSnapshot(
        bool CanRate,
        bool HasRated,
        DateTimeOffset? RatedAt);
}
