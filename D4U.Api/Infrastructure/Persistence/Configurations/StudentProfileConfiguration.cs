namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class StudentProfileConfiguration : IEntityTypeConfiguration<StudentProfile>
{
    public void Configure(EntityTypeBuilder<StudentProfile> entity)
    {
        entity.ToTable("student_profiles");
        entity.HasKey(profile => profile.Id);
        entity.HasIndex(profile => profile.UserId).IsUnique();
        entity.HasIndex(profile => profile.VerificationStatus);
        entity.HasIndex(profile => profile.AverageRating);

        entity.Property(profile => profile.Id).HasColumnName("id");
        entity.Property(profile => profile.UserId).HasColumnName("user_id").IsRequired();
        entity.Property(profile => profile.School).HasColumnName("school").HasMaxLength(255).IsRequired();
        entity.Property(profile => profile.Major).HasColumnName("major").HasMaxLength(255).IsRequired();
        entity.Property(profile => profile.StudyStartYear).HasColumnName("study_start_year").IsRequired();
        entity.Property(profile => profile.Bio).HasColumnName("bio");
        entity.Property(profile => profile.OnboardingStatus).HasColumnName("onboarding_status").HasMaxLength(50).HasDefaultValue("INCOMPLETE").IsRequired();
        entity.Property(profile => profile.VerificationStatus).HasColumnName("verification_status").HasMaxLength(50).HasDefaultValue("NOT_SUBMITTED").IsRequired();
        entity.Property(profile => profile.AverageRating).HasColumnName("average_rating").HasPrecision(3, 2).HasDefaultValue(0m).IsRequired();
        entity.Property(profile => profile.CompletedProjectsCount).HasColumnName("completed_projects_count").HasDefaultValue(0).IsRequired();
        entity.Property(profile => profile.CanWithdraw).HasColumnName("can_withdraw").HasDefaultValue(false).IsRequired();
        entity.Property(profile => profile.CreatedAt).HasColumnName("created_at").IsRequired();
        entity.Property(profile => profile.UpdatedAt).HasColumnName("updated_at").IsRequired();

        entity.HasOne<User>().WithOne().HasForeignKey<StudentProfile>(profile => profile.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}