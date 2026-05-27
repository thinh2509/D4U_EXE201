namespace D4U.Api.Application.Features.Payments;

using D4U.Api.Domain.Enums;

public sealed record PaymentResponse(
    Guid PaymentId,
    Guid EscrowId,
    Guid? OfferId,
    Guid ProjectId,
    decimal Amount,
    string Currency,
    string Provider,
    PaymentStatus Status,
    string? CheckoutUrl,
    string? QrCode,
    DateTimeOffset? ExpiresAt);

public sealed record EscrowResponse(
    Guid Id,
    Guid ProjectId,
    Guid SmeProfileId,
    Guid StudentProfileId,
    decimal Amount,
    string Currency,
    decimal PlatformFeeRate,
    decimal? PlatformFeeAmount,
    EscrowStatus Status,
    DateTimeOffset? FundedAt,
    DateTimeOffset? ReleasedAt,
    DateTimeOffset? RefundedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

