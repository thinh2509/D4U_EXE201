namespace D4U.Api.Infrastructure.Payments;

using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using D4U.Api.Application.Features.Payments;
using Microsoft.Extensions.Options;

public sealed class PayOsPaymentProvider(
    HttpClient httpClient,
    IOptions<PaymentOptions> paymentOptions) : IPaymentProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public string Name => "PayOS";

    public async Task<PaymentProviderCreateResponse> CreatePaymentAsync(
        PaymentProviderCreateRequest request,
        CancellationToken cancellationToken = default)
    {
        var options = paymentOptions.Value.PayOS;

        EnsureConfigured(options);

        var amount = decimal.ToInt64(decimal.Truncate(request.Amount));
        var signature = PayOsSignature.CreatePaymentRequestSignature(
            amount,
            request.CancelUrl,
            request.Description,
            request.OrderCode,
            request.ReturnUrl,
            options.ChecksumKey);

        var payload = new PayOsCreatePaymentRequest(
            request.OrderCode,
            amount,
            request.Description,
            request.CancelUrl,
            request.ReturnUrl,
            signature,
            request.ExpiresAt.ToUnixTimeSeconds(),
            [
                new PayOsPaymentItem(
                    request.Description,
                    1,
                    amount)
            ]);

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "/v2/payment-requests")
        {
            Content = JsonContent.Create(payload, options: JsonOptions)
        };
        httpRequest.Headers.Add("x-client-id", options.ClientId);
        httpRequest.Headers.Add("x-api-key", options.ApiKey);

        using var response = await httpClient.SendAsync(httpRequest, cancellationToken);
        var raw = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"PayOS payment creation failed: {raw}");
        }

        var parsed = JsonSerializer.Deserialize<PayOsCreatePaymentResponse>(raw, JsonOptions)
            ?? throw new InvalidOperationException("PayOS payment creation returned an invalid response.");

        if (!string.Equals(parsed.Code, "00", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"PayOS payment creation failed: {parsed.Desc}");
        }

        return new PaymentProviderCreateResponse(
            Name,
            parsed.Data?.PaymentLinkId ?? parsed.Data?.Id,
            parsed.Data?.CheckoutUrl,
            parsed.Data?.QrCode,
            raw);
    }

    public bool IsValidWebhook(PayOsWebhookRequest request)
    {
        var options = paymentOptions.Value.PayOS;
        EnsureConfigured(options);
        return PayOsSignature.IsValidWebhook(request, options.ChecksumKey);
    }

    public async Task<PaymentProviderStatusResponse?> GetPaymentStatusAsync(
        long orderCode,
        CancellationToken cancellationToken = default)
    {
        var options = paymentOptions.Value.PayOS;
        EnsureConfigured(options);

        using var httpRequest = new HttpRequestMessage(HttpMethod.Get, $"/v2/payment-requests/{orderCode}");
        httpRequest.Headers.Add("x-client-id", options.ClientId);
        httpRequest.Headers.Add("x-api-key", options.ApiKey);

        using var response = await httpClient.SendAsync(httpRequest, cancellationToken);
        var raw = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"PayOS status lookup failed: {raw}");
        }

        var parsed = JsonSerializer.Deserialize<PayOsGetPaymentResponse>(raw, JsonOptions)
            ?? throw new InvalidOperationException("PayOS status lookup returned an invalid response.");

        if (!string.Equals(parsed.Code, "00", StringComparison.OrdinalIgnoreCase) || parsed.Data is null)
        {
            throw new InvalidOperationException($"PayOS status lookup failed: {parsed.Desc}");
        }

        return new PaymentProviderStatusResponse(
            parsed.Data.Status,
            parsed.Data.Amount,
            parsed.Data.Id,
            raw);
    }

    private static void EnsureConfigured(PayOsOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.ClientId) ||
            string.IsNullOrWhiteSpace(options.ApiKey) ||
            string.IsNullOrWhiteSpace(options.ChecksumKey))
        {
            throw new InvalidOperationException("PayOS payment settings are not configured.");
        }
    }
}

public sealed record PayOsCreatePaymentRequest(
    long OrderCode,
    long Amount,
    string Description,
    string CancelUrl,
    string ReturnUrl,
    string Signature,
    long ExpiredAt,
    IReadOnlyList<PayOsPaymentItem> Items);

public sealed record PayOsPaymentItem(
    string Name,
    int Quantity,
    long Price);

public sealed class PayOsCreatePaymentResponse
{
    public string Code { get; set; } = string.Empty;
    public string Desc { get; set; } = string.Empty;
    public PayOsCreatePaymentData? Data { get; set; }
    public string? Signature { get; set; }
}

public sealed class PayOsCreatePaymentData
{
    public string? Id { get; set; }
    public long OrderCode { get; set; }
    public long Amount { get; set; }
    public string? CheckoutUrl { get; set; }
    public string? QrCode { get; set; }
    public string? PaymentLinkId { get; set; }
    public string? Status { get; set; }
}

public sealed class PayOsGetPaymentResponse
{
    public string Code { get; set; } = string.Empty;
    public string Desc { get; set; } = string.Empty;
    public PayOsGetPaymentData? Data { get; set; }
}

public sealed class PayOsGetPaymentData
{
    public string? Id { get; set; }
    public long OrderCode { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
}

