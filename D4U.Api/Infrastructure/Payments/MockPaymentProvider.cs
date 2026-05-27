namespace D4U.Api.Infrastructure.Payments;

using System.Text.Json;
using D4U.Api.Application.Features.Payments;

public sealed class MockPaymentProvider : IPaymentProvider
{
    public string Name => "Mock";

    public Task<PaymentProviderCreateResponse> CreatePaymentAsync(
        PaymentProviderCreateRequest request,
        CancellationToken cancellationToken = default)
    {
        var separator = request.ReturnUrl.Contains('?', StringComparison.Ordinal) ? "&" : "?";
        var checkoutUrl = $"{request.ReturnUrl}{separator}mockOrderCode={request.OrderCode}";
        var rawResponse = JsonSerializer.Serialize(new
        {
            provider = Name,
            request.PaymentId,
            request.OrderCode,
            request.Amount,
            request.Currency,
            request.ExpiresAt
        });

        return Task.FromResult(
            new PaymentProviderCreateResponse(
                Name,
                $"mock-{request.OrderCode}",
                checkoutUrl,
                $"MOCK-QR-{request.OrderCode}",
                rawResponse));
    }

    public bool IsValidWebhook(PayOsWebhookRequest request)
    {
        return request.Signature is "" or "mock";
    }
}
