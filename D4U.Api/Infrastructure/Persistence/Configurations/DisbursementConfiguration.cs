namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class DisbursementConfiguration : IEntityTypeConfiguration<Disbursement>
{
    public void Configure(EntityTypeBuilder<Disbursement> entity)
    {
        entity.ToTable("disbursements");
        entity.HasKey(disbursement => disbursement.Id);
        entity.HasIndex(disbursement => disbursement.EscrowId).IsUnique();

        entity.Property(disbursement => disbursement.Id).HasColumnName("id");
        entity.Property(disbursement => disbursement.EscrowId).HasColumnName("escrow_id").IsRequired();
        entity.Property(disbursement => disbursement.WalletId).HasColumnName("wallet_id").IsRequired();
        entity.Property(disbursement => disbursement.GrossAmount).HasColumnName("gross_amount").HasPrecision(12, 2).IsRequired();
        entity.Property(disbursement => disbursement.PlatformFeeAmount).HasColumnName("platform_fee_amount").HasPrecision(12, 2).IsRequired();
        entity.Property(disbursement => disbursement.NetAmount).HasColumnName("net_amount").HasPrecision(12, 2).IsRequired();
        entity.Property(disbursement => disbursement.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("PENDING").IsRequired();
        entity.Property(disbursement => disbursement.CreatedAt).HasColumnName("created_at").IsRequired();
        entity.Property(disbursement => disbursement.CompletedAt).HasColumnName("completed_at");

        entity.HasOne<Escrow>().WithMany().HasForeignKey(disbursement => disbursement.EscrowId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<Wallet>().WithMany().HasForeignKey(disbursement => disbursement.WalletId).OnDelete(DeleteBehavior.Restrict);
    }
}
