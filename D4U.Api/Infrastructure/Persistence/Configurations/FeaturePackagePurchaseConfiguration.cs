namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class FeaturePackagePurchaseConfiguration : IEntityTypeConfiguration<FeaturePackagePurchase>
{
    public void Configure(EntityTypeBuilder<FeaturePackagePurchase> entity)
    {
        entity.ToTable("feature_package_purchases");
        entity.HasKey(value => value.Id);
        entity.HasIndex(value => new { value.BuyerUserId, value.Status, value.CreatedAt });
        entity.HasIndex(value => new { value.FeaturePackageId, value.Status });

        entity.Property(value => value.Id).HasColumnName("id");
        entity.Property(value => value.FeaturePackageId).HasColumnName("feature_package_id").IsRequired();
        entity.Property(value => value.BuyerUserId).HasColumnName("buyer_user_id").IsRequired();
        entity.Property(value => value.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(30).HasDefaultValue(FeaturePackagePurchaseStatus.PENDING).IsRequired();
        entity.Property(value => value.Price).HasColumnName("price").HasPrecision(12, 2).IsRequired();
        entity.Property(value => value.Currency).HasColumnName("currency").HasMaxLength(3).HasDefaultValue("VND").IsFixedLength().IsRequired();
        entity.Property(value => value.ActivatedAt).HasColumnName("activated_at");
        entity.Property(value => value.ExpiresAt).HasColumnName("expires_at");
        entity.Property(value => value.CancelledAt).HasColumnName("cancelled_at");
        entity.Property(value => value.CreatedAt).HasColumnName("created_at").IsRequired();
        entity.Property(value => value.UpdatedAt).HasColumnName("updated_at").IsRequired();

        entity.HasOne<FeaturePackage>().WithMany().HasForeignKey(value => value.FeaturePackageId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<User>().WithMany().HasForeignKey(value => value.BuyerUserId).OnDelete(DeleteBehavior.Restrict);
    }
}
