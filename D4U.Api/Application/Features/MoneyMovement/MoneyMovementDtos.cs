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
    DateTimeOffset CreatedAt);

public sealed record PaymentMethodResponse(
    Guid Id,
    string MethodType,
    string? AccountHolderName,
    string? MaskedAccountNumber,
    bool IsDefault,
    string Status,
    DateTimeOffset CreatedAt);

public sealed record CreatePaymentMethodRequest(
    string AccountHolderName,
    string AccountNumber,
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
    string? MaskedAccountNumber,
    string? AccountHolderName);

public sealed record CreateWithdrawalRequest(
    Guid PaymentMethodId,
    decimal Amount);

public sealed record ProcessWithdrawalRequest(
    string Decision,
    string? FailureReason);

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
