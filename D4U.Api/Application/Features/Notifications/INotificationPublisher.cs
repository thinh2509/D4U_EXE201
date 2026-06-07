namespace D4U.Api.Application.Features.Notifications;

public interface INotificationPublisher
{
    Task PublishAsync(
        Guid recipientUserId,
        Guid? actorUserId,
        string type,
        string title,
        string body,
        string referenceType,
        Guid referenceId,
        DateTimeOffset createdAt,
        CancellationToken cancellationToken = default);
}
