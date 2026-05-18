namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class WalletConfiguration : IEntityTypeConfiguration<Wallet>
{
    public void Configure(EntityTypeBuilder<Wallet> entity)
    {
        entity.ToTable("wallets");
        entity.HasKey(wallet => wallet.Id);
        entity.HasIndex(wallet => wallet.OwnerUserId).IsUnique();
        entity.HasIndex(wallet => wallet.StudentProfileId).IsUnique();

        entity.Property(wallet => wallet.Id).HasColumnName("id");
        entity.Property(wallet => wallet.OwnerUserId).HasColumnName("owner_user_id").IsRequired();
        entity.Property(wallet => wallet.StudentProfileId).HasColumnName("student_profile_id");
        entity.Property(wallet => wallet.Currency).HasColumnName("currency").HasMaxLength(3).HasDefaultValue("VND").IsFixedLength().IsRequired();
        entity.Property(wallet => wallet.AvailableBalance).HasColumnName("available_balance").HasPrecision(12, 2).HasDefaultValue(0m).IsRequired();
        entity.Property(wallet => wallet.PendingBalance).HasColumnName("pending_balance").HasPrecision(12, 2).HasDefaultValue(0m).IsRequired();
        entity.Property(wallet => wallet.LockedBalance).HasColumnName("locked_balance").HasPrecision(12, 2).HasDefaultValue(0m).IsRequired();
        entity.Property(wallet => wallet.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(30).HasDefaultValue(WalletStatus.ACTIVE).IsRequired();
        entity.Property(wallet => wallet.CreatedAt).HasColumnName("created_at").IsRequired();
        entity.Property(wallet => wallet.UpdatedAt).HasColumnName("updated_at").IsRequired();

        entity.HasOne<User>().WithOne().HasForeignKey<Wallet>(wallet => wallet.OwnerUserId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<StudentProfile>().WithOne().HasForeignKey<Wallet>(wallet => wallet.StudentProfileId).OnDelete(DeleteBehavior.Restrict);
    }
}