namespace D4U.Api.Infrastructure.BackgroundServices;

using D4U.Api.Application.Features.MoneyMovement;
using D4U.Api.Application.Features.Notifications;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

public sealed class SubmissionAutoApprovalBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<SubmissionAutoApprovalBackgroundService> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromMinutes(15);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(PollInterval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await AutoApproveDueSubmissionsAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to auto-approve due project submissions.");
            }

            await timer.WaitForNextTickAsync(stoppingToken);
        }
    }

    private async Task AutoApproveDueSubmissionsAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<D4UDbContext>();
        var now = DateTimeOffset.UtcNow;
        var completedProjectIds = new HashSet<Guid>();
        var approvedItems = new List<(Project Project, ProjectSubmission Submission)>();

        var dueSubmissions = await dbContext.ProjectSubmissions
            .Where(submission =>
                (submission.Status == SubmissionStatus.SUBMITTED ||
                    submission.Status == SubmissionStatus.VALID) &&
                submission.ReviewDueAt.HasValue &&
                submission.ReviewDueAt <= now)
            .OrderBy(submission => submission.SubmittedAt)
            .ToListAsync(cancellationToken);

        foreach (var submission in dueSubmissions)
        {
            var project = await dbContext.Projects.FirstOrDefaultAsync(
                value => value.Id == submission.ProjectId,
                cancellationToken);

            if (project is null || !CanAutoApprove(project, submission))
            {
                continue;
            }

            var previousStatus = project.Status;
            submission.Status = SubmissionStatus.APPROVED;
            submission.ApprovedAt = now;
            submission.AutoApprovedAt = now;

            project.Status = submission.MilestoneType == SubmissionStage.SKETCH
                ? ProjectStatus.IN_PROGRESS
                : ProjectStatus.COMPLETED;
            project.CompletedAt = submission.MilestoneType == SubmissionStage.FINAL ? now : project.CompletedAt;
            project.RatingDueAt = submission.MilestoneType == SubmissionStage.FINAL ? now.AddDays(7) : project.RatingDueAt;
            project.UpdatedAt = now;

            if (submission.MilestoneType == SubmissionStage.FINAL)
            {
                completedProjectIds.Add(project.Id);
                var escrow = await dbContext.Escrows.FirstOrDefaultAsync(
                    value => value.ProjectId == project.Id && value.Status == EscrowStatus.FUNDED,
                    cancellationToken);

                if (escrow is not null)
                {
                    escrow.Status = EscrowStatus.RELEASE_PENDING;
                    escrow.UpdatedAt = now;
                }
            }

            approvedItems.Add((project, submission));

            await dbContext.ReviewActions.AddAsync(
                new ReviewAction
                {
                    Id = Guid.NewGuid(),
                    ProjectId = project.Id,
                    SubmissionId = submission.Id,
                    Action = ReviewActionType.AUTO_APPROVE,
                    Comment = "Auto-approved after 5 business days without SME review.",
                    RevisionRound = submission.RevisionRound,
                    MetadataJson = $$"""{"reason":"REVIEW_TIMEOUT","milestoneType":"{{submission.MilestoneType}}"}""",
                    CreatedAt = now
                },
                cancellationToken);

            await dbContext.AuditLogs.AddAsync(
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    Action = "PROJECT_STATUS_CHANGED",
                    EntityType = nameof(Project),
                    EntityId = project.Id,
                    BeforeJson = $$"""{"status":"{{previousStatus}}"}""",
                    AfterJson = $$"""{"status":"{{project.Status}}","reason":"AUTO_APPROVE_TIMEOUT"}""",
                    CreatedAt = now
                },
                cancellationToken);

        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var notificationPublisher = scope.ServiceProvider.GetRequiredService<INotificationPublisher>();
        foreach (var item in approvedItems)
        {
            var smeUserId = await dbContext.SmeProfiles
                .Where(profile => profile.Id == item.Project.SmeProfileId)
                .Select(profile => profile.UserId)
                .FirstAsync(cancellationToken);
            var studentUserId = await dbContext.StudentProfiles
                .Where(profile => profile.Id == item.Submission.SubmittedByStudentId)
                .Select(profile => profile.UserId)
                .FirstAsync(cancellationToken);
            var milestoneLabel = item.Submission.MilestoneType == SubmissionStage.FINAL ? "Final" : "Sketch";

            await notificationPublisher.PublishAsync(
                studentUserId,
                null,
                "SUBMISSION_AUTO_APPROVED",
                $"{milestoneLabel} đã được tự động duyệt",
                $"{milestoneLabel} của dự án {item.Project.Title} đã được tự động duyệt khi hết hạn review.",
                nameof(ProjectSubmission),
                item.Submission.Id,
                now,
                cancellationToken);
            await notificationPublisher.PublishAsync(
                smeUserId,
                null,
                "SUBMISSION_AUTO_APPROVED",
                $"{milestoneLabel} đã được tự động duyệt",
                $"Hệ thống đã tự động duyệt {milestoneLabel} của dự án {item.Project.Title} khi hết hạn review.",
                nameof(ProjectSubmission),
                item.Submission.Id,
                now,
                cancellationToken);
        }

        if (completedProjectIds.Count == 0)
        {
            return;
        }

        var moneyMovementService = scope.ServiceProvider.GetRequiredService<IMoneyMovementService>();
        foreach (var projectId in completedProjectIds)
        {
            try
            {
                await moneyMovementService.ReleaseProjectEscrowAsync(projectId, null, cancellationToken);
            }
            catch (Exception exception)
            {
                logger.LogWarning(
                    exception,
                    "Immediate escrow release failed after auto-approving project {ProjectId}. The background service will retry.",
                    projectId);
            }
        }
    }

    private static bool CanAutoApprove(Project project, ProjectSubmission submission)
    {
        return (submission.MilestoneType == SubmissionStage.SKETCH && project.Status == ProjectStatus.SKETCH_REVIEW) ||
            (submission.MilestoneType == SubmissionStage.FINAL && project.Status == ProjectStatus.FINAL_REVIEW);
    }
}
