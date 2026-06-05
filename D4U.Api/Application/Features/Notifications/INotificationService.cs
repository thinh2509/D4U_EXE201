namespace D4U.Api.Application.Features.Notifications;

public interface INotificationService
{
    Task<IReadOnlyList<NotificationResponse>> ListMyNotificationsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<NotificationResponse> MarkReadAsync(
        Guid userId,
        Guid notificationId,
        CancellationToken cancellationToken = default);

    Task MarkAllReadAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}
