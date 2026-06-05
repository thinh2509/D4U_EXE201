namespace D4U.Api.Application.Features.Notifications;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

public sealed class NotificationPublisher(
    IServiceScopeFactory serviceScopeFactory,
    ILogger<NotificationPublisher> logger) : INotificationPublisher
{
    public async Task PublishAsync(
        Guid recipientUserId,
        Guid? actorUserId,
        string type,
        string title,
        string body,
        string referenceType,
        Guid referenceId,
        DateTimeOffset createdAt,
        CancellationToken cancellationToken = default)
    {
        try
        {
            using var scope = serviceScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<D4UDbContext>();
            var exists = await dbContext.Notifications.AnyAsync(
                notification => notification.RecipientUserId == recipientUserId &&
                    notification.Type == type &&
                    notification.ReferenceType == referenceType &&
                    notification.ReferenceId == referenceId,
                cancellationToken);

            if (exists)
            {
                return;
            }

            await dbContext.Notifications.AddAsync(
                new Notification
                {
                    Id = Guid.NewGuid(),
                    RecipientUserId = recipientUserId,
                    ActorUserId = actorUserId,
                    Type = type,
                    Title = title,
                    Body = body,
                    ReferenceType = referenceType,
                    ReferenceId = referenceId,
                    Status = NotificationStatus.UNREAD,
                    CreatedAt = createdAt
                },
                cancellationToken);

            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogWarning(
                exception,
                "Could not publish notification {NotificationType} for {ReferenceType} {ReferenceId}.",
                type,
                referenceType,
                referenceId);
        }
    }
}
