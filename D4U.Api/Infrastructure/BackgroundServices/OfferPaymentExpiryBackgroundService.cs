namespace D4U.Api.Infrastructure.BackgroundServices;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

public sealed class OfferPaymentExpiryBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<OfferPaymentExpiryBackgroundService> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromMinutes(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(PollInterval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ExpireStaleOffersAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to expire stale offers or payments.");
            }

            await timer.WaitForNextTickAsync(stoppingToken);
        }
    }

    private async Task ExpireStaleOffersAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<D4UDbContext>();
        var now = DateTimeOffset.UtcNow;

        var staleOffers = await dbContext.ProjectOffers
            .Where(offer =>
                (offer.Status == OfferStatus.WAITING_ACCEPTANCE &&
                    offer.ExpiresAt.HasValue &&
                    offer.ExpiresAt <= now) ||
                ((offer.Status == OfferStatus.ACCEPTED || offer.Status == OfferStatus.PENDING_PAYMENT) &&
                    offer.PaymentDueAt.HasValue &&
                    offer.PaymentDueAt <= now))
            .ToListAsync(cancellationToken);

        if (staleOffers.Count == 0)
        {
            return;
        }

        foreach (var offer in staleOffers)
        {
            var previousStatus = offer.Status;
            offer.Status = OfferStatus.EXPIRED;
            offer.ExpiredAt ??= now;

            await ExpirePendingPaymentsAsync(dbContext, offer, now, cancellationToken);
            await ReleaseProjectIfBlockedAsync(dbContext, offer, now, cancellationToken);
            await AddOfferAuditLogAsync(dbContext, offer, previousStatus, now, cancellationToken);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task ExpirePendingPaymentsAsync(
        D4UDbContext dbContext,
        ProjectOffer offer,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var escrow = await dbContext.Escrows.FirstOrDefaultAsync(
            value => value.ProjectId == offer.ProjectId && value.StudentProfileId == offer.StudentProfileId,
            cancellationToken);

        if (escrow is null)
        {
            return;
        }

        var pendingPayments = await dbContext.Payments
            .Where(payment => payment.EscrowId == escrow.Id && payment.Status == PaymentStatus.PENDING)
            .ToListAsync(cancellationToken);

        foreach (var payment in pendingPayments)
        {
            payment.Status = PaymentStatus.EXPIRED;
            payment.UpdatedAt = now;
        }

        if (escrow.Status == EscrowStatus.PENDING_PAYMENT)
        {
            escrow.Status = EscrowStatus.CANCELLED;
            escrow.UpdatedAt = now;
        }
    }

    private static async Task ReleaseProjectIfBlockedAsync(
        D4UDbContext dbContext,
        ProjectOffer offer,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var project = await dbContext.Projects.FirstOrDefaultAsync(
            value => value.Id == offer.ProjectId,
            cancellationToken);

        if (project is null)
        {
            return;
        }

        if (project.SelectedStudentProfileId == offer.StudentProfileId)
        {
            project.SelectedStudentProfileId = null;
            project.AcceptedAt = null;
        }

        if (project.Status == ProjectStatus.OFFER_SELECTED)
        {
            var hasOtherActiveOffer = await dbContext.ProjectOffers.AnyAsync(
                value => value.ProjectId == project.Id &&
                    value.Id != offer.Id &&
                    (value.Status == OfferStatus.WAITING_ACCEPTANCE ||
                        value.Status == OfferStatus.ACCEPTED ||
                        value.Status == OfferStatus.PENDING_PAYMENT ||
                        value.Status == OfferStatus.ACTIVE),
                cancellationToken);

            if (!hasOtherActiveOffer)
            {
                project.Status = project.ProjectType == ProjectType.OPEN
                    ? ProjectStatus.OPEN
                    : ProjectStatus.PRIVATE_INVITED;
            }
        }

        project.UpdatedAt = now;
    }

    private static async Task AddOfferAuditLogAsync(
        D4UDbContext dbContext,
        ProjectOffer offer,
        OfferStatus previousStatus,
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
                BeforeJson = $$"""{"status":"{{previousStatus}}"}""",
                AfterJson = $$"""{"status":"{{OfferStatus.EXPIRED}}","reason":"TIMEOUT"}""",
                CreatedAt = now
            },
            cancellationToken);
    }
}
