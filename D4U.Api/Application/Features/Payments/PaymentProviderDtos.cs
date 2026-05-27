namespace D4U.Api.Application.Features.Payments;

public sealed record PaymentProviderCreateRequest(
    Guid PaymentId,
    long OrderCode,
    decimal Amount,
    string Currency,
    string Description,
    string ReturnUrl,
    string CancelUrl,
    DateTimeOffset ExpiresAt);

public sealed record PaymentProviderCreateResponse(
    string Provider,
    string? ProviderTransactionId,
    string? CheckoutUrl,
    string? QrCode,
    string RawResponseJson);

public sealed class PayOsWebhookRequest
{
    public string Code { get; set; } = string.Empty;
    public string Desc { get; set; } = string.Empty;
    public bool Success { get; set; }
    public PayOsWebhookData? Data { get; set; }
    public string Signature { get; set; } = string.Empty;
}

public sealed class PayOsWebhookData
{
    public long OrderCode { get; set; }
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? AccountNumber { get; set; }
    public string? Reference { get; set; }
    public string? TransactionDateTime { get; set; }
    public string? Currency { get; set; }
    public string? PaymentLinkId { get; set; }
    public string? Code { get; set; }
    public string? Desc { get; set; }
    public string? CounterAccountBankId { get; set; }
    public string? CounterAccountBankName { get; set; }
    public string? CounterAccountName { get; set; }
    public string? CounterAccountNumber { get; set; }
    public string? VirtualAccountName { get; set; }
    public string? VirtualAccountNumber { get; set; }
}

