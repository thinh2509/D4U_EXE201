namespace D4U.Api.Controllers;

using System.Security.Claims;
using D4U.Api.Application.Features.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public sealed class NotificationsController(INotificationService notificationService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<NotificationResponse>>> List(CancellationToken cancellationToken)
    {
        var response = await notificationService.ListMyNotificationsAsync(GetRequiredUserId(), cancellationToken);
        return Ok(response);
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<NotificationUnreadCountResponse>> GetUnreadCount(CancellationToken cancellationToken)
    {
        var response = await notificationService.GetUnreadCountAsync(GetRequiredUserId(), cancellationToken);
        return Ok(response);
    }

    [HttpPost("{notificationId:guid}/read")]
    public async Task<ActionResult<NotificationResponse>> MarkRead(
        Guid notificationId,
        CancellationToken cancellationToken)
    {
        var response = await notificationService.MarkReadAsync(GetRequiredUserId(), notificationId, cancellationToken);
        return Ok(response);
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken cancellationToken)
    {
        await notificationService.MarkAllReadAsync(GetRequiredUserId(), cancellationToken);
        return Ok(new { read = true });
    }

    private Guid GetRequiredUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out var userId)
            ? userId
            : throw new UnauthorizedAccessException("User id claim is missing.");
    }
}
