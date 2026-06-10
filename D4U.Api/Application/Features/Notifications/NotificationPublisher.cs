namespace D4U.Api.Application.Features.Notifications;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

public sealed class NotificationPublisher(
    IServiceScopeFactory serviceScopeFactory,
    INotificationRealtimeDispatcher realtimeDispatcher,
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
            var exists = type == "PROJECT_DEADLINES_UPDATED"
                ? false
                : await dbContext.Notifications.AnyAsync(
                    notification => notification.RecipientUserId == recipientUserId &&
                        notification.Type == type &&
                        notification.ReferenceType == referenceType &&
                        notification.ReferenceId == referenceId,
                    cancellationToken);

            if (exists)
            {
                return;
            }

            var notification = new Notification
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
            };

            await dbContext.Notifications.AddAsync(notification, cancellationToken);

            await dbContext.SaveChangesAsync(cancellationToken);

            var unreadCount = await dbContext.Notifications.CountAsync(
                value => value.RecipientUserId == recipientUserId && value.Status == NotificationStatus.UNREAD,
                cancellationToken);

            await realtimeDispatcher.DispatchCreatedAsync(
                NotificationMappings.ToResponse(notification),
                unreadCount,
                cancellationToken);
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
