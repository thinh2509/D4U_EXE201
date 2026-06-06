namespace D4U.Api.Application.Features.MoneyMovement;

using D4U.Api.Application.Common.Data;
using D4U.Api.Application.Common.Exceptions;
using D4U.Api.Application.Features.Notifications;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;

public sealed class MoneyMovementService(
    IUnitOfWork unitOfWork,
    D4UDbContext dbContext,
    INotificationPublisher notificationPublisher,
    IDataProtectionProvider dataProtectionProvider) : IMoneyMovementService
{
    private readonly IDataProtector accountNumberProtector =
        dataProtectionProvider.CreateProtector("D4U.PaymentMethods.AccountNumber.v1");
    private const decimal MinimumWithdrawalAmount = 50000m;
    private const decimal WithdrawalFeeAmount = 5000m;
    private const string WithdrawalPending = "PENDING";
    private const string WithdrawalProcessing = "PROCESSING";
    private const string WithdrawalCompleted = "COMPLETED";
    private const string WithdrawalFailed = "FAILED";

    public async Task<DisbursementResponse?> ReleaseProjectEscrowAsync(
        Guid projectId,
        Guid? actorUserId,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var response = await ReleaseProjectEscrowCoreAsync(projectId, actorUserId, cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            if (response is not null)
            {
                await PublishEscrowReleasedNotificationAsync(
                    projectId,
                    response,
                    actorUserId,
                    cancellationToken);
            }

            return response;
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync(cancellationToken);
            dbContext.ChangeTracker.Clear();

            var projectEscrowIds = unitOfWork.Repository<Escrow>().Query()
                .Where(escrow => escrow.ProjectId == projectId)
                .Select(escrow => escrow.Id);
            var existingDisbursement = await unitOfWork.Repository<Disbursement>().Query()
                .Where(value => projectEscrowIds.Contains(value.EscrowId))
                .FirstOrDefaultAsync(cancellationToken);

            if (existingDisbursement is null)
            {
                throw;
            }

            return ToDisbursementResponse(existingDisbursement);
        }
    }

    public async Task<RefundResponse> CreateStudentAbandonRefundAsync(
        Guid projectId,
        Guid studentUserId,
        string reason,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var response = await CreateStudentAbandonRefundCoreAsync(
                projectId,
                studentUserId,
                reason,
                cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return response;
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync(cancellationToken);
            dbContext.ChangeTracker.Clear();

            var existingRefund = await (
                from refund in unitOfWork.Repository<Refund>().Query()
                join escrow in unitOfWork.Repository<Escrow>().Query() on refund.EscrowId equals escrow.Id
                where escrow.ProjectId == projectId
                orderby refund.CreatedAt descending
                select refund)
                .FirstOrDefaultAsync(cancellationToken);

            if (existingRefund is null)
            {
                throw;
            }

            return await ToRefundResponseAsync(existingRefund, cancellationToken);
        }
    }

    public async Task<IReadOnlyList<RefundResponse>> ListAdminRefundsAsync(
        Guid adminUserId,
        CancellationToken cancellationToken = default)
    {
        await RequireAdminAsync(adminUserId, cancellationToken);

        var refunds = await unitOfWork.Repository<Refund>().Query()
            .OrderByDescending(refund => refund.CreatedAt)
            .ToListAsync(cancellationToken);

        return await ToRefundResponsesAsync(refunds, cancellationToken);
    }

    public async Task<RefundResponse> MarkRefundCompletedAsync(
        Guid adminUserId,
        Guid refundId,
        ProcessRefundRequest request,
        CancellationToken cancellationToken = default)
    {
        await RequireAdminAsync(adminUserId, cancellationToken);

        var refund = await unitOfWork.Repository<Refund>().GetByIdAsync(refundId, cancellationToken)
            ?? throw new NotFoundException("Refund was not found.");

        if (!string.Equals(refund.Status, "PENDING", StringComparison.OrdinalIgnoreCase))
        {
            throw new ConflictException("Only pending refunds can be marked as completed.");
        }

        if (string.IsNullOrWhiteSpace(request.ManualRefundReference))
        {
            throw new ValidationException("Manual refund reference is required.");
        }

        var escrow = await unitOfWork.Repository<Escrow>().GetByIdAsync(refund.EscrowId, cancellationToken)
            ?? throw new NotFoundException("Escrow was not found.");
        var now = DateTimeOffset.UtcNow;

        refund.Status = "REFUNDED_MANUALLY";
        refund.ProviderRefundId = request.ManualRefundReference.Trim();
        refund.CompletedAt = request.ProcessedAt ?? now;
        escrow.Status = EscrowStatus.REFUNDED;
        escrow.RefundedAt = refund.CompletedAt;
        escrow.UpdatedAt = now;

        await AddAuditLogAsync(
            adminUserId,
            "ESCROW_REFUNDED",
            nameof(Refund),
            refund.Id,
            $$"""{"status":"PENDING","escrowStatus":"{{EscrowStatus.REFUND_PENDING}}"}""",
            $$"""{"status":"{{refund.Status}}","escrowStatus":"{{EscrowStatus.REFUNDED}}","amount":{{refund.Amount}}}""",
            now,
            cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return await ToRefundResponseAsync(refund, cancellationToken);
    }

    private async Task<IReadOnlyList<RefundResponse>> ToRefundResponsesAsync(
        IReadOnlyList<Refund> refunds,
        CancellationToken cancellationToken)
    {
        var escrowIds = refunds.Select(refund => refund.EscrowId).Distinct().ToList();
        var escrows = await unitOfWork.Repository<Escrow>().Query()
            .Where(escrow => escrowIds.Contains(escrow.Id))
            .ToDictionaryAsync(escrow => escrow.Id, cancellationToken);
        var projectIds = escrows.Values.Select(escrow => escrow.ProjectId).Distinct().ToList();
        var projects = await unitOfWork.Repository<Project>().Query()
            .Where(project => projectIds.Contains(project.Id))
            .ToDictionaryAsync(project => project.Id, cancellationToken);
        var smeProfileIds = projects.Values.Select(project => project.SmeProfileId).Distinct().ToList();
        var studentProfileIds = escrows.Values.Select(escrow => escrow.StudentProfileId).Distinct().ToList();
        var smeUsers = await (
            from profile in unitOfWork.Repository<SmeProfile>().Query()
            join user in unitOfWork.Repository<User>().Query() on profile.UserId equals user.Id
            where smeProfileIds.Contains(profile.Id)
            select new { profile.Id, user.FullName })
            .ToDictionaryAsync(value => value.Id, value => value.FullName, cancellationToken);
        var studentUsers = await (
            from profile in unitOfWork.Repository<StudentProfile>().Query()
            join user in unitOfWork.Repository<User>().Query() on profile.UserId equals user.Id
            where studentProfileIds.Contains(profile.Id)
            select new { profile.Id, user.FullName })
            .ToDictionaryAsync(value => value.Id, value => value.FullName, cancellationToken);

        return refunds
            .Select(refund =>
            {
                escrows.TryGetValue(refund.EscrowId, out var escrow);
                var project = escrow is null
                    ? null
                    : projects.GetValueOrDefault(escrow.ProjectId);
                var smeName = project is not null && smeUsers.TryGetValue(project.SmeProfileId, out var smeFullName)
                    ? smeFullName
                    : null;
                var studentName = escrow is not null && studentUsers.TryGetValue(escrow.StudentProfileId, out var studentFullName)
                    ? studentFullName
                    : null;

                return ToRefundResponse(refund, escrow, project, smeName, studentName);
            })
            .ToList();
    }

    private async Task<DisbursementResponse?> ReleaseProjectEscrowCoreAsync(
        Guid projectId,
        Guid? actorUserId,
        CancellationToken cancellationToken)
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
        wallet = await LockWalletAsync(wallet, cancellationToken);
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

    private async Task<RefundResponse> CreateStudentAbandonRefundCoreAsync(
        Guid projectId,
        Guid studentUserId,
        string reason,
        CancellationToken cancellationToken)
    {
        var existingRefund = await (
            from refundValue in unitOfWork.Repository<Refund>().Query()
            join escrowValue in unitOfWork.Repository<Escrow>().Query() on refundValue.EscrowId equals escrowValue.Id
            where escrowValue.ProjectId == projectId
            orderby refundValue.CreatedAt descending
            select refundValue)
            .FirstOrDefaultAsync(cancellationToken);

        if (existingRefund is not null)
        {
            return await ToRefundResponseAsync(existingRefund, cancellationToken);
        }

        var actor = await unitOfWork.Repository<User>().GetByIdAsync(studentUserId, cancellationToken)
            ?? throw new ForbiddenException("User was not found.");

        if (actor.Role != UserRole.STUDENT)
        {
            throw new ForbiddenException("Only Student users can abandon projects.");
        }

        var project = await dbContext.Projects
            .FromSqlInterpolated($"""SELECT * FROM public.projects WHERE id = {projectId} FOR UPDATE""")
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Project was not found.");

        if (project.Status != ProjectStatus.IN_PROGRESS)
        {
            throw new ConflictException("Student can abandon only in-progress projects before any submission.");
        }

        var studentProfile = await unitOfWork.Repository<StudentProfile>().FirstOrDefaultAsync(
            profile => profile.UserId == studentUserId,
            cancellationToken) ?? throw new NotFoundException("Student profile must be created first.");

        if (project.SelectedStudentProfileId != studentProfile.Id)
        {
            throw new ForbiddenException("Only the selected student can abandon this project.");
        }

        var escrow = await dbContext.Escrows
            .FromSqlInterpolated($"""SELECT * FROM public.escrows WHERE project_id = {projectId} FOR UPDATE""")
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("Escrow was not found.");

        if (escrow.Status != EscrowStatus.FUNDED)
        {
            throw new ConflictException("Only funded escrow can be moved to refund pending.");
        }

        var hasSubmission = await unitOfWork.Repository<ProjectSubmission>().AnyAsync(
            value => value.ProjectId == projectId,
            cancellationToken);

        if (hasSubmission)
        {
            throw new ConflictException("Student cannot abandon after submitting any file.");
        }

        var now = DateTimeOffset.UtcNow;
        var refund = new Refund
        {
            Id = Guid.NewGuid(),
            EscrowId = escrow.Id,
            PaymentId = await unitOfWork.Repository<Payment>().Query()
                .Where(payment => payment.EscrowId == escrow.Id && payment.Status == PaymentStatus.SUCCESS)
                .OrderByDescending(payment => payment.PaidAt ?? payment.CreatedAt)
                .Select(payment => (Guid?)payment.Id)
                .FirstOrDefaultAsync(cancellationToken),
            Amount = escrow.Amount,
            Currency = escrow.Currency,
            Reason = "STUDENT_ABANDONED",
            Status = "PENDING",
            CreatedByUserId = studentUserId,
            CreatedAt = now
        };

        var previousProjectStatus = project.Status;
        project.Status = ProjectStatus.STUDENT_ABANDONED;
        project.CancelledAt = now;
        project.CancellationReason = reason.Trim();
        project.UpdatedAt = now;

        escrow.Status = EscrowStatus.REFUND_PENDING;
        escrow.UpdatedAt = now;

        await unitOfWork.Repository<Refund>().AddAsync(refund, cancellationToken);
        await AddAuditLogAsync(
            studentUserId,
            "PROJECT_STATUS_CHANGED",
            nameof(Project),
            project.Id,
            $$"""{"projectStatus":"{{previousProjectStatus}}","escrowStatus":"{{EscrowStatus.FUNDED}}"}""",
            $$"""{"projectStatus":"{{ProjectStatus.STUDENT_ABANDONED}}","escrowStatus":"{{EscrowStatus.REFUND_PENDING}}","refundAmount":{{refund.Amount}}}""",
            now,
            cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return await ToRefundResponseAsync(refund, cancellationToken);
    }

    private async Task PublishEscrowReleasedNotificationAsync(
        Guid projectId,
        DisbursementResponse disbursement,
        Guid? actorUserId,
        CancellationToken cancellationToken)
    {
        var data = await (
            from escrow in dbContext.Escrows
            join studentProfile in dbContext.StudentProfiles on escrow.StudentProfileId equals studentProfile.Id
            where escrow.ProjectId == projectId && escrow.Id == disbursement.EscrowId
            select new
            {
                studentProfile.UserId,
                escrow.Currency
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (data is null)
        {
            return;
        }

        await notificationPublisher.PublishAsync(
            data.UserId,
            actorUserId,
            "ESCROW_RELEASED",
            "Tiền dự án đã được cộng vào ví",
            $"Bạn đã nhận {disbursement.NetAmount:N0} {data.Currency} sau khi trừ {disbursement.PlatformFeeAmount:N0} {data.Currency} phí nền tảng.",
            nameof(Disbursement),
            disbursement.Id,
            disbursement.CompletedAt ?? DateTimeOffset.UtcNow,
            cancellationToken);
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
        var transactions = await unitOfWork.Repository<WalletTransaction>().Query()
            .Where(transaction => transaction.WalletId == wallet.Id)
            .OrderByDescending(transaction => transaction.CreatedAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        var disbursementIds = transactions
            .Where(transaction => transaction.ReferenceType == nameof(Disbursement) && transaction.ReferenceId.HasValue)
            .Select(transaction => transaction.ReferenceId!.Value)
            .Distinct()
            .ToList();
        var disbursements = await unitOfWork.Repository<Disbursement>().Query()
            .Where(disbursement => disbursementIds.Contains(disbursement.Id))
            .ToDictionaryAsync(disbursement => disbursement.Id, cancellationToken);

        return transactions
            .Select(transaction =>
            {
                var disbursement = transaction.ReferenceId.HasValue &&
                    disbursements.TryGetValue(transaction.ReferenceId.Value, out var value)
                        ? value
                        : null;
                return ToWalletTransactionResponse(transaction, disbursement);
            })
            .ToList();
    }

    public async Task<PaymentMethodResponse> CreatePaymentMethodAsync(
        Guid userId,
        CreatePaymentMethodRequest request,
        CancellationToken cancellationToken = default)
    {
        await RequireStudentProfileAsync(userId, cancellationToken);

        if (string.IsNullOrWhiteSpace(request.BankName))
        {
            throw new InvalidOperationException("Bank name is required.");
        }

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
            BankName = request.BankName.Trim(),
            BankCode = string.IsNullOrWhiteSpace(request.BankCode) ? null : request.BankCode.Trim(),
            AccountHolderName = request.AccountHolderName.Trim(),
            MaskedAccountNumber = MaskAccountNumber(request.AccountNumber),
            AccountNumberEncrypted = ProtectAccountNumber(request.AccountNumber),
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

        var paymentMethods = await unitOfWork.Repository<PaymentMethod>().Query()
            .Where(method => method.UserId == userId)
            .OrderByDescending(method => method.IsDefault)
            .ThenByDescending(method => method.CreatedAt)
            .ToListAsync(cancellationToken);

        return paymentMethods
            .Select(ToPaymentMethodResponse)
            .ToList();
    }

    public async Task<WithdrawalRequestResponse> CreateWithdrawalRequestAsync(
        Guid userId,
        CreateWithdrawalRequest request,
        CancellationToken cancellationToken = default)
    {
        var studentProfile = await RequireStudentProfileAsync(userId, cancellationToken);
        var existingWallet = await RequireWalletForStudentAsync(userId, cancellationToken);
        var paymentMethod = await RequirePaymentMethodAsync(userId, request.PaymentMethodId, cancellationToken);
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var wallet = await LockWalletAsync(existingWallet, cancellationToken);

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

        var hasActiveWithdrawal = await unitOfWork.Repository<WithdrawalRequest>().Query()
            .AnyAsync(
                value => value.WalletId == wallet.Id &&
                    (value.Status == WithdrawalPending || value.Status == WithdrawalProcessing),
                cancellationToken);

        if (hasActiveWithdrawal)
        {
            throw new InvalidOperationException("Only one pending or processing withdrawal request is allowed.");
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

        try
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return ToWithdrawalResponse(withdrawal, paymentMethod);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<IReadOnlyList<WithdrawalRequestResponse>> ListMyWithdrawalRequestsAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var wallet = await RequireWalletForStudentAsync(userId, cancellationToken);
        var withdrawals = await unitOfWork.Repository<WithdrawalRequest>().Query()
            .Where(withdrawal => withdrawal.WalletId == wallet.Id)
            .OrderByDescending(withdrawal => withdrawal.RequestedAt)
            .ToListAsync(cancellationToken);
        var paymentMethods = await LoadWithdrawalPaymentMethodsAsync(withdrawals, cancellationToken);

        return withdrawals
            .Select(withdrawal => ToWithdrawalResponse(withdrawal, paymentMethods[withdrawal.PaymentMethodId], includeAccountNumber: false))
            .ToList();
    }

    public async Task<IReadOnlyList<WithdrawalRequestResponse>> ListAdminWithdrawalRequestsAsync(
        Guid adminUserId,
        CancellationToken cancellationToken = default)
    {
        await RequireAdminAsync(adminUserId, cancellationToken);
        var withdrawals = await unitOfWork.Repository<WithdrawalRequest>().Query()
            .OrderByDescending(withdrawal => withdrawal.RequestedAt)
            .ToListAsync(cancellationToken);
        var paymentMethods = await LoadWithdrawalPaymentMethodsAsync(withdrawals, cancellationToken);
        var responses = withdrawals
            .Select(withdrawal => ToWithdrawalResponse(withdrawal, paymentMethods[withdrawal.PaymentMethodId], includeAccountNumber: true))
            .ToList();

        var sensitiveCount = responses.Count(response => !string.IsNullOrWhiteSpace(response.AccountNumber));
        if (sensitiveCount > 0)
        {
            await AddAuditLogAsync(
                adminUserId,
                "WITHDRAWAL_BANK_DETAILS_VIEWED",
                nameof(WithdrawalRequest),
                null,
                "{}",
                $$"""{"withdrawalCount":{{sensitiveCount}}}""",
                DateTimeOffset.UtcNow,
                cancellationToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return responses;
    }

    public async Task<WithdrawalRequestResponse> ProcessWithdrawalRequestAsync(
        Guid adminUserId,
        Guid withdrawalRequestId,
        ProcessWithdrawalRequest request,
        CancellationToken cancellationToken = default)
    {
        await RequireAdminAsync(adminUserId, cancellationToken);
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var withdrawal = await dbContext.WithdrawalRequests
            .FromSqlInterpolated($"""SELECT * FROM public.withdrawal_requests WHERE id = {withdrawalRequestId} FOR UPDATE""")
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new InvalidOperationException("Withdrawal request was not found.");

        var wallet = await dbContext.Wallets
            .FromSqlInterpolated($"""SELECT * FROM public.wallets WHERE id = {withdrawal.WalletId} FOR UPDATE""")
            .SingleOrDefaultAsync(cancellationToken)
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

        if (decision == WithdrawalProcessing)
        {
            if (withdrawal.Status != WithdrawalPending)
            {
                throw new InvalidOperationException("Only pending withdrawal requests can start processing.");
            }

            withdrawal.Status = WithdrawalProcessing;
            withdrawal.ProcessingStartedAt = now;
            withdrawal.ProcessedByUserId = adminUserId;
        }
        else if (decision == WithdrawalCompleted)
        {
            if (withdrawal.Status != WithdrawalProcessing)
            {
                throw new InvalidOperationException("Only processing withdrawal requests can be completed.");
            }

            if (string.IsNullOrWhiteSpace(request.BankTransactionReference) || !request.TransferredAt.HasValue)
            {
                throw new InvalidOperationException("Bank transaction reference and transfer time are required when withdrawal completes.");
            }

            if (request.TransferredAt.Value > now.AddMinutes(5))
            {
                throw new InvalidOperationException("Transfer time cannot be in the future.");
            }

            if (wallet.LockedBalance < withdrawal.Amount)
            {
                throw new InvalidOperationException("Wallet locked balance is not enough for this withdrawal.");
            }

            wallet.LockedBalance -= withdrawal.Amount;
            wallet.UpdatedAt = now;
            withdrawal.Status = WithdrawalCompleted;
            withdrawal.ProcessedAt = now;
            withdrawal.ProcessedByUserId ??= adminUserId;
            withdrawal.BankTransactionReference = request.BankTransactionReference.Trim();
            withdrawal.TransferredAt = request.TransferredAt;

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

            await AddNotificationAsync(
                withdrawal.RequestedByUserId,
                adminUserId,
                "WITHDRAWAL_COMPLETED",
                "Yêu cầu rút tiền đã hoàn tất",
                $"D4U đã xác nhận chuyển {withdrawal.NetAmount:N0} VND. Mã giao dịch: {withdrawal.BankTransactionReference}.",
                nameof(WithdrawalRequest),
                withdrawal.Id,
                now,
                cancellationToken);
        }
        else if (decision == WithdrawalFailed)
        {
            if (withdrawal.Status != WithdrawalProcessing)
            {
                throw new InvalidOperationException("Only processing withdrawal requests can fail.");
            }

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
            withdrawal.ProcessedByUserId ??= adminUserId;

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

            await AddNotificationAsync(
                withdrawal.RequestedByUserId,
                adminUserId,
                "WITHDRAWAL_FAILED",
                "Yêu cầu rút tiền chưa thành công",
                $"Số tiền {withdrawal.Amount:N0} VND đã được trả lại số dư khả dụng. Lý do: {withdrawal.FailureReason}",
                nameof(WithdrawalRequest),
                withdrawal.Id,
                now,
                cancellationToken);
        }
        else
        {
            throw new InvalidOperationException("Withdrawal decision must be PROCESSING, COMPLETED, or FAILED.");
        }

        await AddAuditLogAsync(
            adminUserId,
            "WITHDRAWAL_PROCESSED",
            nameof(WithdrawalRequest),
            withdrawal.Id,
            $$"""{"status":"{{decision switch { WithdrawalProcessing => WithdrawalPending, _ => WithdrawalProcessing }}}","availableBalance":{{previousAvailableBalance}},"lockedBalance":{{previousLockedBalance}}}""",
            $$"""{"status":"{{withdrawal.Status}}","availableBalance":{{wallet.AvailableBalance}},"lockedBalance":{{wallet.LockedBalance}}}""",
            now,
            cancellationToken);

        try
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return ToWithdrawalResponse(withdrawal, paymentMethod, includeAccountNumber: true);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
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

    private async Task<Wallet> LockWalletAsync(
        Wallet wallet,
        CancellationToken cancellationToken)
    {
        if (dbContext.Entry(wallet).State == EntityState.Added)
        {
            return wallet;
        }

        return await dbContext.Wallets
            .FromSqlInterpolated($"""SELECT * FROM public.wallets WHERE id = {wallet.Id} FOR UPDATE""")
            .SingleAsync(cancellationToken);
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

        if (string.IsNullOrWhiteSpace(paymentMethod.BankName))
        {
            throw new InvalidOperationException("Payment method must include bank name before withdrawal.");
        }

        if (string.IsNullOrWhiteSpace(paymentMethod.AccountNumberEncrypted))
        {
            throw new InvalidOperationException("Payment method must include full account number before withdrawal.");
        }

        _ = UnprotectAccountNumber(paymentMethod.AccountNumberEncrypted);
        return paymentMethod;
    }

    private async Task<Dictionary<Guid, PaymentMethod>> LoadWithdrawalPaymentMethodsAsync(
        IReadOnlyCollection<WithdrawalRequest> withdrawals,
        CancellationToken cancellationToken)
    {
        var paymentMethodIds = withdrawals
            .Select(withdrawal => withdrawal.PaymentMethodId)
            .Distinct()
            .ToList();

        if (paymentMethodIds.Count == 0)
        {
            return new Dictionary<Guid, PaymentMethod>();
        }

        return await unitOfWork.Repository<PaymentMethod>().Query()
            .Where(paymentMethod => paymentMethodIds.Contains(paymentMethod.Id))
            .ToDictionaryAsync(paymentMethod => paymentMethod.Id, cancellationToken);
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

    private string ProtectAccountNumber(string accountNumber)
    {
        return accountNumberProtector.Protect(accountNumber.Trim());
    }

    private string UnprotectAccountNumber(string encryptedAccountNumber)
    {
        try
        {
            return accountNumberProtector.Unprotect(encryptedAccountNumber);
        }
        catch (Exception exception)
        {
            throw new InvalidOperationException("Không thể giải mã số tài khoản.", exception);
        }
    }

    private string? TryUnprotectAccountNumber(PaymentMethod paymentMethod)
    {
        if (string.IsNullOrWhiteSpace(paymentMethod.AccountNumberEncrypted))
        {
            return null;
        }

        try
        {
            return accountNumberProtector.Unprotect(paymentMethod.AccountNumberEncrypted);
        }
        catch
        {
            return null;
        }
    }

    private static string BuildTransferContent(Guid withdrawalRequestId)
    {
        return $"D4U WD {withdrawalRequestId.ToString("N")[..8].ToUpperInvariant()}";
    }

    private async Task AddAuditLogAsync(
        Guid? actorUserId,
        string action,
        string entityType,
        Guid? entityId,
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

    private async Task AddNotificationAsync(
        Guid recipientUserId,
        Guid? actorUserId,
        string type,
        string title,
        string body,
        string referenceType,
        Guid referenceId,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        await unitOfWork.Repository<Notification>().AddAsync(
            new Notification
            {
                Id = Guid.NewGuid(),
                RecipientUserId = recipientUserId,
                ActorUserId = actorUserId,
                Type = type,
                Title = title,
                Body = body,
                ReferenceType = referenceType,
                ReferenceId = referenceId,
                Status = NotificationStatus.UNREAD,
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

    private static WalletTransactionResponse ToWalletTransactionResponse(
        WalletTransaction transaction,
        Disbursement? disbursement)
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
            transaction.CreatedAt,
            disbursement?.GrossAmount,
            disbursement?.PlatformFeeAmount,
            disbursement?.NetAmount);
    }

    private PaymentMethodResponse ToPaymentMethodResponse(PaymentMethod method)
    {
        var hasFullAccountNumber = !string.IsNullOrWhiteSpace(method.AccountNumberEncrypted) &&
            !string.IsNullOrWhiteSpace(TryUnprotectAccountNumber(method));

        return new PaymentMethodResponse(
            method.Id,
            method.MethodType,
            method.BankName,
            method.BankCode,
            method.AccountHolderName,
            method.MaskedAccountNumber,
            hasFullAccountNumber,
            method.IsDefault,
            method.Status,
            method.CreatedAt);
    }

    private WithdrawalRequestResponse ToWithdrawalResponse(
        WithdrawalRequest request,
        PaymentMethod paymentMethod)
    {
        return ToWithdrawalResponse(request, paymentMethod, includeAccountNumber: false);
    }

    private WithdrawalRequestResponse ToWithdrawalResponse(
        WithdrawalRequest request,
        PaymentMethod paymentMethod,
        bool includeAccountNumber)
    {
        var accountNumber = includeAccountNumber ? TryUnprotectAccountNumber(paymentMethod) : null;
        var hasFullAccountNumber = includeAccountNumber
            ? !string.IsNullOrWhiteSpace(accountNumber)
            : !string.IsNullOrWhiteSpace(paymentMethod.AccountNumberEncrypted);

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
            paymentMethod.BankName,
            paymentMethod.BankCode,
            paymentMethod.MaskedAccountNumber,
            accountNumber,
            paymentMethod.AccountHolderName,
            hasFullAccountNumber,
            request.NetAmount,
            BuildTransferContent(request.Id),
            request.ProcessingStartedAt,
            request.TransferredAt,
            request.BankTransactionReference,
            request.ProcessedByUserId);
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

    private async Task<RefundResponse> ToRefundResponseAsync(
        Refund refund,
        CancellationToken cancellationToken)
    {
        var escrow = await unitOfWork.Repository<Escrow>().GetByIdAsync(refund.EscrowId, cancellationToken);
        Project? project = null;
        string? smeFullName = null;
        string? studentFullName = null;

        if (escrow is not null)
        {
            project = await unitOfWork.Repository<Project>().GetByIdAsync(escrow.ProjectId, cancellationToken);

            if (project is not null)
            {
                smeFullName = await (
                    from profile in unitOfWork.Repository<SmeProfile>().Query()
                    join user in unitOfWork.Repository<User>().Query() on profile.UserId equals user.Id
                    where profile.Id == project.SmeProfileId
                    select user.FullName)
                    .FirstOrDefaultAsync(cancellationToken);
            }

            studentFullName = await (
                from profile in unitOfWork.Repository<StudentProfile>().Query()
                join user in unitOfWork.Repository<User>().Query() on profile.UserId equals user.Id
                where profile.Id == escrow.StudentProfileId
                select user.FullName)
                .FirstOrDefaultAsync(cancellationToken);
        }

        return ToRefundResponse(refund, escrow, project, smeFullName, studentFullName);
    }

    private static RefundResponse ToRefundResponse(
        Refund refund,
        Escrow? escrow,
        Project? project,
        string? smeFullName,
        string? studentFullName)
    {
        return new RefundResponse(
            refund.Id,
            refund.EscrowId,
            escrow?.ProjectId ?? Guid.Empty,
            project?.Title,
            smeFullName,
            studentFullName,
            refund.Amount,
            refund.Currency,
            refund.Reason,
            refund.Status,
            refund.CreatedAt,
            refund.CompletedAt,
            refund.ProviderRefundId);
    }
}
