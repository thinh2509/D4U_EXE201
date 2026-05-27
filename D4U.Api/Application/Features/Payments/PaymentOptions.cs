namespace D4U.Api.Application.Features.Payments;

public sealed class PaymentOptions
{
    public const string SectionName = "Payment";

    public string Provider { get; init; } = "Mock";
    public string ReturnUrl { get; init; } = "http://localhost:3000/payment/success";
    public string CancelUrl { get; init; } = "http://localhost:3000/payment/cancel";
    public PayOsOptions PayOS { get; init; } = new();
}

public sealed class PayOsOptions
{
    public string ClientId { get; init; } = string.Empty;
    public string ApiKey { get; init; } = string.Empty;
    public string ChecksumKey { get; init; } = string.Empty;
    public string BaseUrl { get; init; } = "https://api-merchant.payos.vn";
}
