namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class ProjectApplicationConfiguration : IEntityTypeConfiguration<ProjectApplication>
{
    public void Configure(EntityTypeBuilder<ProjectApplication> entity)
    {
        entity.ToTable("project_applications");
        entity.HasKey(application => application.Id);
        entity.HasIndex(application => new { application.ProjectId, application.StudentProfileId }).IsUnique();
        entity.HasIndex(application => new { application.ProjectId, application.Status });
        entity.HasIndex(application => new { application.StudentProfileId, application.Status });

        entity.Property(application => application.Id).HasColumnName("id");
        entity.Property(application => application.ProjectId).HasColumnName("project_id").IsRequired();
        entity.Property(application => application.StudentProfileId).HasColumnName("student_profile_id").IsRequired();
        entity.Property(application => application.ProposedPrice).HasColumnName("proposed_price").HasPrecision(12, 2).IsRequired();
        entity.Property(application => application.CoverLetter).HasColumnName("cover_letter").IsRequired();
        entity.Property(application => application.EstimatedDurationDays).HasColumnName("estimated_duration_days");
        entity.Property(application => application.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("SUBMITTED").IsRequired();
        entity.Property(application => application.SubmittedAt).HasColumnName("submitted_at").IsRequired();
        entity.Property(application => application.UpdatedAt).HasColumnName("updated_at").IsRequired();

        entity.HasOne<Project>().WithMany().HasForeignKey(application => application.ProjectId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<StudentProfile>().WithMany().HasForeignKey(application => application.StudentProfileId).OnDelete(DeleteBehavior.Restrict);
    }
}