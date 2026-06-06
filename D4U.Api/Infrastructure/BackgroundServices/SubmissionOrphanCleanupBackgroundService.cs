namespace D4U.Api.Infrastructure.BackgroundServices;

using D4U.Api.Application.Common.Files;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

public sealed class SubmissionOrphanCleanupBackgroundService(
    IServiceScopeFactory scopeFactory,
    IUploadPathResolver uploadPathResolver,
    ILogger<SubmissionOrphanCleanupBackgroundService> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromHours(1);
    private static readonly TimeSpan OrphanLifetime = TimeSpan.FromHours(24);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(PollInterval);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await DeleteExpiredOrphansAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to clean up orphan submission files.");
            }

            await timer.WaitForNextTickAsync(stoppingToken);
        }
    }

    private async Task DeleteExpiredOrphansAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<D4UDbContext>();
        var cutoff = DateTimeOffset.UtcNow.Subtract(OrphanLifetime);
        var orphans = await dbContext.Files
            .Where(file =>
                file.StorageProvider == "LOCAL" &&
                file.StorageKey.StartsWith("submissions/") &&
                file.CreatedAt <= cutoff &&
                !dbContext.SubmissionFiles.Any(link =>
                    link.FileId == file.Id || link.WatermarkedFileId == file.Id))
            .OrderBy(file => file.CreatedAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        foreach (var orphan in orphans)
        {
            var absolutePath = uploadPathResolver.GetAbsolutePath(orphan.StorageKey);
            if (File.Exists(absolutePath))
            {
                File.Delete(absolutePath);
            }

            dbContext.Files.Remove(orphan);
        }

        if (orphans.Count > 0)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}
