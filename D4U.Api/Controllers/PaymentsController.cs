namespace D4U.Api.Controllers;

using System.Security.Claims;
using D4U.Api.Application.Features.Payments;
using D4U.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1")]
public sealed class PaymentsController(IPaymentService paymentService) : ControllerBase
{
    [HttpPost("offers/{offerId:guid}/payment")]
    [Authorize(Roles = nameof(UserRole.SME))]
    public async Task<ActionResult<PaymentResponse>> CreateOfferPayment(
        Guid offerId,
        CancellationToken cancellationToken)
    {
        var response = await paymentService.CreateOfferPaymentAsync(GetRequiredUserId(), offerId, cancellationToken);
        return Ok(response);
    }

    [HttpGet("payments/{paymentId:guid}")]
    [Authorize]
    public async Task<ActionResult<PaymentResponse>> GetPayment(
        Guid paymentId,
        CancellationToken cancellationToken)
    {
        var response = await paymentService.GetPaymentAsync(GetRequiredUserId(), paymentId, cancellationToken);
        return Ok(response);
    }

    [HttpGet("payments/{paymentId:guid}/return-status")]
    [AllowAnonymous]
    public async Task<ActionResult<PaymentReturnStatusResponse>> GetReturnStatus(
        Guid paymentId,
        CancellationToken cancellationToken)
    {
        var response = await paymentService.GetReturnStatusAsync(paymentId, cancellationToken);
        return Ok(response);
    }

    [HttpGet("payments/return-status/by-order-code/{orderCode:long}")]
    [AllowAnonymous]
    public async Task<ActionResult<PaymentReturnStatusResponse>> GetReturnStatusByOrderCode(
        long orderCode,
        CancellationToken cancellationToken)
    {
        var response = await paymentService.GetReturnStatusByOrderCodeAsync(orderCode, cancellationToken);
        return Ok(response);
    }

    [HttpGet("projects/{projectId:guid}/escrow")]
    [Authorize]
    public async Task<ActionResult<EscrowResponse>> GetProjectEscrow(
        Guid projectId,
        CancellationToken cancellationToken)
    {
        var response = await paymentService.GetProjectEscrowAsync(GetRequiredUserId(), projectId, cancellationToken);
        return Ok(response);
    }

    [HttpPost("payments/payos/webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> PayOsWebhook(
        PayOsWebhookRequest request,
        CancellationToken cancellationToken)
    {
        await paymentService.ProcessPayOsWebhookAsync(request, cancellationToken);
        return Ok(new { success = true });
    }

    private Guid GetRequiredUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(value, out var userId))
        {
            throw new UnauthorizedAccessException("User id claim is missing.");
        }

        return userId;
    }
}
