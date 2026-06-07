namespace D4U.Api.Controllers;

using System.Security.Claims;
using D4U.Api.Application.Features.MoneyMovement;
using D4U.Api.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/v1")]
[Authorize]
public sealed class MoneyMovementController(IMoneyMovementService moneyMovementService) : ControllerBase
{
    [HttpGet("wallets/me")]
    [Authorize(Roles = nameof(UserRole.STUDENT))]
    public async Task<ActionResult<WalletResponse>> GetMyWallet(CancellationToken cancellationToken)
    {
        var response = await moneyMovementService.GetMyWalletAsync(GetRequiredUserId(), cancellationToken);
        return Ok(response);
    }

    [HttpGet("wallets/me/transactions")]
    [Authorize(Roles = nameof(UserRole.STUDENT))]
    public async Task<ActionResult<IReadOnlyList<WalletTransactionResponse>>> ListMyTransactions(
        CancellationToken cancellationToken)
    {
        var response = await moneyMovementService.ListMyTransactionsAsync(GetRequiredUserId(), cancellationToken);
        return Ok(response);
    }

    [HttpPost("payment-methods")]
    [Authorize(Roles = nameof(UserRole.STUDENT))]
    public async Task<ActionResult<PaymentMethodResponse>> CreatePaymentMethod(
        CreatePaymentMethodRequest request,
        CancellationToken cancellationToken)
    {
        var response = await moneyMovementService.CreatePaymentMethodAsync(
            GetRequiredUserId(),
            request,
            cancellationToken);

        return Created(string.Empty, response);
    }

    [HttpGet("payment-methods/me")]
    [Authorize(Roles = nameof(UserRole.STUDENT))]
    public async Task<ActionResult<IReadOnlyList<PaymentMethodResponse>>> ListMyPaymentMethods(
        CancellationToken cancellationToken)
    {
        var response = await moneyMovementService.ListMyPaymentMethodsAsync(GetRequiredUserId(), cancellationToken);
        return Ok(response);
    }

    [HttpPost("withdrawal-requests")]
    [Authorize(Roles = nameof(UserRole.STUDENT))]
    public async Task<ActionResult<WithdrawalRequestResponse>> CreateWithdrawalRequest(
        CreateWithdrawalRequest request,
        CancellationToken cancellationToken)
    {
        var response = await moneyMovementService.CreateWithdrawalRequestAsync(
            GetRequiredUserId(),
            request,
            cancellationToken);

        return Created(string.Empty, response);
    }

    [HttpGet("withdrawal-requests/me")]
    [Authorize(Roles = nameof(UserRole.STUDENT))]
    public async Task<ActionResult<IReadOnlyList<WithdrawalRequestResponse>>> ListMyWithdrawalRequests(
        CancellationToken cancellationToken)
    {
        var response = await moneyMovementService.ListMyWithdrawalRequestsAsync(GetRequiredUserId(), cancellationToken);
        return Ok(response);
    }

    [HttpGet("admin/withdrawal-requests")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<IReadOnlyList<WithdrawalRequestResponse>>> ListAdminWithdrawalRequests(
        CancellationToken cancellationToken)
    {
        var response = await moneyMovementService.ListAdminWithdrawalRequestsAsync(
            GetRequiredUserId(),
            cancellationToken);

        return Ok(response);
    }

    [HttpPost("admin/withdrawal-requests/{withdrawalRequestId:guid}/process")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<WithdrawalRequestResponse>> ProcessWithdrawal(
        Guid withdrawalRequestId,
        ProcessWithdrawalRequest request,
        CancellationToken cancellationToken)
    {
        var response = await moneyMovementService.ProcessWithdrawalRequestAsync(
            GetRequiredUserId(),
            withdrawalRequestId,
            request,
            cancellationToken);

        return Ok(response);
    }

    [HttpGet("admin/refunds")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<IReadOnlyList<RefundResponse>>> ListRefunds(
        CancellationToken cancellationToken)
    {
        var response = await moneyMovementService.ListAdminRefundsAsync(
            GetRequiredUserId(),
            cancellationToken);

        return Ok(response);
    }

    [HttpPost("admin/refunds/{refundId:guid}/mark-completed")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<RefundResponse>> MarkRefundCompleted(
        Guid refundId,
        ProcessRefundRequest request,
        CancellationToken cancellationToken)
    {
        var response = await moneyMovementService.MarkRefundCompletedAsync(
            GetRequiredUserId(),
            refundId,
            request,
            cancellationToken);

        return Ok(response);
    }

    [HttpPost("projects/{projectId:guid}/escrow/release")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public async Task<ActionResult<DisbursementResponse?>> ReleaseProjectEscrow(
        Guid projectId,
        CancellationToken cancellationToken)
    {
        var response = await moneyMovementService.ReleaseProjectEscrowAsync(
            projectId,
            GetRequiredUserId(),
            cancellationToken);

        return Ok(response);
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
