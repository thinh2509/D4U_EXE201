namespace D4U.Api.Infrastructure.BackgroundServices;

using D4U.Api.Application.Features.Notifications;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

public sealed class ProjectTotalDeadlineBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<ProjectTotalDeadlineBackgroundService> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromMinutes(15);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(PollInterval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await MoveOverdueProjectsToAdminReviewAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to process projects past their total deadline.");
            }

            await timer.WaitForNextTickAsync(stoppingToken);
        }
    }

    private async Task MoveOverdueProjectsToAdminReviewAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<D4UDbContext>();
        var now = DateTimeOffset.UtcNow;
        var candidates = await dbContext.Projects
            .Where(project =>
                project.TotalDeadlineAt <= now &&
                (project.Status == ProjectStatus.IN_PROGRESS ||
                    project.Status == ProjectStatus.SKETCH_REVIEW ||
                    project.Status == ProjectStatus.REVISION_REQUESTED ||
                    project.Status == ProjectStatus.FINAL_REVIEW))
            .OrderBy(project => project.TotalDeadlineAt)
            .Take(50)
            .ToListAsync(cancellationToken);
        var movedProjects = new List<Project>();

        foreach (var project in candidates)
        {
            var hasFinalWaitingForReview = await dbContext.ProjectSubmissions.AnyAsync(
                submission => submission.ProjectId == project.Id &&
                    submission.MilestoneType == SubmissionStage.FINAL &&
                    (submission.Status == SubmissionStatus.SUBMITTED ||
                        submission.Status == SubmissionStatus.VALID),
                cancellationToken);

            if (hasFinalWaitingForReview)
            {
                continue;
            }

            var previousStatus = project.Status;
            project.Status = ProjectStatus.ADMIN_REVIEW;
            project.UpdatedAt = now;
            movedProjects.Add(project);

            await dbContext.AuditLogs.AddAsync(
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    Action = "PROJECT_STATUS_CHANGED",
                    EntityType = nameof(Project),
                    EntityId = project.Id,
                    BeforeJson = $$"""{"status":"{{previousStatus}}"}""",
                    AfterJson = $$"""{"status":"{{ProjectStatus.ADMIN_REVIEW}}","reason":"TOTAL_DEADLINE_EXPIRED_WITHOUT_REVIEWABLE_FINAL"}""",
                    CreatedAt = now
                },
                cancellationToken);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var notificationPublisher = scope.ServiceProvider.GetRequiredService<INotificationPublisher>();
        foreach (var project in movedProjects)
        {
            var smeUserId = await dbContext.SmeProfiles
                .Where(profile => profile.Id == project.SmeProfileId)
                .Select(profile => profile.UserId)
                .FirstAsync(cancellationToken);

            await notificationPublisher.PublishAsync(
                smeUserId,
                null,
                "PROJECT_ADMIN_REVIEW",
                "Dự án cần Admin xem xét",
                $"Dự án {project.Title} đã quá hạn hoàn tất nhưng chưa có Final hợp lệ để tự động duyệt.",
                nameof(Project),
                project.Id,
                now,
                cancellationToken);

            if (!project.SelectedStudentProfileId.HasValue)
            {
                continue;
            }

            var studentUserId = await dbContext.StudentProfiles
                .Where(profile => profile.Id == project.SelectedStudentProfileId.Value)
                .Select(profile => profile.UserId)
                .FirstOrDefaultAsync(cancellationToken);

            if (studentUserId != Guid.Empty)
            {
                await notificationPublisher.PublishAsync(
                    studentUserId,
                    null,
                    "PROJECT_ADMIN_REVIEW",
                    "Dự án cần Admin xem xét",
                    $"Dự án {project.Title} đã quá hạn hoàn tất và được chuyển cho Admin xem xét.",
                    nameof(Project),
                    project.Id,
                    now,
                    cancellationToken);
            }
        }
    }
}
