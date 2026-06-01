namespace D4U.Api.Application.Features.Payments;

public interface IPaymentProvider
{
    string Name { get; }

    Task<PaymentProviderCreateResponse> CreatePaymentAsync(
        PaymentProviderCreateRequest request,
        CancellationToken cancellationToken = default);

    Task<PaymentProviderStatusResponse?> GetPaymentStatusAsync(
        long orderCode,
        CancellationToken cancellationToken = default);

    bool IsValidWebhook(PayOsWebhookRequest request);
}

