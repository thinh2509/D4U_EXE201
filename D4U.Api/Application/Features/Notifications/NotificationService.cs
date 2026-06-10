namespace D4U.Api.Application.Features.Notifications;

using D4U.Api.Application.Common.Exceptions;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

public sealed class NotificationService(
    D4UDbContext dbContext,
    INotificationRealtimeDispatcher realtimeDispatcher) : INotificationService
{
    public async Task<IReadOnlyList<NotificationResponse>> ListMyNotificationsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Notifications
            .Where(value => value.RecipientUserId == userId)
            .OrderByDescending(value => value.CreatedAt)
            .Take(100)
            .Select(value => new NotificationResponse(
                value.Id,
                value.RecipientUserId,
                value.ActorUserId,
                value.Type,
                value.Title,
                value.Body,
                value.ReferenceType,
                value.ReferenceId,
                value.Status,
                value.ReadAt,
                value.CreatedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task<NotificationUnreadCountResponse> GetUnreadCountAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var unreadCount = await dbContext.Notifications.CountAsync(
            value => value.RecipientUserId == userId && value.Status == NotificationStatus.UNREAD,
            cancellationToken);

        return new NotificationUnreadCountResponse(unreadCount);
    }

    public async Task<NotificationResponse> MarkReadAsync(
        Guid userId,
        Guid notificationId,
        CancellationToken cancellationToken = default)
    {
        var notification = await dbContext.Notifications.FirstOrDefaultAsync(
            value => value.Id == notificationId,
            cancellationToken) ?? throw new NotFoundException("Notification was not found.");

        if (notification.RecipientUserId != userId)
        {
            throw new ForbiddenException("Notification is not available.");
        }

        notification.Status = NotificationStatus.READ;
        notification.ReadAt ??= DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        var unreadCount = await dbContext.Notifications.CountAsync(
            value => value.RecipientUserId == userId && value.Status == NotificationStatus.UNREAD,
            cancellationToken);
        var response = NotificationMappings.ToResponse(notification);
        await realtimeDispatcher.DispatchUpdatedAsync(response, unreadCount, cancellationToken);
        return response;
    }

    public async Task MarkAllReadAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var unread = await dbContext.Notifications
            .Where(value => value.RecipientUserId == userId && value.Status == NotificationStatus.UNREAD)
            .ToListAsync(cancellationToken);
        var now = DateTimeOffset.UtcNow;

        foreach (var notification in unread)
        {
            notification.Status = NotificationStatus.READ;
            notification.ReadAt = now;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await realtimeDispatcher.DispatchAllReadAsync(userId, now, cancellationToken);
    }
}
