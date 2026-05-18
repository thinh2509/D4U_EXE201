namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> entity)
    {
        entity.ToTable("payments");
        entity.HasKey(payment => payment.Id);
        entity.HasIndex(payment => new { payment.Provider, payment.ProviderTransactionId }).IsUnique();
        entity.HasIndex(payment => new { payment.EscrowId, payment.Status });
        entity.HasIndex(payment => new { payment.PayerUserId, payment.CreatedAt });

        entity.Property(payment => payment.Id).HasColumnName("id");
        entity.Property(payment => payment.PayerUserId).HasColumnName("payer_user_id").IsRequired();
        entity.Property(payment => payment.EscrowId).HasColumnName("escrow_id");
        entity.Property(payment => payment.Amount).HasColumnName("amount").HasPrecision(12, 2).IsRequired();
        entity.Property(payment => payment.Currency).HasColumnName("currency").HasMaxLength(3).HasDefaultValue("VND").IsFixedLength().IsRequired();
        entity.Property(payment => payment.Provider).HasColumnName("provider").HasMaxLength(100).IsRequired();
        entity.Property(payment => payment.ProviderTransactionId).HasColumnName("provider_transaction_id").HasMaxLength(255);
        entity.Property(payment => payment.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(30).HasDefaultValue(PaymentStatus.PENDING).IsRequired();
        entity.Property(payment => payment.PaidAt).HasColumnName("paid_at");
        entity.Property(payment => payment.CreatedAt).HasColumnName("created_at").IsRequired();

        entity.HasOne<User>().WithMany().HasForeignKey(payment => payment.PayerUserId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<Escrow>().WithMany().HasForeignKey(payment => payment.EscrowId).OnDelete(DeleteBehavior.Restrict);
    }
}