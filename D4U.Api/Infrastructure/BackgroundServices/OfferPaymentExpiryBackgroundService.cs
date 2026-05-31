namespace D4U.Api.Infrastructure.BackgroundServices;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using D4U.Api.Application.Features.Projects;
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
        await ExpireCheckoutPaymentsAsync(dbContext, now, cancellationToken);

        var staleOffers = await dbContext.ProjectOffers
            .Where(offer =>
                (offer.Status == OfferStatus.WAITING_ACCEPTANCE &&
                    offer.ExpiresAt.HasValue &&
                    offer.ExpiresAt <= now) ||
                ((offer.Status == OfferStatus.ACCEPTED ||
                        offer.Status == OfferStatus.PENDING_PAYMENT ||
                        offer.Status == OfferStatus.PAYMENT_FAILED) &&
                    offer.PaymentDueAt.HasValue &&
                    offer.PaymentDueAt <= now))
            .ToListAsync(cancellationToken);

        if (staleOffers.Count == 0)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return;
        }

        foreach (var offer in staleOffers)
        {
            var previousStatus = offer.Status;
            OfferStateMachine.TransitionTo(offer, OfferStatus.EXPIRED, now);

            await ExpirePendingPaymentsAsync(dbContext, offer, now, cancellationToken);
            await ReleaseProjectIfBlockedAsync(dbContext, offer, now, cancellationToken);
            await AddOfferAuditLogAsync(dbContext, offer, previousStatus, now, cancellationToken);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task ExpireCheckoutPaymentsAsync(
        D4UDbContext dbContext,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var stalePayments = await dbContext.Payments
            .Where(payment => payment.Status == PaymentStatus.PENDING && payment.ExpiresAt <= now)
            .ToListAsync(cancellationToken);

        foreach (var payment in stalePayments)
        {
            payment.Status = PaymentStatus.EXPIRED;
            payment.UpdatedAt = now;
            await AddPaymentExpiredAuditLogAsync(dbContext, payment, now, "CHECKOUT_TIMEOUT", cancellationToken);

            if (payment.EscrowId.HasValue)
            {
                var escrow = await dbContext.Escrows.FirstOrDefaultAsync(
                    value => value.Id == payment.EscrowId.Value,
                    cancellationToken);
                var hasActiveCheckout = await dbContext.Payments.AnyAsync(
                    value => value.Id != payment.Id &&
                        value.EscrowId == payment.EscrowId &&
                        value.Status == PaymentStatus.PENDING &&
                        value.ExpiresAt > now,
                    cancellationToken);
                var offer = escrow is null || hasActiveCheckout
                    ? null
                    : await dbContext.ProjectOffers.FirstOrDefaultAsync(
                        value => value.ProjectId == escrow.ProjectId &&
                            value.StudentProfileId == escrow.StudentProfileId &&
                            value.Status == OfferStatus.PENDING_PAYMENT,
                        cancellationToken);

                if (offer is not null)
                {
                    OfferStateMachine.TransitionTo(offer, OfferStatus.PAYMENT_FAILED, now);
                }
            }
        }
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
            await AddPaymentExpiredAuditLogAsync(dbContext, payment, now, "OFFER_TIMEOUT", cancellationToken);
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

        await ReleaseApplicationAsync(dbContext, offer, now, cancellationToken);

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
                        value.Status == OfferStatus.PAYMENT_FAILED ||
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

    private static async Task AddPaymentExpiredAuditLogAsync(
        D4UDbContext dbContext,
        Payment payment,
        DateTimeOffset now,
        string reason,
        CancellationToken cancellationToken)
    {
        await dbContext.AuditLogs.AddAsync(
            new AuditLog
            {
                Id = Guid.NewGuid(),
                Action = "PAYMENT_EXPIRED",
                EntityType = nameof(Payment),
                EntityId = payment.Id,
                BeforeJson = $$"""{"status":"{{PaymentStatus.PENDING}}"}""",
                AfterJson = $$"""{"status":"{{PaymentStatus.EXPIRED}}","reason":"{{reason}}"}""",
                CreatedAt = now
            },
            cancellationToken);
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
