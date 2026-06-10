namespace D4U.Api.Application.Features.Notifications;

public interface INotificationRealtimeDispatcher
{
    Task DispatchCreatedAsync(
        NotificationResponse notification,
        int unreadCount,
        CancellationToken cancellationToken = default);

    Task DispatchUpdatedAsync(
        NotificationResponse notification,
        int unreadCount,
        CancellationToken cancellationToken = default);

    Task DispatchAllReadAsync(
        Guid recipientUserId,
        DateTimeOffset readAt,
        CancellationToken cancellationToken = default);
}
