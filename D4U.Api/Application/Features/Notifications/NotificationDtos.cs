namespace D4U.Api.Application.Features.Notifications;

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
