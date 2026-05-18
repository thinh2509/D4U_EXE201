namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class ReviewActionConfiguration : IEntityTypeConfiguration<ReviewAction>
{
    public void Configure(EntityTypeBuilder<ReviewAction> entity)
    {
        entity.ToTable("review_actions");
        entity.HasKey(action => action.Id);

        entity.Property(action => action.Id).HasColumnName("id");
        entity.Property(action => action.ProjectId).HasColumnName("project_id").IsRequired();
        entity.Property(action => action.SubmissionId).HasColumnName("submission_id").IsRequired();
        entity.Property(action => action.ReviewerUserId).HasColumnName("reviewer_user_id");
        entity.Property(action => action.Action).HasColumnName("action").HasConversion<string>().HasMaxLength(40).IsRequired();
        entity.Property(action => action.Comment).HasColumnName("comment");
        entity.Property(action => action.CreatedAt).HasColumnName("created_at").IsRequired();

        entity.HasOne<Project>().WithMany().HasForeignKey(action => action.ProjectId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<ProjectSubmission>().WithMany().HasForeignKey(action => action.SubmissionId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<User>().WithMany().HasForeignKey(action => action.ReviewerUserId).OnDelete(DeleteBehavior.Restrict);
    }
}