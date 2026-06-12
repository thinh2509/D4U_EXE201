namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class UserFeatureEntitlementConfiguration : IEntityTypeConfiguration<UserFeatureEntitlement>
{
    public void Configure(EntityTypeBuilder<UserFeatureEntitlement> entity)
    {
        entity.ToTable("user_feature_entitlements");
        entity.HasKey(value => value.Id);
        entity.HasIndex(value => new { value.UserId, value.EntitlementCode, value.Status });
        entity.HasIndex(value => value.FeaturePackagePurchaseId).IsUnique();

        entity.Property(value => value.Id).HasColumnName("id");
        entity.Property(value => value.UserId).HasColumnName("user_id").IsRequired();
        entity.Property(value => value.FeaturePackageId).HasColumnName("feature_package_id").IsRequired();
        entity.Property(value => value.FeaturePackagePurchaseId).HasColumnName("feature_package_purchase_id").IsRequired();
        entity.Property(value => value.EntitlementCode).HasColumnName("entitlement_code").HasMaxLength(80).IsRequired();
        entity.Property(value => value.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(30).HasDefaultValue(FeatureEntitlementStatus.ACTIVE).IsRequired();
        entity.Property(value => value.UsageLimit).HasColumnName("usage_limit");
        entity.Property(value => value.UsageConsumed).HasColumnName("usage_consumed").HasDefaultValue(0).IsRequired();
        entity.Property(value => value.ActivatedAt).HasColumnName("activated_at").IsRequired();
        entity.Property(value => value.ExpiresAt).HasColumnName("expires_at").IsRequired();
        entity.Property(value => value.CancelledAt).HasColumnName("cancelled_at");
        entity.Property(value => value.CreatedAt).HasColumnName("created_at").IsRequired();
        entity.Property(value => value.UpdatedAt).HasColumnName("updated_at").IsRequired();

        entity.HasOne<User>().WithMany().HasForeignKey(value => value.UserId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<FeaturePackage>().WithMany().HasForeignKey(value => value.FeaturePackageId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<FeaturePackagePurchase>().WithMany().HasForeignKey(value => value.FeaturePackagePurchaseId).OnDelete(DeleteBehavior.Restrict);
    }
}
