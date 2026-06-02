namespace D4U.Api.Application.Features.Payments;

using System.Security.Cryptography;
using D4U.Api.Application.Common.Data;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using D4U.Api.Application.Features.Projects;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

public sealed class PaymentService(
    IUnitOfWork unitOfWork,
    IPaymentProvider paymentProvider,
    IOptions<PaymentOptions> paymentOptions,
    ILogger<PaymentService> logger) : IPaymentService
{
    private const string BasicPlanCode = "BASIC";
    private const string ActiveSubscriptionStatus = "ACTIVE";
    private static readonly TimeSpan PaymentLifetime = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan ProviderReconciliationInterval = TimeSpan.FromSeconds(5);

    public async Task<PaymentResponse> CreateOfferPaymentAsync(
        Guid userId,
        Guid offerId,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);

        if (user.Role != UserRole.SME)
        {
            throw new InvalidOperationException("Only SME users can create escrow payments.");
        }

        EnsureConfiguredProviderSelected();

        var smeProfile = await RequireSmeProfileAsync(userId, cancellationToken);
        var offer = await RequireOfferAsync(offerId, cancellationToken);
        var project = await RequireProjectAsync(offer.ProjectId, cancellationToken);

        if (project.SmeProfileId != smeProfile.Id)
        {
            throw new UnauthorizedAccessException("Only the owner SME can create payment for this offer.");
        }

        if (offer.Status is not OfferStatus.ACCEPTED and not OfferStatus.PAYMENT_FAILED)
        {
            throw new InvalidOperationException("Only accepted offers within the payment window can be paid.");
        }

        var now = DateTimeOffset.UtcNow;
        if (offer.PaymentDueAt.HasValue && offer.PaymentDueAt.Value <= now)
        {
            OfferStateMachine.TransitionTo(offer, OfferStatus.EXPIRED, now);
            await ReleaseApplicationIfSelectedAsync(offer, now, cancellationToken);
            await ReleaseProjectIfNoActiveOfferAsync(project, offer.Id, "Offer payment window expired.", now, cancellationToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Offer payment window has expired.");
        }

        var escrow = await GetOrCreateEscrowAsync(project, offer, smeProfile.Id, now, cancellationToken);
        var reusablePayment = await unitOfWork.Repository<Payment>().Query()
            .Where(payment => payment.EscrowId == escrow.Id &&
                payment.Status == PaymentStatus.PENDING &&
                payment.ExpiresAt > now &&
                payment.CheckoutUrl != null)
            .OrderByDescending(payment => payment.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        OfferStateMachine.TransitionTo(offer, OfferStatus.PENDING_PAYMENT, now);

        if (reusablePayment is not null)
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return ToPaymentResponse(reusablePayment, escrow, offer.Id);
        }

        var expiresAt = now.Add(PaymentLifetime);
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            PayerUserId = userId,
            EscrowId = escrow.Id,
            Amount = escrow.Amount,
            Currency = escrow.Currency,
            Provider = paymentProvider.Name,
            ProviderOrderCode = await GenerateProviderOrderCodeAsync(cancellationToken),
            Status = PaymentStatus.PENDING,
            ExpiresAt = expiresAt,
            CreatedAt = now,
            UpdatedAt = now
        };

        var returnUrl = AppendPaymentQuery(paymentOptions.Value.ReturnUrl, payment.Id, offer.Id, project.Id);
        var cancelUrl = AppendPaymentQuery(paymentOptions.Value.CancelUrl, payment.Id, offer.Id, project.Id);
        var providerResponse = await paymentProvider.CreatePaymentAsync(
            new PaymentProviderCreateRequest(
                payment.Id,
                payment.ProviderOrderCode.Value,
                payment.Amount,
                payment.Currency,
                "D4U escrow",
                returnUrl,
                cancelUrl,
                expiresAt),
            cancellationToken);

        payment.ProviderTransactionId = providerResponse.ProviderTransactionId;
        payment.CheckoutUrl = providerResponse.CheckoutUrl;
        payment.QrCode = providerResponse.QrCode;
        payment.RawProviderResponseJson = providerResponse.RawResponseJson;
        payment.UpdatedAt = DateTimeOffset.UtcNow;

        await unitOfWork.Repository<Payment>().AddAsync(payment, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToPaymentResponse(payment, escrow, offer.Id);
    }

    public async Task<PaymentResponse> GetPaymentAsync(
        Guid userId,
        Guid paymentId,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var payment = await unitOfWork.Repository<Payment>().GetByIdAsync(paymentId, cancellationToken)
            ?? throw new InvalidOperationException("Payment was not found.");

        if (payment.EscrowId is null)
        {
            throw new InvalidOperationException("Payment is not linked to escrow.");
        }

        var escrow = await unitOfWork.Repository<Escrow>().GetByIdAsync(payment.EscrowId.Value, cancellationToken)
            ?? throw new InvalidOperationException("Escrow was not found.");

        await EnsureCanViewEscrowAsync(user, escrow, cancellationToken);
        var offerId = await FindOfferIdAsync(escrow.ProjectId, escrow.StudentProfileId, cancellationToken);
        return ToPaymentResponse(payment, escrow, offerId);
    }

    public async Task<EscrowResponse> GetProjectEscrowAsync(
        Guid userId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        var user = await RequireUserAsync(userId, cancellationToken);
        var escrow = await unitOfWork.Repository<Escrow>().FirstOrDefaultAsync(
            value => value.ProjectId == projectId,
            cancellationToken) ?? throw new InvalidOperationException("Escrow was not found for this project.");

        await EnsureCanViewEscrowAsync(user, escrow, cancellationToken);
        return ToEscrowResponse(escrow);
    }

    public async Task<PaymentReturnStatusResponse> GetReturnStatusAsync(
        Guid paymentId,
        CancellationToken cancellationToken = default)
    {
        var payment = await unitOfWork.Repository<Payment>().GetByIdAsync(paymentId, cancellationToken)
            ?? throw new InvalidOperationException("Payment was not found.");

        if (!payment.EscrowId.HasValue)
        {
            throw new InvalidOperationException("Payment is not linked to escrow.");
        }

        var escrow = await unitOfWork.Repository<Escrow>().GetByIdAsync(payment.EscrowId.Value, cancellationToken)
            ?? throw new InvalidOperationException("Escrow was not found.");

        await ReconcilePendingPaymentAsync(payment, cancellationToken);

        return new PaymentReturnStatusResponse(
            payment.Id,
            escrow.ProjectId,
            payment.Status,
            payment.ExpiresAt,
            DateTimeOffset.UtcNow);
    }

    public async Task ProcessPayOsWebhookAsync(
        PayOsWebhookRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!paymentProvider.IsValidWebhook(request))
        {
            throw new UnauthorizedAccessException("PayOS webhook signature is invalid.");
        }

        if (request.Data is null)
        {
            throw new InvalidOperationException("PayOS webhook data is missing.");
        }

        var payment = await unitOfWork.Repository<Payment>().FirstOrDefaultAsync(
            value => value.Provider == paymentProvider.Name && value.ProviderOrderCode == request.Data.OrderCode,
            cancellationToken);

        if (payment is null)
        {
            return;
        }

        if (payment.Status == PaymentStatus.SUCCESS)
        {
            return;
        }

        if (payment.Status is PaymentStatus.FAILED or PaymentStatus.CANCELLED or PaymentStatus.EXPIRED)
        {
            return;
        }

        if (!request.Success ||
            !string.Equals(request.Code, "00", StringComparison.OrdinalIgnoreCase) ||
            !string.Equals(request.Data.Code, "00", StringComparison.OrdinalIgnoreCase))
        {
            var failedAt = DateTimeOffset.UtcNow;
            payment.Status = PaymentStatus.FAILED;
            payment.UpdatedAt = failedAt;

            if (payment.EscrowId.HasValue)
            {
                var failedEscrow = await unitOfWork.Repository<Escrow>().GetByIdAsync(payment.EscrowId.Value, cancellationToken);

                if (failedEscrow is not null)
                {
                    var failedOffer = await unitOfWork.Repository<ProjectOffer>().FirstOrDefaultAsync(
                        value => value.ProjectId == failedEscrow.ProjectId &&
                            value.StudentProfileId == failedEscrow.StudentProfileId &&
                            value.Status == OfferStatus.PENDING_PAYMENT,
                        cancellationToken);

                    if (failedOffer is not null)
                    {
                        OfferStateMachine.TransitionTo(failedOffer, OfferStatus.PAYMENT_FAILED, failedAt);
                    }
                }
            }

            await unitOfWork.SaveChangesAsync(cancellationToken);
            return;
        }

        var providerTransactionId = string.IsNullOrWhiteSpace(request.Data.PaymentLinkId)
            ? request.Data.Reference
            : request.Data.PaymentLinkId;
        await MarkPaymentSucceededAsync(payment, request.Data.Amount, providerTransactionId, cancellationToken);
    }

    private async Task ReconcilePendingPaymentAsync(
        Payment payment,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        if (payment.Status != PaymentStatus.PENDING ||
            !payment.ProviderOrderCode.HasValue ||
            payment.UpdatedAt > now.Subtract(ProviderReconciliationInterval))
        {
            return;
        }

        PaymentProviderStatusResponse? providerStatus;
        try
        {
            providerStatus = await paymentProvider.GetPaymentStatusAsync(
                payment.ProviderOrderCode.Value,
                cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogWarning(
                exception,
                "Could not reconcile payment {PaymentId} with provider {Provider}.",
                payment.Id,
                payment.Provider);
            return;
        }

        payment.UpdatedAt = now;

        if (providerStatus is null)
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return;
        }

        if (string.Equals(providerStatus.Status, "PAID", StringComparison.OrdinalIgnoreCase))
        {
            await MarkPaymentSucceededAsync(
                payment,
                providerStatus.Amount,
                providerStatus.ProviderTransactionId,
                cancellationToken);
            return;
        }

        if (string.Equals(providerStatus.Status, "CANCELLED", StringComparison.OrdinalIgnoreCase))
        {
            payment.Status = PaymentStatus.CANCELLED;
            await MarkOfferPaymentFailedAsync(payment, now, cancellationToken);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task MarkOfferPaymentFailedAsync(
        Payment payment,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        if (!payment.EscrowId.HasValue)
        {
            return;
        }

        var escrow = await unitOfWork.Repository<Escrow>().GetByIdAsync(payment.EscrowId.Value, cancellationToken);
        if (escrow is null)
        {
            return;
        }

        var offer = await unitOfWork.Repository<ProjectOffer>().FirstOrDefaultAsync(
            value => value.ProjectId == escrow.ProjectId &&
                value.StudentProfileId == escrow.StudentProfileId &&
                value.Status == OfferStatus.PENDING_PAYMENT,
            cancellationToken);

        if (offer is not null)
        {
            OfferStateMachine.TransitionTo(offer, OfferStatus.PAYMENT_FAILED, now);
        }
    }

    private async Task MarkPaymentSucceededAsync(
        Payment payment,
        decimal paidAmount,
        string? providerTransactionId,
        CancellationToken cancellationToken)
    {
        if (payment.Status == PaymentStatus.SUCCESS)
        {
            return;
        }

        if (payment.Status is PaymentStatus.FAILED or PaymentStatus.CANCELLED or PaymentStatus.EXPIRED)
        {
            throw new InvalidOperationException("Inactive payment cannot start a project.");
        }

        if (!payment.EscrowId.HasValue)
        {
            throw new InvalidOperationException("Payment is not linked to escrow.");
        }

        if (decimal.Truncate(paidAmount) != decimal.Truncate(payment.Amount))
        {
            throw new InvalidOperationException("PayOS payment amount does not match payment amount.");
        }

        var escrow = await unitOfWork.Repository<Escrow>().GetByIdAsync(payment.EscrowId.Value, cancellationToken)
            ?? throw new InvalidOperationException("Escrow was not found.");
        var offer = await unitOfWork.Repository<ProjectOffer>().FirstOrDefaultAsync(
            value => value.ProjectId == escrow.ProjectId &&
                value.StudentProfileId == escrow.StudentProfileId &&
                (value.Status == OfferStatus.PENDING_PAYMENT || value.Status == OfferStatus.ACTIVE),
            cancellationToken) ?? throw new InvalidOperationException("Accepted offer was not found for this payment.");
        var project = await RequireProjectAsync(escrow.ProjectId, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        payment.Status = PaymentStatus.SUCCESS;
        payment.ProviderTransactionId = providerTransactionId;
        payment.PaidAt = now;
        payment.UpdatedAt = now;

        escrow.Status = EscrowStatus.FUNDED;
        escrow.FundedAt ??= now;
        escrow.UpdatedAt = now;

        if (offer.Status == OfferStatus.PENDING_PAYMENT)
        {
            OfferStateMachine.TransitionTo(offer, OfferStatus.ACTIVE, now);
        }

        if (project.Status != ProjectStatus.IN_PROGRESS)
        {
            var previousStatus = project.Status;
            project.Status = ProjectStatus.IN_PROGRESS;
            project.UpdatedAt = now;

            await unitOfWork.Repository<AuditLog>().AddAsync(
                new AuditLog
                {
                    Id = Guid.NewGuid(),
                    Action = "PROJECT_STATUS_CHANGED",
                    EntityType = nameof(Project),
                    EntityId = project.Id,
                    BeforeJson = $$"""{"status":"{{previousStatus}}"}""",
                    AfterJson = $$"""{"status":"{{ProjectStatus.IN_PROGRESS}}","reason":"Escrow payment succeeded and project started."}""",
                    CreatedAt = now
                },
                cancellationToken);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<Escrow> GetOrCreateEscrowAsync(
        Project project,
        ProjectOffer offer,
        Guid smeProfileId,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var existingEscrow = await unitOfWork.Repository<Escrow>().FirstOrDefaultAsync(
            value => value.ProjectId == project.Id && value.Status == EscrowStatus.PENDING_PAYMENT,
            cancellationToken);

        if (existingEscrow is not null)
        {
            if (existingEscrow.StudentProfileId != offer.StudentProfileId)
            {
                throw new InvalidOperationException("Escrow belongs to another selected student.");
            }

            return existingEscrow;
        }

        var plan = await EnsureActiveSubscriptionPlanAsync(smeProfileId, cancellationToken);
        var platformFeeAmount = decimal.Round(offer.OfferedAmount * plan.PlatformFeeRate, 2);
        var escrow = new Escrow
        {
            Id = Guid.NewGuid(),
            ProjectId = project.Id,
            SmeProfileId = smeProfileId,
            StudentProfileId = offer.StudentProfileId,
            Amount = offer.OfferedAmount,
            Currency = project.Currency,
            PlatformFeeRate = plan.PlatformFeeRate,
            PlatformFeeAmount = platformFeeAmount,
            Status = EscrowStatus.PENDING_PAYMENT,
            CreatedAt = now,
            UpdatedAt = now
        };

        await unitOfWork.Repository<Escrow>().AddAsync(escrow, cancellationToken);
        return escrow;
    }

    private async Task EnsureCanViewEscrowAsync(
        User user,
        Escrow escrow,
        CancellationToken cancellationToken)
    {
        if (user.Role == UserRole.ADMIN)
        {
            return;
        }

        if (user.Role == UserRole.SME)
        {
            var smeProfile = await RequireSmeProfileAsync(user.Id, cancellationToken);
            if (smeProfile.Id == escrow.SmeProfileId)
            {
                return;
            }
        }

        if (user.Role == UserRole.STUDENT)
        {
            var studentProfile = await unitOfWork.Repository<StudentProfile>().FirstOrDefaultAsync(
                value => value.UserId == user.Id,
                cancellationToken);

            if (studentProfile?.Id == escrow.StudentProfileId)
            {
                return;
            }
        }

        throw new UnauthorizedAccessException("User cannot view this escrow.");
    }

    private async Task ReleaseProjectIfNoActiveOfferAsync(
        Project project,
        Guid ignoredOfferId,
        string reason,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        if (project.Status != ProjectStatus.OFFER_SELECTED)
        {
            project.UpdatedAt = now;
            return;
        }

        var hasOtherActiveOffer = await unitOfWork.Repository<ProjectOffer>().AnyAsync(
            value => value.ProjectId == project.Id &&
                value.Id != ignoredOfferId &&
                (value.Status == OfferStatus.WAITING_ACCEPTANCE ||
                    value.Status == OfferStatus.ACCEPTED ||
                    value.Status == OfferStatus.PENDING_PAYMENT ||
                    value.Status == OfferStatus.PAYMENT_FAILED ||
                    value.Status == OfferStatus.ACTIVE),
            cancellationToken);

        if (hasOtherActiveOffer)
        {
            project.UpdatedAt = now;
            return;
        }

        var previousStatus = project.Status;
        project.SelectedStudentProfileId = null;
        project.AcceptedAt = null;
        project.Status = project.ProjectType == ProjectType.OPEN
            ? ProjectStatus.OPEN
            : ProjectStatus.PRIVATE_INVITED;
        project.UpdatedAt = now;

        await unitOfWork.Repository<AuditLog>().AddAsync(
            new AuditLog
            {
                Id = Guid.NewGuid(),
                Action = "PROJECT_STATUS_CHANGED",
                EntityType = nameof(Project),
                EntityId = project.Id,
                BeforeJson = $$"""{"status":"{{previousStatus}}"}""",
                AfterJson = $$"""{"status":"{{project.Status}}","reason":"{{reason}}"}""",
                CreatedAt = now
            },
            cancellationToken);
    }

    private async Task ReleaseApplicationIfSelectedAsync(
        ProjectOffer offer,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        if (!offer.ApplicationId.HasValue)
        {
            return;
        }

        var application = await unitOfWork.Repository<ProjectApplication>().GetByIdAsync(
            offer.ApplicationId.Value,
            cancellationToken);

        if (application is not null && application.Status == "SELECTED")
        {
            application.Status = "SUBMITTED";
            application.UpdatedAt = now;
        }
    }

    private async Task<SubscriptionPlan> EnsureActiveSubscriptionPlanAsync(
        Guid smeProfileId,
        CancellationToken cancellationToken)
    {
        var smeProfile = await unitOfWork.Repository<SmeProfile>().GetByIdAsync(smeProfileId, cancellationToken)
            ?? throw new InvalidOperationException("SME profile was not found.");

        if (smeProfile.SubscriptionPlanId != Guid.Empty)
        {
            var existingPlan = await unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(
                smeProfile.SubscriptionPlanId,
                cancellationToken);

            if (existingPlan is not null && existingPlan.IsActive)
            {
                return existingPlan;
            }
        }

        var basicPlan = await unitOfWork.Repository<SubscriptionPlan>().FirstOrDefaultAsync(
            value => value.Code == BasicPlanCode && value.IsActive,
            cancellationToken) ?? throw new InvalidOperationException("Basic subscription plan was not found.");

        var now = DateTimeOffset.UtcNow;
        smeProfile.SubscriptionPlanId = basicPlan.Id;
        smeProfile.SubscriptionStartedAt = smeProfile.SubscriptionStartedAt == default ? now : smeProfile.SubscriptionStartedAt;
        smeProfile.UpdatedAt = now;

        return basicPlan;
    }

    private async Task<long> GenerateProviderOrderCodeAsync(CancellationToken cancellationToken)
    {
        while (true)
        {
            var orderCode = RandomNumberGenerator.GetInt32(100_000_000, 999_999_999);
            var exists = await unitOfWork.Repository<Payment>().AnyAsync(
                value => value.Provider == paymentProvider.Name && value.ProviderOrderCode == orderCode,
                cancellationToken);

            if (!exists)
            {
                return orderCode;
            }
        }
    }

    private async Task<Guid?> FindOfferIdAsync(
        Guid projectId,
        Guid studentProfileId,
        CancellationToken cancellationToken)
    {
        var offer = await unitOfWork.Repository<ProjectOffer>().Query()
            .Where(value => value.ProjectId == projectId && value.StudentProfileId == studentProfileId)
            .OrderByDescending(value => value.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        return offer?.Id;
    }

    private void EnsureConfiguredProviderSelected()
    {
        if (!string.Equals(paymentOptions.Value.Provider, paymentProvider.Name, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Payment provider is not configured as the active provider.");
        }
    }

    private async Task<User> RequireUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await unitOfWork.Repository<User>().GetByIdAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("User not found.");
    }

    private async Task<SmeProfile> RequireSmeProfileAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await unitOfWork.Repository<SmeProfile>().FirstOrDefaultAsync(
            value => value.UserId == userId,
            cancellationToken) ?? throw new InvalidOperationException("SME profile must be created before using payments.");
    }

    private async Task<ProjectOffer> RequireOfferAsync(Guid offerId, CancellationToken cancellationToken)
    {
        return await unitOfWork.Repository<ProjectOffer>().GetByIdAsync(offerId, cancellationToken)
            ?? throw new InvalidOperationException("Project offer was not found.");
    }

    private async Task<Project> RequireProjectAsync(Guid projectId, CancellationToken cancellationToken)
    {
        return await unitOfWork.Repository<Project>().GetByIdAsync(projectId, cancellationToken)
            ?? throw new InvalidOperationException("Project was not found.");
    }

    private static string AppendPaymentQuery(
        string url,
        Guid paymentId,
        Guid offerId,
        Guid projectId)
    {
        var separator = url.Contains('?', StringComparison.Ordinal) ? '&' : '?';
        return $"{url}{separator}paymentId={paymentId}&offerId={offerId}&projectId={projectId}";
    }

    private static PaymentResponse ToPaymentResponse(
        Payment payment,
        Escrow escrow,
        Guid? offerId)
    {
        return new PaymentResponse(
            payment.Id,
            escrow.Id,
            offerId,
            escrow.ProjectId,
            payment.Amount,
            payment.Currency,
            payment.Provider,
            payment.Status,
            payment.CheckoutUrl,
            payment.QrCode,
            payment.ExpiresAt);
    }

    private static EscrowResponse ToEscrowResponse(Escrow escrow)
    {
        return new EscrowResponse(
            escrow.Id,
            escrow.ProjectId,
            escrow.SmeProfileId,
            escrow.StudentProfileId,
            escrow.Amount,
            escrow.Currency,
            escrow.PlatformFeeRate,
            escrow.PlatformFeeAmount,
            escrow.Status,
            escrow.FundedAt,
            escrow.ReleasedAt,
            escrow.RefundedAt,
            escrow.CreatedAt,
            escrow.UpdatedAt);
    }
}
