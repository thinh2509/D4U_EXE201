namespace D4U.Api.Application.Features.MoneyMovement;

using D4U.Api.Application.Common.Data;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

public sealed class MoneyMovementService(IUnitOfWork unitOfWork) : IMoneyMovementService
{
    private const decimal MinimumWithdrawalAmount = 50000m;
    private const decimal WithdrawalFeeAmount = 5000m;
    private const string WithdrawalPending = "PENDING";
    private const string WithdrawalCompleted = "COMPLETED";
    private const string WithdrawalFailed = "FAILED";

    public async Task<DisbursementResponse?> ReleaseProjectEscrowAsync(
        Guid projectId,
        Guid? actorUserId,
        CancellationToken cancellationToken = default)
    {
        var project = await unitOfWork.Repository<Project>().GetByIdAsync(projectId, cancellationToken)
            ?? throw new InvalidOperationException("Project was not found.");

        if (project.Status != ProjectStatus.COMPLETED)
        {
            throw new InvalidOperationException("Project must be completed before escrow can be released.");
        }

        var escrow = await unitOfWork.Repository<Escrow>().FirstOrDefaultAsync(
            value => value.ProjectId == projectId &&
                (value.Status == EscrowStatus.RELEASE_PENDING || value.Status == EscrowStatus.RELEASED),
            cancellationToken);

        if (escrow is null)
        {
            return null;
        }

        var existingDisbursement = await unitOfWork.Repository<Disbursement>().FirstOrDefaultAsync(
            value => value.EscrowId == escrow.Id,
            cancellationToken);

        if (existingDisbursement is not null)
        {
            if (escrow.Status != EscrowStatus.RELEASED)
            {
                escrow.Status = EscrowStatus.RELEASED;
                escrow.ReleasedAt ??= DateTimeOffset.UtcNow;
                escrow.UpdatedAt = escrow.ReleasedAt.Value;
                await unitOfWork.SaveChangesAsync(cancellationToken);
            }

            return ToDisbursementResponse(existingDisbursement);
        }

        if (escrow.Status == EscrowStatus.RELEASED)
        {
            return null;
        }

        var studentProfile = await unitOfWork.Repository<StudentProfile>().GetByIdAsync(
            escrow.StudentProfileId,
            cancellationToken) ?? throw new InvalidOperationException("Student profile was not found.");

        var now = DateTimeOffset.UtcNow;
        var wallet = await EnsureWalletAsync(studentProfile, escrow.Currency, now, cancellationToken);
        var previousAvailableBalance = wallet.AvailableBalance;
        var platformFeeAmount = escrow.PlatformFeeAmount ?? decimal.Round(escrow.Amount * escrow.PlatformFeeRate, 2);
        var netAmount = escrow.Amount - platformFeeAmount;

        if (netAmount < 0)
        {
            throw new InvalidOperationException("Escrow fee cannot exceed escrow amount.");
        }

        var disbursement = new Disbursement
        {
            Id = Guid.NewGuid(),
            EscrowId = escrow.Id,
            WalletId = wallet.Id,
            GrossAmount = escrow.Amount,
            PlatformFeeAmount = platformFeeAmount,
            NetAmount = netAmount,
            Status = "COMPLETED",
            CreatedAt = now,
            CompletedAt = now
        };

        wallet.AvailableBalance += netAmount;
        wallet.UpdatedAt = now;
        escrow.PlatformFeeAmount = platformFeeAmount;
        escrow.Status = EscrowStatus.RELEASED;
        escrow.ReleasedAt = now;
        escrow.UpdatedAt = now;

        await unitOfWork.Repository<Disbursement>().AddAsync(disbursement, cancellationToken);
        await unitOfWork.Repository<WalletTransaction>().AddAsync(
            new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = wallet.Id,
                Type = WalletTransactionType.DISBURSEMENT_CREDIT,
                Amount = netAmount,
                BalanceAfter = wallet.AvailableBalance,
                ReferenceType = nameof(Disbursement),
                ReferenceId = disbursement.Id,
                Description = $"Escrow released for project {project.Title}.",
                CreatedAt = now
            },
            cancellationToken);

        await AddAuditLogAsync(
            actorUserId,
            "ESCROW_RELEASED",
            nameof(Escrow),
            escrow.Id,
            $$"""{"status":"{{EscrowStatus.RELEASE_PENDING}}"}""",
            $$"""{"status":"{{EscrowStatus.RELEASED}}","grossAmount":{{escrow.Amount}},"platformFeeAmount":{{platformFeeAmount}},"netAmount":{{netAmount}}}""",
            now,
            cancellationToken);

