namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class ProjectSubmissionConfiguration : IEntityTypeConfiguration<ProjectSubmission>
{
    public void Configure(EntityTypeBuilder<ProjectSubmission> entity)
    {
        entity.ToTable("project_submissions");
        entity.HasKey(submission => submission.Id);
        entity.HasIndex(submission => new { submission.ProjectId, submission.SubmissionType, submission.RevisionRound });
        entity.HasIndex(submission => new { submission.ProjectId, submission.MilestoneType, submission.Status });
        entity.HasIndex(submission => new { submission.Status, submission.ReviewDueAt });

        entity.Property(submission => submission.Id).HasColumnName("id");
        entity.Property(submission => submission.ProjectId).HasColumnName("project_id").IsRequired();
        entity.Property(submission => submission.SubmittedByStudentId).HasColumnName("submitted_by_student_id").IsRequired();
        entity.Property(submission => submission.SubmissionType).HasColumnName("submission_type").HasConversion<string>().HasMaxLength(20).IsRequired();
        entity.Property(submission => submission.MilestoneType).HasColumnName("milestone_type").HasConversion<string>().HasMaxLength(20).IsRequired();
        entity.Property(submission => submission.RevisionRound).HasColumnName("revision_round").HasDefaultValue(0).IsRequired();
        entity.Property(submission => submission.Description).HasColumnName("description");
        entity.Property(submission => submission.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(40).HasDefaultValue(SubmissionStatus.SUBMITTED).IsRequired();
        entity.Property(submission => submission.SubmittedAt).HasColumnName("submitted_at").IsRequired();
        entity.Property(submission => submission.ReviewDueAt).HasColumnName("review_due_at");
        entity.Property(submission => submission.ApprovedAt).HasColumnName("approved_at");
        entity.Property(submission => submission.AutoApprovedAt).HasColumnName("auto_approved_at");

        entity.HasOne<Project>().WithMany().HasForeignKey(submission => submission.ProjectId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<StudentProfile>().WithMany().HasForeignKey(submission => submission.SubmittedByStudentId).OnDelete(DeleteBehavior.Restrict);
    }
}
