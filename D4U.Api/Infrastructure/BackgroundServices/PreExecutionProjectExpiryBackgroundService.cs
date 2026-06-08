namespace D4U.Api.Infrastructure.BackgroundServices;

using D4U.Api.Application.Features.Notifications;
using D4U.Api.Application.Features.Projects;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

public sealed class PreExecutionProjectExpiryBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<PreExecutionProjectExpiryBackgroundService> logger) : BackgroundService
{
    private const string AutoCancellationReason = "Auto-cancelled because total deadline passed before project execution started.";
    private const string ProjectExpiryReason = "PRE_EXECUTION_TOTAL_DEADLINE_EXPIRED";
    private static readonly TimeSpan PollInterval = TimeSpan.FromMinutes(15);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(PollInterval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ExpireOverdueProjectsAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to expire overdue pre-execution projects.");
            }

            await timer.WaitForNextTickAsync(stoppingToken);
        }
    }

    private async Task ExpireOverdueProjectsAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<D4UDbContext>();
        var notificationPublisher = scope.ServiceProvider.GetRequiredService<INotificationPublisher>();
        var now = DateTimeOffset.UtcNow;

        var candidates = await dbContext.Projects
            .Where(project =>
                project.TotalDeadlineAt <= now &&
                (project.Status == ProjectStatus.OPEN || project.Status == ProjectStatus.OFFER_SELECTED))
            .OrderBy(project => project.TotalDeadlineAt)
            .Take(50)
            .ToListAsync(cancellationToken);

        foreach (var project in candidates)
        {
            var hasBlockingOffer = await dbContext.ProjectOffers.AnyAsync(
                offer => offer.ProjectId == project.Id &&
                    (offer.Status == OfferStatus.ACCEPTED ||
                        offer.Status == OfferStatus.PENDING_PAYMENT ||
                        offer.Status == OfferStatus.ACTIVE),
                cancellationToken);

            if (hasBlockingOffer)
            {
                continue;
            }

            var waitingOffers = await dbContext.ProjectOffers
                .Where(offer => offer.ProjectId == project.Id && offer.Status == OfferStatus.WAITING_ACCEPTANCE)
                .ToListAsync(cancellationToken);

            foreach (var waitingOffer in waitingOffers)
            {
                OfferStateMachine.TransitionTo(waitingOffer, OfferStatus.EXPIRED, now);
                await ReleaseApplicationAsync(dbContext, waitingOffer, now, cancellationToken);
                await AddOfferAuditLogAsync(dbContext, waitingOffer, now, cancellationToken);
            }

            var previousStatus = project.Status;
            project.Status = ProjectStatus.CANCELLED;
            project.CancelledAt = now;
            project.CancellationReason = AutoCancellationReason;
            project.SelectedStudentProfileId = null;
            project.AcceptedAt = null;
            project.UpdatedAt = now;

            if (previousStatus == ProjectStatus.OPEN)
            {
                var smeProfile = await dbContext.SmeProfiles.FirstOrDefaultAsync(
                    profile => profile.Id == project.SmeProfileId,
                    cancellationToken);

                if (smeProfile is not null)
                {
                    smeProfile.ActiveOpenProjectCount = await dbContext.Projects.CountAsync(
                        candidate => candidate.SmeProfileId == project.SmeProfileId &&
                            candidate.ProjectType == ProjectType.OPEN &&
                            candidate.Status == ProjectStatus.OPEN,
                        cancellationToken) - 1;

                    if (smeProfile.ActiveOpenProjectCount < 0)
                    {
                        smeProfile.ActiveOpenProjectCount = 0;
                    }

                    smeProfile.UpdatedAt = now;
                }
            }

            await dbContext.AuditLogs.AddAsync(
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    Action = "PROJECT_STATUS_CHANGED",
                    EntityType = nameof(Project),
                    EntityId = project.Id,
                    BeforeJson = $$"""{"status":"{{previousStatus}}"}""",
                    AfterJson = $$"""{"status":"{{ProjectStatus.CANCELLED}}","reason":"{{ProjectExpiryReason}}"}""",
                    CreatedAt = now
                },
                cancellationToken);

            await dbContext.SaveChangesAsync(cancellationToken);

            await PublishNotificationsAsync(
                dbContext,
                notificationPublisher,
                project,
                waitingOffers,
                now,
                cancellationToken);
        }
    }

    private static async Task ReleaseApplicationAsync(
        D4UDbContext dbContext,
        ProjectOffer offer,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        if (!offer.ApplicationId.HasValue)
        {
            return;
        }

        var application = await dbContext.ProjectApplications.FirstOrDefaultAsync(
            value => value.Id == offer.ApplicationId.Value,
            cancellationToken);

        if (application is not null && application.Status == "SELECTED")
        {
            application.Status = "SUBMITTED";
            application.UpdatedAt = now;
        }
    }

    private static async Task AddOfferAuditLogAsync(
        D4UDbContext dbContext,
        ProjectOffer offer,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        await dbContext.AuditLogs.AddAsync(
            new AuditLog
            {
                Id = Guid.NewGuid(),
                Action = "OFFER_EXPIRED",
                EntityType = nameof(ProjectOffer),
                EntityId = offer.Id,
                BeforeJson = $$"""{"status":"{{OfferStatus.WAITING_ACCEPTANCE}}"}""",
                AfterJson = $$"""{"status":"{{OfferStatus.EXPIRED}}","reason":"{{ProjectExpiryReason}}"}""",
                CreatedAt = now
            },
            cancellationToken);
    }

    private static async Task PublishNotificationsAsync(
        D4UDbContext dbContext,
        INotificationPublisher notificationPublisher,
        Project project,
        IReadOnlyList<ProjectOffer> waitingOffers,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var smeUserId = await dbContext.SmeProfiles
            .Where(profile => profile.Id == project.SmeProfileId)
            .Select(profile => profile.UserId)
            .FirstAsync(cancellationToken);

        await notificationPublisher.PublishAsync(
            smeUserId,
            null,
            "PROJECT_AUTO_CANCELLED",
            "Project da tu dong dong",
            $"Project {project.Title} da bi tu dong dong vi qua total deadline truoc khi vao execution.",
            nameof(Project),
            project.Id,
            now,
            cancellationToken);

        foreach (var waitingOffer in waitingOffers)
        {
            var studentUserId = await dbContext.StudentProfiles
                .Where(profile => profile.Id == waitingOffer.StudentProfileId)
                .Select(profile => profile.UserId)
                .FirstAsync(cancellationToken);

            await notificationPublisher.PublishAsync(
                studentUserId,
                null,
                "OFFER_EXPIRED",
                "Offer da het hieu luc",
                $"Offer cho project {project.Title} da het hieu luc vi project da qua total deadline.",
                nameof(ProjectOffer),
                waitingOffer.Id,
                now,
                cancellationToken);
        }
    }
}
