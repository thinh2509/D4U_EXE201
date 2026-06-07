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
        entity.HasIndex(action => new { action.ProjectId, action.Action });
        entity.HasIndex(action => new { action.SubmissionId, action.Action });
        entity.HasIndex(action => new { action.ProjectId, action.RevisionRound });

        entity.Property(action => action.Id).HasColumnName("id");
        entity.Property(action => action.ProjectId).HasColumnName("project_id").IsRequired();
        entity.Property(action => action.SubmissionId).HasColumnName("submission_id").IsRequired();
        entity.Property(action => action.ReviewerUserId).HasColumnName("reviewer_user_id");
        entity.Property(action => action.Action).HasColumnName("action").HasConversion<string>().HasMaxLength(40).IsRequired();
        entity.Property(action => action.Comment).HasColumnName("comment");
        entity.Property(action => action.RequestedChanges).HasColumnName("requested_changes");
        entity.Property(action => action.RevisionRound).HasColumnName("revision_round");
        entity.Property(action => action.DueAt).HasColumnName("due_at");
        entity.Property(action => action.InvalidFileReason).HasColumnName("invalid_file_reason").HasConversion<string>().HasMaxLength(40);
        entity.Property(action => action.ReuploadDueAt).HasColumnName("reupload_due_at");
        entity.Property(action => action.ResolvedAt).HasColumnName("resolved_at");
        entity.Property(action => action.MetadataJson).HasColumnName("metadata_json").HasColumnType("jsonb");
        entity.Property(action => action.CreatedAt).HasColumnName("created_at").IsRequired();

        entity.HasOne<Project>().WithMany().HasForeignKey(action => action.ProjectId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<ProjectSubmission>().WithMany().HasForeignKey(action => action.SubmissionId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<User>().WithMany().HasForeignKey(action => action.ReviewerUserId).OnDelete(DeleteBehavior.Restrict);
    }
}
