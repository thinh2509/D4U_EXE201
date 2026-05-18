namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class DisputeEvidenceConfiguration : IEntityTypeConfiguration<DisputeEvidence>
{
    public void Configure(EntityTypeBuilder<DisputeEvidence> entity)
    {
        entity.ToTable("dispute_evidences");
        entity.HasKey(evidence => evidence.Id);

        entity.Property(evidence => evidence.Id).HasColumnName("id");
        entity.Property(evidence => evidence.DisputeId).HasColumnName("dispute_id").IsRequired();
        entity.Property(evidence => evidence.SubmittedByUserId).HasColumnName("submitted_by_user_id").IsRequired();
        entity.Property(evidence => evidence.FileId).HasColumnName("file_id");
        entity.Property(evidence => evidence.Comment).HasColumnName("comment");
        entity.Property(evidence => evidence.CreatedAt).HasColumnName("created_at").IsRequired();

        entity.HasOne<Dispute>().WithMany().HasForeignKey(evidence => evidence.DisputeId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<User>().WithMany().HasForeignKey(evidence => evidence.SubmittedByUserId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<FileAsset>().WithMany().HasForeignKey(evidence => evidence.FileId).OnDelete(DeleteBehavior.Restrict);
    }
}