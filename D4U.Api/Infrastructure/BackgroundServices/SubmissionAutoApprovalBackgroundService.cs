namespace D4U.Api.Infrastructure.BackgroundServices;

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

        var dueSubmissions = await dbContext.ProjectSubmissions
            .Where(submission =>
                submission.Status == SubmissionStatus.SUBMITTED &&
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
                var escrow = await dbContext.Escrows.FirstOrDefaultAsync(
                    value => value.ProjectId == project.Id && value.Status == EscrowStatus.FUNDED,
                    cancellationToken);

                if (escrow is not null)
                {
                    escrow.Status = EscrowStatus.RELEASE_PENDING;
                    escrow.UpdatedAt = now;
                }
            }

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
    }

    private static bool CanAutoApprove(Project project, ProjectSubmission submission)
    {
        return (submission.MilestoneType == SubmissionStage.SKETCH && project.Status == ProjectStatus.SKETCH_REVIEW) ||
            (submission.MilestoneType == SubmissionStage.FINAL && project.Status == ProjectStatus.FINAL_REVIEW);
    }
}
