namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class SmeProfileConfiguration : IEntityTypeConfiguration<SmeProfile>
{
    public void Configure(EntityTypeBuilder<SmeProfile> entity)
    {
        entity.ToTable("sme_profiles");
        entity.HasKey(profile => profile.Id);
        entity.HasIndex(profile => profile.UserId).IsUnique();

        entity.Property(profile => profile.Id).HasColumnName("id");
        entity.Property(profile => profile.UserId).HasColumnName("user_id").IsRequired();
        entity.Property(profile => profile.CompanyName).HasColumnName("company_name").HasMaxLength(255).IsRequired();
        entity.Property(profile => profile.RepresentativeName).HasColumnName("representative_name").HasMaxLength(255).IsRequired();
        entity.Property(profile => profile.PhoneNumber).HasColumnName("phone_number").HasMaxLength(50).IsRequired();
        entity.Property(profile => profile.BusinessField).HasColumnName("business_field").HasMaxLength(255).IsRequired();
        entity.Property(profile => profile.LogoFileId).HasColumnName("logo_file_id");
        entity.Property(profile => profile.OnboardingStatus).HasColumnName("onboarding_status").HasMaxLength(50).HasDefaultValue("INCOMPLETE").IsRequired();
        entity.Property(profile => profile.AverageRating).HasColumnName("average_rating").HasPrecision(3, 2).HasDefaultValue(0m).IsRequired();
        entity.Property(profile => profile.CompletedProjectsCount).HasColumnName("completed_projects_count").HasDefaultValue(0).IsRequired();
        entity.Property(profile => profile.ActiveOpenProjectCount).HasColumnName("active_open_project_count").HasDefaultValue(0).IsRequired();
        entity.Property(profile => profile.CreatedAt).HasColumnName("created_at").IsRequired();
        entity.Property(profile => profile.UpdatedAt).HasColumnName("updated_at").IsRequired();

        entity.HasOne<User>().WithOne().HasForeignKey<SmeProfile>(profile => profile.UserId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<FileAsset>().WithMany().HasForeignKey(profile => profile.LogoFileId).OnDelete(DeleteBehavior.Restrict);
    }
}