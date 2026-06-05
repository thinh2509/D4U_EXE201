namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class SubscriptionPlanConfiguration : IEntityTypeConfiguration<SubscriptionPlan>
{
    public void Configure(EntityTypeBuilder<SubscriptionPlan> entity)
    {
        entity.ToTable("subscription_plans");
        entity.HasKey(plan => plan.Id);
        entity.HasIndex(plan => plan.Code).IsUnique();

        entity.Property(plan => plan.Id).HasColumnName("id");
        entity.Property(plan => plan.Code).HasColumnName("code").HasMaxLength(50).IsRequired();
        entity.Property(plan => plan.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
        entity.Property(plan => plan.MonthlyPrice).HasColumnName("monthly_price").HasPrecision(12, 2).IsRequired();
        entity.Property(plan => plan.PlatformFeeRate).HasColumnName("platform_fee_rate").HasPrecision(5, 2).IsRequired();
        entity.Property(plan => plan.MaxActiveOpenProjects).HasColumnName("max_active_open_projects");
        entity.Property(plan => plan.MaxProjectBudget).HasColumnName("max_project_budget").HasPrecision(12, 2);
        entity.Property(plan => plan.IsActive).HasColumnName("is_active").HasDefaultValue(true).IsRequired();


        entity.HasData(
            new SubscriptionPlan
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Code = "BASIC",
                Name = "Basic",
                MonthlyPrice = 0m,
                PlatformFeeRate = 0.10m,
                MaxActiveOpenProjects = 2,
                MaxProjectBudget = 5_000_000m,
                IsActive = true
            },
            new SubscriptionPlan
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Code = "PRO",
                Name = "Pro",
                MonthlyPrice = 199_000m,
                PlatformFeeRate = 0.07m,
                MaxActiveOpenProjects = 10,
                MaxProjectBudget = 20_000_000m,
                IsActive = true
            },
            new SubscriptionPlan
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                Code = "PREMIUM",
                Name = "Premium",
                MonthlyPrice = 499_000m,
                PlatformFeeRate = 0.05m,
                MaxActiveOpenProjects = null,
                MaxProjectBudget = null,
                IsActive = true
            });
    }
}
