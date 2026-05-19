namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class SmeSubscriptionConfiguration : IEntityTypeConfiguration<SmeSubscription>
{
    public void Configure(EntityTypeBuilder<SmeSubscription> entity)
    {
        entity.ToTable("sme_subscriptions");
        entity.HasKey(subscription => subscription.Id);
        entity.HasIndex(subscription => new { subscription.SmeProfileId, subscription.Status });

        entity.Property(subscription => subscription.Id).HasColumnName("id");
        entity.Property(subscription => subscription.SmeProfileId).HasColumnName("sme_profile_id").IsRequired();
        entity.Property(subscription => subscription.SubscriptionPlanId).HasColumnName("subscription_plan_id").IsRequired();
        entity.Property(subscription => subscription.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("ACTIVE").IsRequired();
        entity.Property(subscription => subscription.StartedAt).HasColumnName("started_at").IsRequired();
        entity.Property(subscription => subscription.CurrentPeriodEnd).HasColumnName("current_period_end");
        entity.Property(subscription => subscription.CancelledAt).HasColumnName("cancelled_at");
        entity.Property(subscription => subscription.CreatedAt).HasColumnName("created_at").IsRequired();

        entity.HasOne<SmeProfile>().WithMany().HasForeignKey(subscription => subscription.SmeProfileId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<SubscriptionPlan>().WithMany().HasForeignKey(subscription => subscription.SubscriptionPlanId).OnDelete(DeleteBehavior.Restrict);
    }
}