namespace D4U.Api.Infrastructure.BackgroundServices;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

public sealed class StudentAbandonmentBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<StudentAbandonmentBackgroundService> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromHours(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Auto-abandon scan failed.");
            }

            await Task.Delay(PollInterval, stoppingToken);
        }
    }

    private async Task ProcessAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<D4UDbContext>();
        var now = DateTimeOffset.UtcNow;

        if (now.Hour != 1)
        {
            return;
        }

        var candidates = await dbContext.Projects
            .Where(project => project.Status == ProjectStatus.IN_PROGRESS && project.SketchDeadlineAt < now)
            .OrderBy(project => project.SketchDeadlineAt)
            .Take(50)
            .ToListAsync(cancellationToken);

        foreach (var project in candidates)
        {
            var hasSubmission = await dbContext.ProjectSubmissions
                .AnyAsync(submission => submission.ProjectId == project.Id, cancellationToken);

            if (hasSubmission)
            {
                continue;
            }

            var escrow = await dbContext.Escrows
                .FirstOrDefaultAsync(value => value.ProjectId == project.Id && value.Status == EscrowStatus.FUNDED, cancellationToken);

            if (escrow is null)
            {
                continue;
            }

            var hasRefund = await dbContext.Refunds
                .AnyAsync(value => value.EscrowId == escrow.Id, cancellationToken);

            if (hasRefund)
            {
                continue;
            }

            var previousStatus = project.Status;
            project.Status = ProjectStatus.STUDENT_ABANDONED;
            project.CancelledAt = now;
            project.CancellationReason = "Auto-abandoned because sketch deadline passed without submission.";
            project.UpdatedAt = now;
            escrow.Status = EscrowStatus.REFUND_PENDING;
            escrow.UpdatedAt = now;

            var paymentId = await dbContext.Payments
                .Where(payment => payment.EscrowId == escrow.Id && payment.Status == PaymentStatus.SUCCESS)
                .OrderByDescending(payment => payment.PaidAt ?? payment.CreatedAt)
                .Select(payment => (Guid?)payment.Id)
                .FirstOrDefaultAsync(cancellationToken);

            await dbContext.Refunds.AddAsync(
                new Refund
                {
                    Id = Guid.NewGuid(),
                    EscrowId = escrow.Id,
                    PaymentId = paymentId,
                    Amount = escrow.Amount,
                    Currency = escrow.Currency,
                    Reason = "AUTO_STUDENT_ABANDONED",
                    Status = "PENDING",
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
                    BeforeJson = $$"""{"projectStatus":"{{previousStatus}}","escrowStatus":"{{EscrowStatus.FUNDED}}"}""",
                    AfterJson = $$"""{"projectStatus":"{{ProjectStatus.STUDENT_ABANDONED}}","escrowStatus":"{{EscrowStatus.REFUND_PENDING}}","reason":"AUTO_SKETCH_DEADLINE"}""",
                    CreatedAt = now
                },
                cancellationToken);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
