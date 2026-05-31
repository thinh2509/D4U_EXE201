namespace D4U.Api.Infrastructure.BackgroundServices;

using D4U.Api.Application.Features.MoneyMovement;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

public sealed class EscrowReleaseBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<EscrowReleaseBackgroundService> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromMinutes(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(PollInterval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ReleasePendingEscrowsAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to release pending escrows.");
            }

            await timer.WaitForNextTickAsync(stoppingToken);
        }
    }

    private async Task ReleasePendingEscrowsAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<D4UDbContext>();
        var moneyMovementService = scope.ServiceProvider.GetRequiredService<IMoneyMovementService>();
        var projectIds = await dbContext.Escrows
            .Where(escrow => escrow.Status == EscrowStatus.RELEASE_PENDING)
            .OrderBy(escrow => escrow.UpdatedAt)
            .Select(escrow => escrow.ProjectId)
            .Take(50)
            .ToListAsync(cancellationToken);

        foreach (var projectId in projectIds)
        {
            try
            {
                await moneyMovementService.ReleaseProjectEscrowAsync(projectId, null, cancellationToken);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to release escrow for project {ProjectId}.", projectId);
            }
        }
    }
}
