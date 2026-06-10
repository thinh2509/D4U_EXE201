namespace D4U.Api.Application.Features.Notifications;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;

public sealed record NotificationResponse(
    Guid Id,
    Guid RecipientUserId,
    Guid? ActorUserId,
    string Type,
    string Title,
    string? Body,
    string? ReferenceType,
    Guid? ReferenceId,
    NotificationStatus Status,
    DateTimeOffset? ReadAt,
    DateTimeOffset CreatedAt);

public sealed record NotificationUnreadCountResponse(int UnreadCount);

public sealed record NotificationsMarkedAllReadResponse(DateTimeOffset ReadAt);

public static class NotificationMappings
{
    public static NotificationResponse ToResponse(Notification notification)
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
