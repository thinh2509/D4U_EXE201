namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class RefundConfiguration : IEntityTypeConfiguration<Refund>
{
    public void Configure(EntityTypeBuilder<Refund> entity)
    {
        entity.ToTable("refunds");
        entity.HasKey(refund => refund.Id);

        entity.Property(refund => refund.Id).HasColumnName("id");
        entity.Property(refund => refund.EscrowId).HasColumnName("escrow_id").IsRequired();
        entity.Property(refund => refund.PaymentId).HasColumnName("payment_id");
        entity.Property(refund => refund.Amount).HasColumnName("amount").HasPrecision(12, 2).IsRequired();
        entity.Property(refund => refund.Currency).HasColumnName("currency").HasMaxLength(3).HasDefaultValue("VND").IsFixedLength().IsRequired();
        entity.Property(refund => refund.Reason).HasColumnName("reason").HasMaxLength(50).IsRequired();
        entity.Property(refund => refund.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("PENDING").IsRequired();
        entity.Property(refund => refund.ProviderRefundId).HasColumnName("provider_refund_id").HasMaxLength(255);
        entity.Property(refund => refund.CreatedByUserId).HasColumnName("created_by_user_id");
        entity.Property(refund => refund.CreatedAt).HasColumnName("created_at").IsRequired();
        entity.Property(refund => refund.CompletedAt).HasColumnName("completed_at");

        entity.HasOne<Escrow>().WithMany().HasForeignKey(refund => refund.EscrowId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<Payment>().WithMany().HasForeignKey(refund => refund.PaymentId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<User>().WithMany().HasForeignKey(refund => refund.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
    }
}