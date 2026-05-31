namespace D4U.Api.Application.Features.Payments;

public interface IPaymentService
{
    Task<PaymentResponse> CreateOfferPaymentAsync(
        Guid userId,
        Guid offerId,
        CancellationToken cancellationToken = default);

    Task<PaymentResponse> GetPaymentAsync(
        Guid userId,
        Guid paymentId,
        CancellationToken cancellationToken = default);

    Task<PaymentReturnStatusResponse> GetReturnStatusAsync(
        Guid paymentId,
        CancellationToken cancellationToken = default);

    Task<EscrowResponse> GetProjectEscrowAsync(
        Guid userId,
        Guid projectId,
        CancellationToken cancellationToken = default);

    Task ProcessPayOsWebhookAsync(
        PayOsWebhookRequest request,
        CancellationToken cancellationToken = default);
}

