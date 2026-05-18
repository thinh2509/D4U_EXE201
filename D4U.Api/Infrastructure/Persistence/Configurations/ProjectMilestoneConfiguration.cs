namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class ProjectMilestoneConfiguration : IEntityTypeConfiguration<ProjectMilestone>
{
    public void Configure(EntityTypeBuilder<ProjectMilestone> entity)
    {
        entity.ToTable("project_milestones");
        entity.HasKey(milestone => milestone.Id);
        entity.HasIndex(milestone => new { milestone.ProjectId, milestone.MilestoneType }).IsUnique();
        entity.HasIndex(milestone => new { milestone.Status, milestone.DeadlineAt });
        entity.HasIndex(milestone => new { milestone.Status, milestone.ReviewDueAt });

        entity.Property(milestone => milestone.Id).HasColumnName("id");
        entity.Property(milestone => milestone.ProjectId).HasColumnName("project_id").IsRequired();
        entity.Property(milestone => milestone.MilestoneType).HasColumnName("milestone_type").HasConversion<string>().HasMaxLength(20).IsRequired();
        entity.Property(milestone => milestone.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(40).HasDefaultValue(MilestoneStatus.PENDING).IsRequired();
        entity.Property(milestone => milestone.DeadlineAt).HasColumnName("deadline_at").IsRequired();
        entity.Property(milestone => milestone.SubmittedAt).HasColumnName("submitted_at");
        entity.Property(milestone => milestone.ReviewDueAt).HasColumnName("review_due_at");
        entity.Property(milestone => milestone.ApprovedAt).HasColumnName("approved_at");
        entity.Property(milestone => milestone.AutoApprovedAt).HasColumnName("auto_approved_at");
        entity.Property(milestone => milestone.CreatedAt).HasColumnName("created_at").IsRequired();
        entity.Property(milestone => milestone.UpdatedAt).HasColumnName("updated_at").IsRequired();

        entity.HasOne<Project>().WithMany().HasForeignKey(milestone => milestone.ProjectId).OnDelete(DeleteBehavior.Restrict);
    }
}