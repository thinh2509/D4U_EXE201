namespace D4U.Api.Application.Features.MoneyMovement;

using D4U.Api.Domain.Enums;

public sealed record WalletResponse(
    Guid Id,
    Guid OwnerUserId,
    Guid? StudentProfileId,
    string Currency,
    decimal AvailableBalance,
    decimal PendingBalance,
    decimal LockedBalance,
    WalletStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record WalletTransactionResponse(
    Guid Id,
    Guid WalletId,
    WalletTransactionType Type,
    decimal Amount,
    decimal BalanceAfter,
    string? ReferenceType,
    Guid? ReferenceId,
    string? Description,
    DateTimeOffset CreatedAt,
    decimal? GrossAmount,
    decimal? FeeAmount,
    decimal? NetAmount);

public sealed record PaymentMethodResponse(
    Guid Id,
    string MethodType,
    string? BankName,
    string? BankCode,
    string? AccountHolderName,
    string? MaskedAccountNumber,
    bool HasFullAccountNumber,
    bool IsDefault,
    string Status,
    bool IsUsableForWithdrawal,
    bool RequiresRecreation,
    string? ValidationIssueCode,
    string? ValidationIssueMessage,
    DateTimeOffset CreatedAt);

public sealed record CreatePaymentMethodRequest(
    string BankName,
    string AccountHolderName,
    string AccountNumber,
    string? BankCode = null,
    bool IsDefault = true);

public sealed record WithdrawalRequestResponse(
    Guid Id,
    Guid WalletId,
    Guid PaymentMethodId,
    decimal Amount,
    decimal FeeAmount,
    decimal NetAmount,
    string Status,
    string? FailureReason,
    DateTimeOffset RequestedAt,
    DateTimeOffset? ProcessedAt,
    string? BankName,
    string? BankCode,
    string? MaskedAccountNumber,
    string? AccountNumber,
    string? AccountHolderName,
    bool HasFullAccountNumber,
    decimal TransferAmount,
    string TransferContent,
    DateTimeOffset? ProcessingStartedAt,
    DateTimeOffset? TransferredAt,
    string? BankTransactionReference,
    Guid? ProcessedByUserId);

public sealed record CreateWithdrawalRequest(
    Guid PaymentMethodId,
    decimal Amount);

public sealed record ProcessWithdrawalRequest(
    string Decision,
    string? FailureReason,
    string? BankTransactionReference,
    DateTimeOffset? TransferredAt);

public sealed record RefundResponse(
    Guid Id,
    Guid EscrowId,
    Guid ProjectId,
    string? ProjectTitle,
    string? SmeFullName,
    string? StudentFullName,
    decimal Amount,
    string Currency,
    string Reason,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? CompletedAt,
    string? ManualRefundReference);

public sealed record ProcessRefundRequest(
    string? ManualRefundReference,
    DateTimeOffset? ProcessedAt);

public sealed record DisbursementResponse(
    Guid Id,
    Guid EscrowId,
    Guid WalletId,
    decimal GrossAmount,
    decimal PlatformFeeAmount,
    decimal NetAmount,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? CompletedAt);
