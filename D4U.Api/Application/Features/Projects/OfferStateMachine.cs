namespace D4U.Api.Application.Features.Projects;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;

public static class OfferStateMachine
{
    public static bool CanTransition(OfferStatus from, OfferStatus to)
    {
        return (from, to) switch
        {
            (OfferStatus.WAITING_ACCEPTANCE, OfferStatus.ACCEPTED) => true,
            (OfferStatus.WAITING_ACCEPTANCE, OfferStatus.REJECTED) => true,
            (OfferStatus.WAITING_ACCEPTANCE, OfferStatus.EXPIRED) => true,
            (OfferStatus.ACCEPTED, OfferStatus.PENDING_PAYMENT) => true,
            (OfferStatus.ACCEPTED, OfferStatus.EXPIRED) => true,
            (OfferStatus.PENDING_PAYMENT, OfferStatus.ACTIVE) => true,
            (OfferStatus.PENDING_PAYMENT, OfferStatus.PAYMENT_FAILED) => true,
            (OfferStatus.PENDING_PAYMENT, OfferStatus.EXPIRED) => true,
            (OfferStatus.PAYMENT_FAILED, OfferStatus.PENDING_PAYMENT) => true,
            (OfferStatus.PAYMENT_FAILED, OfferStatus.EXPIRED) => true,
            _ => false
        };
    }

    public static void TransitionTo(
        ProjectOffer offer,
        OfferStatus status,
        DateTimeOffset now)
    {
        if (offer.Status == status)
        {
            return;
        }

        if (!CanTransition(offer.Status, status))
        {
            throw new InvalidOperationException($"Offer cannot transition from {offer.Status} to {status}.");
        }

        offer.Status = status;

        if (status == OfferStatus.ACCEPTED)
        {
            offer.AcceptedAt ??= now;
            offer.PaymentDueAt ??= now.Add(OfferTimingPolicy.SmePaymentWindow);
        }
        else if (status == OfferStatus.REJECTED)
        {
            offer.RejectedAt ??= now;
        }
        else if (status == OfferStatus.EXPIRED)
        {
            offer.ExpiredAt ??= now;
        }
    }

    public static bool BlocksProjectRelease(OfferStatus status)
    {
        return status is OfferStatus.WAITING_ACCEPTANCE or
            OfferStatus.ACCEPTED or
            OfferStatus.PENDING_PAYMENT or
            OfferStatus.PAYMENT_FAILED or
            OfferStatus.ACTIVE;
    }
}
