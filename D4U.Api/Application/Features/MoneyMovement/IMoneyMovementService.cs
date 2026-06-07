namespace D4U.Api.Application.Features.MoneyMovement;

public interface IMoneyMovementService
{
    Task<DisbursementResponse?> ReleaseProjectEscrowAsync(
        Guid projectId,
        Guid? actorUserId,
        CancellationToken cancellationToken = default);

    Task<RefundResponse> CreateStudentAbandonRefundAsync(
        Guid projectId,
        Guid studentUserId,
        string reason,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RefundResponse>> ListAdminRefundsAsync(
        Guid adminUserId,
        CancellationToken cancellationToken = default);

    Task<RefundResponse> MarkRefundCompletedAsync(
        Guid adminUserId,
        Guid refundId,
        ProcessRefundRequest request,
        CancellationToken cancellationToken = default);

    Task<WalletResponse> GetMyWalletAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<WalletTransactionResponse>> ListMyTransactionsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<PaymentMethodResponse> CreatePaymentMethodAsync(
        Guid userId,
        CreatePaymentMethodRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PaymentMethodResponse>> ListMyPaymentMethodsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<WithdrawalRequestResponse> CreateWithdrawalRequestAsync(
        Guid userId,
        CreateWithdrawalRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<WithdrawalRequestResponse>> ListMyWithdrawalRequestsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<WithdrawalRequestResponse>> ListAdminWithdrawalRequestsAsync(
        Guid adminUserId,
        CancellationToken cancellationToken = default);

    Task<WithdrawalRequestResponse> ProcessWithdrawalRequestAsync(
        Guid adminUserId,
        Guid withdrawalRequestId,
        ProcessWithdrawalRequest request,
        CancellationToken cancellationToken = default);
}
