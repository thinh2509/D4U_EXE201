namespace D4U.Api.Application.Features.Notifications;

using D4U.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

public sealed class SignalRNotificationRealtimeDispatcher(
    IHubContext<NotificationHub> hubContext,
    ILogger<SignalRNotificationRealtimeDispatcher> logger) : INotificationRealtimeDispatcher
{
    public async Task DispatchCreatedAsync(
        NotificationResponse notification,
        int unreadCount,
        CancellationToken cancellationToken = default)
    {
        await SendToUserAsync(
            notification.RecipientUserId,
            async client =>
            {
                await client.SendAsync("notificationCreated", notification, cancellationToken);
                await client.SendAsync("notificationUnreadCountChanged", new NotificationUnreadCountResponse(unreadCount), cancellationToken);
            });
    }

    public async Task DispatchUpdatedAsync(
        NotificationResponse notification,
        int unreadCount,
        CancellationToken cancellationToken = default)
    {
        await SendToUserAsync(
            notification.RecipientUserId,
            async client =>
            {
                await client.SendAsync("notificationUpdated", notification, cancellationToken);
                await client.SendAsync("notificationUnreadCountChanged", new NotificationUnreadCountResponse(unreadCount), cancellationToken);
            });
    }

    public async Task DispatchAllReadAsync(
        Guid recipientUserId,
        DateTimeOffset readAt,
        CancellationToken cancellationToken = default)
    {
        await SendToUserAsync(
            recipientUserId,
            async client =>
            {
                await client.SendAsync("notificationsMarkedAllRead", new NotificationsMarkedAllReadResponse(readAt), cancellationToken);
                await client.SendAsync("notificationUnreadCountChanged", new NotificationUnreadCountResponse(0), cancellationToken);
            });
    }

    private async Task SendToUserAsync(Guid recipientUserId, Func<IClientProxy, Task> callback)
    {
        try
        {
            await callback(hubContext.Clients.User(recipientUserId.ToString()));
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Could not dispatch realtime notification event to {RecipientUserId}.", recipientUserId);
        }
    }
}