        await AddAuditLogAsync(
            actorUserId,
            "WALLET_BALANCE_CHANGED",
            nameof(Wallet),
            wallet.Id,
            $$"""{"availableBalance":{{previousAvailableBalance}}}""",
            $$"""{"availableBalance":{{wallet.AvailableBalance}},"reason":"DISBURSEMENT_CREDIT"}""",
            now,
            cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return ToDisbursementResponse(disbursement);
    }

    public async Task<WalletResponse> GetMyWalletAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var studentProfile = await RequireStudentProfileAsync(userId, cancellationToken);
        var wallet = await EnsureWalletAsync(studentProfile, "VND", DateTimeOffset.UtcNow, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return ToWalletResponse(wallet);
    }

    public async Task<IReadOnlyList<WalletTransactionResponse>> ListMyTransactionsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var wallet = await RequireWalletForStudentAsync(userId, cancellationToken);
        return await unitOfWork.Repository<WalletTransaction>().Query()
            .Where(transaction => transaction.WalletId == wallet.Id)
            .OrderByDescending(transaction => transaction.CreatedAt)
            .Take(100)
            .Select(transaction => ToWalletTransactionResponse(transaction))
            .ToListAsync(cancellationToken);
    }

    public async Task<PaymentMethodResponse> CreatePaymentMethodAsync(
        Guid userId,
        CreatePaymentMethodRequest request,
        CancellationToken cancellationToken = default)
    {
        await RequireStudentProfileAsync(userId, cancellationToken);

        if (string.IsNullOrWhiteSpace(request.AccountHolderName))
        {
            throw new InvalidOperationException("Account holder name is required.");
        }

        if (string.IsNullOrWhiteSpace(request.AccountNumber) || request.AccountNumber.Trim().Length < 4)
        {
            throw new InvalidOperationException("Account number must have at least 4 digits.");
        }

        var now = DateTimeOffset.UtcNow;
        if (request.IsDefault)
        {
            var existingDefaultMethods = await unitOfWork.Repository<PaymentMethod>().Query()
                .Where(method => method.UserId == userId && method.IsDefault)
                .ToListAsync(cancellationToken);

            foreach (var method in existingDefaultMethods)
            {
                method.IsDefault = false;
            }
        }

        var paymentMethod = new PaymentMethod
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            MethodType = "BANK_ACCOUNT",
            AccountHolderName = request.AccountHolderName.Trim(),
            MaskedAccountNumber = MaskAccountNumber(request.AccountNumber),
            IsDefault = request.IsDefault,
            Status = "ACTIVE",
            CreatedAt = now
        };

        await unitOfWork.Repository<PaymentMethod>().AddAsync(paymentMethod, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return ToPaymentMethodResponse(paymentMethod);
    }

    public async Task<IReadOnlyList<PaymentMethodResponse>> ListMyPaymentMethodsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await RequireStudentProfileAsync(userId, cancellationToken);

        return await unitOfWork.Repository<PaymentMethod>().Query()
            .Where(method => method.UserId == userId)
            .OrderByDescending(method => method.IsDefault)
            .ThenByDescending(method => method.CreatedAt)
            .Select(method => ToPaymentMethodResponse(method))
            .ToListAsync(cancellationToken);
    }

    public async Task<WithdrawalRequestResponse> CreateWithdrawalRequestAsync(
        Guid userId,
        CreateWithdrawalRequest request,
        CancellationToken cancellationToken = default)
    {
        var studentProfile = await RequireStudentProfileAsync(userId, cancellationToken);
        var wallet = await RequireWalletForStudentAsync(userId, cancellationToken);
        var paymentMethod = await RequirePaymentMethodAsync(userId, request.PaymentMethodId, cancellationToken);

        if (wallet.Status != WalletStatus.ACTIVE)
        {
            throw new InvalidOperationException("Wallet must be active before withdrawal.");
        }

        if (!studentProfile.CanWithdraw)
        {
            throw new InvalidOperationException("Student is not eligible to withdraw.");
        }

        if (request.Amount < MinimumWithdrawalAmount)
        {
            throw new InvalidOperationException("Withdrawal amount must be at least 50,000 VND.");
        }

        if (wallet.AvailableBalance < request.Amount)
        {
            throw new InvalidOperationException("Wallet available balance is not enough for this withdrawal.");
        }

        var now = DateTimeOffset.UtcNow;
        var previousAvailableBalance = wallet.AvailableBalance;
        var previousLockedBalance = wallet.LockedBalance;
        wallet.AvailableBalance -= request.Amount;
        wallet.LockedBalance += request.Amount;
        wallet.UpdatedAt = now;

        var withdrawal = new WithdrawalRequest
        {
            Id = Guid.NewGuid(),
            WalletId = wallet.Id,
            RequestedByUserId = userId,
            PaymentMethodId = paymentMethod.Id,
            Amount = request.Amount,
            FeeAmount = WithdrawalFeeAmount,
            NetAmount = request.Amount - WithdrawalFeeAmount,
            Status = WithdrawalPending,
            RequestedAt = now
        };

        await unitOfWork.Repository<WithdrawalRequest>().AddAsync(withdrawal, cancellationToken);
        await AddAuditLogAsync(
            userId,
            "WITHDRAWAL_REQUESTED",
            nameof(WithdrawalRequest),
            withdrawal.Id,
            $$"""{"availableBalance":{{previousAvailableBalance}},"lockedBalance":{{previousLockedBalance}}}""",
            $$"""{"availableBalance":{{wallet.AvailableBalance}},"lockedBalance":{{wallet.LockedBalance}},"amount":{{request.Amount}}}""",
            now,
            cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return ToWithdrawalResponse(withdrawal, paymentMethod);
    }

    public async Task<IReadOnlyList<WithdrawalRequestResponse>> ListMyWithdrawalRequestsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var wallet = await RequireWalletForStudentAsync(userId, cancellationToken);
        return await QueryWithdrawalsWithMethods()
            .Where(value => value.Withdrawal.WalletId == wallet.Id)
            .OrderByDescending(value => value.Withdrawal.RequestedAt)
            .Select(value => ToWithdrawalResponse(value.Withdrawal, value.PaymentMethod))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<WithdrawalRequestResponse>> ListAdminWithdrawalRequestsAsync(
        Guid adminUserId,
        CancellationToken cancellationToken = default)
    {
        await RequireAdminAsync(adminUserId, cancellationToken);
        return await QueryWithdrawalsWithMethods()
            .OrderByDescending(value => value.Withdrawal.RequestedAt)
            .Select(value => ToWithdrawalResponse(value.Withdrawal, value.PaymentMethod))
            .ToListAsync(cancellationToken);
    }

    public async Task<WithdrawalRequestResponse> ProcessWithdrawalRequestAsync(
        Guid adminUserId,
        Guid withdrawalRequestId,
        ProcessWithdrawalRequest request,
        CancellationToken cancellationToken = default)
    {
        await RequireAdminAsync(adminUserId, cancellationToken);
        var withdrawal = await unitOfWork.Repository<WithdrawalRequest>().GetByIdAsync(withdrawalRequestId, cancellationToken)
            ?? throw new InvalidOperationException("Withdrawal request was not found.");

        if (withdrawal.Status != WithdrawalPending)
        {
            throw new InvalidOperationException("Only pending withdrawal requests can be processed.");
        }

        var wallet = await unitOfWork.Repository<Wallet>().GetByIdAsync(withdrawal.WalletId, cancellationToken)
            ?? throw new InvalidOperationException("Wallet was not found.");
        var paymentMethod = await unitOfWork.Repository<PaymentMethod>().GetByIdAsync(withdrawal.PaymentMethodId, cancellationToken)
            ?? throw new InvalidOperationException("Payment method was not found.");

        if (string.IsNullOrWhiteSpace(request.Decision))
        {
            throw new InvalidOperationException("Withdrawal decision is required.");
        }

        var decision = request.Decision.Trim().ToUpperInvariant();
        var now = DateTimeOffset.UtcNow;
        var previousAvailableBalance = wallet.AvailableBalance;
        var previousLockedBalance = wallet.LockedBalance;

        if (decision == WithdrawalCompleted)
        {
            if (wallet.LockedBalance < withdrawal.Amount)
            {
                throw new InvalidOperationException("Wallet locked balance is not enough for this withdrawal.");
            }

            wallet.LockedBalance -= withdrawal.Amount;
            wallet.UpdatedAt = now;
            withdrawal.Status = WithdrawalCompleted;
            withdrawal.ProcessedAt = now;

            await unitOfWork.Repository<WalletTransaction>().AddAsync(
                new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = wallet.Id,
                    Type = WalletTransactionType.WITHDRAWAL_DEBIT,
                    Amount = -withdrawal.Amount,
                    BalanceAfter = wallet.AvailableBalance,
                    ReferenceType = nameof(WithdrawalRequest),
                    ReferenceId = withdrawal.Id,
                    Description = "Manual withdrawal processed by Admin/Finance.",
                    CreatedAt = now
                },
                cancellationToken);
        }
        else if (decision == WithdrawalFailed)
        {
            if (string.IsNullOrWhiteSpace(request.FailureReason))
            {
                throw new InvalidOperationException("Failure reason is required when withdrawal fails.");
            }

            if (wallet.LockedBalance < withdrawal.Amount)
            {
                throw new InvalidOperationException("Wallet locked balance is not enough to reverse this withdrawal.");
            }

            wallet.LockedBalance -= withdrawal.Amount;
            wallet.AvailableBalance += withdrawal.Amount;
            wallet.UpdatedAt = now;
            withdrawal.Status = WithdrawalFailed;
            withdrawal.FailureReason = request.FailureReason.Trim();
            withdrawal.ProcessedAt = now;

            await unitOfWork.Repository<WalletTransaction>().AddAsync(
                new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = wallet.Id,
                    Type = WalletTransactionType.WITHDRAWAL_FAILED_REVERSAL,
                    Amount = withdrawal.Amount,
                    BalanceAfter = wallet.AvailableBalance,
                    ReferenceType = nameof(WithdrawalRequest),
                    ReferenceId = withdrawal.Id,
                    Description = withdrawal.FailureReason,
                    CreatedAt = now
                },
                cancellationToken);
        }
        else
        {
            throw new InvalidOperationException("Withdrawal decision must be COMPLETED or FAILED.");
        }

        await AddAuditLogAsync(
            adminUserId,
            "WITHDRAWAL_PROCESSED",
            nameof(WithdrawalRequest),
            withdrawal.Id,
            $$"""{"status":"{{WithdrawalPending}}","availableBalance":{{previousAvailableBalance}},"lockedBalance":{{previousLockedBalance}}}""",
            $$"""{"status":"{{withdrawal.Status}}","availableBalance":{{wallet.AvailableBalance}},"lockedBalance":{{wallet.LockedBalance}}}""",
            now,
            cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return ToWithdrawalResponse(withdrawal, paymentMethod);
    }

    private async Task<StudentProfile> RequireStudentProfileAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await unitOfWork.Repository<User>().GetByIdAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("User was not found.");

        if (user.Role != UserRole.STUDENT)
        {
            throw new InvalidOperationException("Only Student users can use wallet APIs.");
        }

        return await unitOfWork.Repository<StudentProfile>().FirstOrDefaultAsync(
            profile => profile.UserId == userId,
            cancellationToken) ?? throw new InvalidOperationException("Student profile must be created first.");
    }

    private async Task RequireAdminAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await unitOfWork.Repository<User>().GetByIdAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("User was not found.");

        if (user.Role != UserRole.ADMIN)
        {
            throw new InvalidOperationException("Only Admin users can process withdrawals.");
        }
    }

    private async Task<Wallet> RequireWalletForStudentAsync(Guid userId, CancellationToken cancellationToken)
    {
        var studentProfile = await RequireStudentProfileAsync(userId, cancellationToken);
        return await unitOfWork.Repository<Wallet>().FirstOrDefaultAsync(
            wallet => wallet.OwnerUserId == userId && wallet.StudentProfileId == studentProfile.Id,
            cancellationToken) ?? throw new InvalidOperationException("Wallet was not found.");
    }

    private async Task<Wallet> EnsureWalletAsync(
        StudentProfile studentProfile,
        string currency,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var wallet = await unitOfWork.Repository<Wallet>().FirstOrDefaultAsync(
            value => value.StudentProfileId == studentProfile.Id,
            cancellationToken);

        if (wallet is not null)
        {
            if (wallet.Status != WalletStatus.ACTIVE)
            {
                throw new InvalidOperationException("Student wallet must be active before receiving disbursement.");
            }

            return wallet;
        }

        wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            OwnerUserId = studentProfile.UserId,
            StudentProfileId = studentProfile.Id,
            Currency = currency,
            Status = WalletStatus.ACTIVE,
            CreatedAt = now,
            UpdatedAt = now
        };

        await unitOfWork.Repository<Wallet>().AddAsync(wallet, cancellationToken);
        return wallet;
    }

    private async Task<PaymentMethod> RequirePaymentMethodAsync(
        Guid userId,
        Guid paymentMethodId,
        CancellationToken cancellationToken)
    {
        var paymentMethod = await unitOfWork.Repository<PaymentMethod>().GetByIdAsync(paymentMethodId, cancellationToken)
            ?? throw new InvalidOperationException("Payment method was not found.");

        if (paymentMethod.UserId != userId || paymentMethod.Status != "ACTIVE")
        {
            throw new UnauthorizedAccessException("Payment method is not available.");
        }

        return paymentMethod;
    }

    private IQueryable<WithdrawalWithMethod> QueryWithdrawalsWithMethods()
    {
        return from withdrawal in unitOfWork.Repository<WithdrawalRequest>().Query()
            join paymentMethod in unitOfWork.Repository<PaymentMethod>().Query()
                on withdrawal.PaymentMethodId equals paymentMethod.Id
            select new WithdrawalWithMethod(withdrawal, paymentMethod);
    }

    private static string MaskAccountNumber(string accountNumber)
    {
        var digits = new string(accountNumber.Where(char.IsDigit).ToArray());
        if (digits.Length < 4)
        {
            throw new InvalidOperationException("Account number must have at least 4 digits.");
        }

        return $"****{digits[^4..]}";
    }

    private async Task AddAuditLogAsync(
        Guid? actorUserId,
        string action,
        string entityType,
        Guid entityId,
        string beforeJson,
        string afterJson,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        await unitOfWork.Repository<AuditLog>().AddAsync(
            new AuditLog
            {
                Id = Guid.NewGuid(),
                ActorUserId = actorUserId,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                BeforeJson = beforeJson,
                AfterJson = afterJson,
                CreatedAt = now
            },
            cancellationToken);
    }

    private static WalletResponse ToWalletResponse(Wallet wallet)
    {
        return new WalletResponse(
            wallet.Id,
            wallet.OwnerUserId,
            wallet.StudentProfileId,
            wallet.Currency,
            wallet.AvailableBalance,
            wallet.PendingBalance,
            wallet.LockedBalance,
            wallet.Status,
            wallet.CreatedAt,
            wallet.UpdatedAt);
    }

    private static WalletTransactionResponse ToWalletTransactionResponse(WalletTransaction transaction)
    {
        return new WalletTransactionResponse(
            transaction.Id,
            transaction.WalletId,
            transaction.Type,
            transaction.Amount,
            transaction.BalanceAfter,
            transaction.ReferenceType,
            transaction.ReferenceId,
            transaction.Description,
            transaction.CreatedAt);
    }

    private static PaymentMethodResponse ToPaymentMethodResponse(PaymentMethod method)
    {
        return new PaymentMethodResponse(
            method.Id,
            method.MethodType,
            method.AccountHolderName,
            method.MaskedAccountNumber,
            method.IsDefault,
            method.Status,
            method.CreatedAt);
    }

    private static WithdrawalRequestResponse ToWithdrawalResponse(
        WithdrawalRequest request,
        PaymentMethod paymentMethod)
    {
        return new WithdrawalRequestResponse(
            request.Id,
            request.WalletId,
            request.PaymentMethodId,
            request.Amount,
            request.FeeAmount,
            request.NetAmount,
            request.Status,
            request.FailureReason,
            request.RequestedAt,
            request.ProcessedAt,
            paymentMethod.MaskedAccountNumber,
            paymentMethod.AccountHolderName);
    }

    private static DisbursementResponse ToDisbursementResponse(Disbursement disbursement)
    {
        return new DisbursementResponse(
            disbursement.Id,
            disbursement.EscrowId,
            disbursement.WalletId,
            disbursement.GrossAmount,
            disbursement.PlatformFeeAmount,
            disbursement.NetAmount,
            disbursement.Status,
            disbursement.CreatedAt,
            disbursement.CompletedAt);
    }

    private sealed record WithdrawalWithMethod(
        WithdrawalRequest Withdrawal,
        PaymentMethod PaymentMethod);
}
