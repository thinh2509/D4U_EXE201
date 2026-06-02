namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class WithdrawalRequestConfiguration : IEntityTypeConfiguration<WithdrawalRequest>
{
    public void Configure(EntityTypeBuilder<WithdrawalRequest> entity)
    {
        entity.ToTable("withdrawal_requests");
        entity.HasKey(request => request.Id);

        entity.Property(request => request.Id).HasColumnName("id");
        entity.Property(request => request.WalletId).HasColumnName("wallet_id").IsRequired();
        entity.Property(request => request.RequestedByUserId).HasColumnName("requested_by_user_id").IsRequired();
        entity.Property(request => request.PaymentMethodId).HasColumnName("payment_method_id").IsRequired();
        entity.Property(request => request.Amount).HasColumnName("amount").HasPrecision(12, 2).IsRequired();
        entity.Property(request => request.FeeAmount).HasColumnName("fee_amount").HasPrecision(12, 2).HasDefaultValue(5000m).IsRequired();
        entity.Property(request => request.NetAmount).HasColumnName("net_amount").HasPrecision(12, 2).IsRequired();
        entity.Property(request => request.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("PENDING").IsRequired();
        entity.Property(request => request.FailureReason).HasColumnName("failure_reason");
        entity.Property(request => request.BankTransactionReference).HasColumnName("bank_transaction_reference").HasMaxLength(120);
        entity.Property(request => request.RequestedAt).HasColumnName("requested_at").IsRequired();
        entity.Property(request => request.ProcessingStartedAt).HasColumnName("processing_started_at");
        entity.Property(request => request.TransferredAt).HasColumnName("transferred_at");
        entity.Property(request => request.ProcessedAt).HasColumnName("processed_at");
        entity.Property(request => request.ProcessedByUserId).HasColumnName("processed_by_user_id");

        entity.HasOne<Wallet>().WithMany().HasForeignKey(request => request.WalletId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<User>().WithMany().HasForeignKey(request => request.RequestedByUserId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<PaymentMethod>().WithMany().HasForeignKey(request => request.PaymentMethodId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<User>().WithMany().HasForeignKey(request => request.ProcessedByUserId).OnDelete(DeleteBehavior.Restrict);
        entity.HasIndex(request => request.WalletId)
            .IsUnique()
            .HasFilter("status IN ('PENDING', 'PROCESSING')");
    }
}
