namespace D4U.Api.Application.Features.Notifications;

using D4U.Api.Application.Common.Exceptions;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

public sealed class NotificationService(D4UDbContext dbContext) : INotificationService
{
    public async Task<IReadOnlyList<NotificationResponse>> ListMyNotificationsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.Notifications
            .Where(value => value.RecipientUserId == userId)
            .OrderByDescending(value => value.CreatedAt)
            .Take(100)
            .Select(value => ToResponse(value))
            .ToListAsync(cancellationToken);
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
        return ToResponse(notification);
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
    }

    private static NotificationResponse ToResponse(Notification notification)
    {
        return new NotificationResponse(
            notification.Id,
            notification.RecipientUserId,
            notification.ActorUserId,
            notification.Type,
            notification.Title,
            notification.Body,
            notification.ReferenceType,
            notification.ReferenceId,
            notification.Status,
            notification.ReadAt,
            notification.CreatedAt);
    }
}
