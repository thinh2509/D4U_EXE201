namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Application.Features.FeaturePackages;
using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class FeaturePackageConfiguration : IEntityTypeConfiguration<FeaturePackage>
{
    public void Configure(EntityTypeBuilder<FeaturePackage> entity)
    {
        entity.ToTable("feature_packages");
        entity.HasKey(value => value.Id);
        entity.HasIndex(value => value.Code).IsUnique();
        entity.HasIndex(value => new { value.Role, value.IsActive });

        entity.Property(value => value.Id).HasColumnName("id");
        entity.Property(value => value.Role).HasColumnName("role").HasConversion<string>().HasMaxLength(20).IsRequired();
        entity.Property(value => value.Code).HasColumnName("code").HasMaxLength(80).IsRequired();
        entity.Property(value => value.Name).HasColumnName("name").HasMaxLength(120).IsRequired();
        entity.Property(value => value.Description).HasColumnName("description").IsRequired();
        entity.Property(value => value.Price).HasColumnName("price").HasPrecision(12, 2).IsRequired();
        entity.Property(value => value.Currency).HasColumnName("currency").HasMaxLength(3).HasDefaultValue("VND").IsFixedLength().IsRequired();
        entity.Property(value => value.DurationDays).HasColumnName("duration_days").IsRequired();
        entity.Property(value => value.EntitlementCode).HasColumnName("entitlement_code").HasMaxLength(80).IsRequired();
        entity.Property(value => value.UsageLimit).HasColumnName("usage_limit");
        entity.Property(value => value.MaxActiveOpenProjectsOverride).HasColumnName("max_active_open_projects_override");
        entity.Property(value => value.IsActive).HasColumnName("is_active").HasDefaultValue(true).IsRequired();
        entity.Property(value => value.CreatedAt).HasColumnName("created_at").IsRequired();
        entity.Property(value => value.UpdatedAt).HasColumnName("updated_at").IsRequired();

        var now = new DateTimeOffset(2026, 06, 12, 0, 0, 0, TimeSpan.Zero);
        entity.HasData(
            new FeaturePackage
            {
                Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                Role = FeaturePackageRole.SME,
                Code = "SME_GROWTH_30D",
                Name = "SME AI Boost 30 ngày",
                Description = "Mo khoa AI Matching va nang gioi han toi da 10 du an dang mo cho SME trong 30 ngay.",
                Price = 99_000m,
                Currency = "VND",
                DurationDays = 30,
                EntitlementCode = FeatureEntitlementCodes.SmeAiMatching,
                UsageLimit = null,
                MaxActiveOpenProjectsOverride = 10,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            },
            new FeaturePackage
            {
                Id = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                Role = FeaturePackageRole.STUDENT,
                Code = "STUDENT_AI_MATCHING_30D",
                Name = "Student AI Matching 30 ngày",
                Description = "Mo khoa AI Matching va AI Proposal Writer cho Student trong 30 ngay.",
                Price = 59_000m,
                Currency = "VND",
                DurationDays = 30,
                EntitlementCode = FeatureEntitlementCodes.StudentAiMatching,
                UsageLimit = 30,
                MaxActiveOpenProjectsOverride = null,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now
            });
    }
}
