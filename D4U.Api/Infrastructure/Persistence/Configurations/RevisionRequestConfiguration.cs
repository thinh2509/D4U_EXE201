namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class RevisionRequestConfiguration : IEntityTypeConfiguration<RevisionRequest>
{
    public void Configure(EntityTypeBuilder<RevisionRequest> entity)
    {
        entity.ToTable("revision_requests");
        entity.HasKey(request => request.Id);
        entity.HasIndex(request => new { request.ProjectId, request.Status });
        entity.HasIndex(request => new { request.ProjectId, request.RevisionRound, request.SubmissionId }).IsUnique();

        entity.Property(request => request.Id).HasColumnName("id");
        entity.Property(request => request.ProjectId).HasColumnName("project_id").IsRequired();
        entity.Property(request => request.SubmissionId).HasColumnName("submission_id").IsRequired();
        entity.Property(request => request.RequestedByUserId).HasColumnName("requested_by_user_id").IsRequired();
        entity.Property(request => request.RevisionRound).HasColumnName("revision_round").IsRequired();
        entity.Property(request => request.RequestedChanges).HasColumnName("requested_changes").IsRequired();
        entity.Property(request => request.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("OPEN").IsRequired();
        entity.Property(request => request.DueAt).HasColumnName("due_at").IsRequired();
        entity.Property(request => request.ResolvedAt).HasColumnName("resolved_at");
        entity.Property(request => request.CreatedAt).HasColumnName("created_at").IsRequired();

        entity.HasOne<Project>().WithMany().HasForeignKey(request => request.ProjectId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<ProjectSubmission>().WithMany().HasForeignKey(request => request.SubmissionId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<User>().WithMany().HasForeignKey(request => request.RequestedByUserId).OnDelete(DeleteBehavior.Restrict);
    }
}