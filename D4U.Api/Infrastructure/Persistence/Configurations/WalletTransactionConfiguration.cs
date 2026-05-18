namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class WalletTransactionConfiguration : IEntityTypeConfiguration<WalletTransaction>
{
    public void Configure(EntityTypeBuilder<WalletTransaction> entity)
    {
        entity.ToTable("wallet_transactions");
        entity.HasKey(transaction => transaction.Id);
        entity.HasIndex(transaction => new { transaction.WalletId, transaction.CreatedAt });
        entity.HasIndex(transaction => new { transaction.ReferenceType, transaction.ReferenceId });

        entity.Property(transaction => transaction.Id).HasColumnName("id");
        entity.Property(transaction => transaction.WalletId).HasColumnName("wallet_id").IsRequired();
        entity.Property(transaction => transaction.Type).HasColumnName("type").HasConversion<string>().HasMaxLength(40).IsRequired();
        entity.Property(transaction => transaction.Amount).HasColumnName("amount").HasPrecision(12, 2).IsRequired();
        entity.Property(transaction => transaction.BalanceAfter).HasColumnName("balance_after").HasPrecision(12, 2).IsRequired();
        entity.Property(transaction => transaction.ReferenceType).HasColumnName("reference_type").HasMaxLength(50);
        entity.Property(transaction => transaction.ReferenceId).HasColumnName("reference_id");
        entity.Property(transaction => transaction.Description).HasColumnName("description");
        entity.Property(transaction => transaction.CreatedAt).HasColumnName("created_at").IsRequired();

        entity.HasOne<Wallet>().WithMany().HasForeignKey(transaction => transaction.WalletId).OnDelete(DeleteBehavior.Restrict);
    }
}