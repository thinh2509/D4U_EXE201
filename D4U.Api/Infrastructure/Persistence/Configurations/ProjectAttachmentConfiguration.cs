namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class ProjectAttachmentConfiguration : IEntityTypeConfiguration<ProjectAttachment>
{
    public void Configure(EntityTypeBuilder<ProjectAttachment> entity)
    {
        entity.ToTable("project_attachments");
        entity.HasKey(attachment => attachment.Id);

        entity.Property(attachment => attachment.Id).HasColumnName("id");
        entity.Property(attachment => attachment.ProjectId).HasColumnName("project_id").IsRequired();
        entity.Property(attachment => attachment.FileId).HasColumnName("file_id").IsRequired();
        entity.Property(attachment => attachment.AttachmentType).HasColumnName("attachment_type").HasMaxLength(50).HasDefaultValue("BRIEF").IsRequired();
        entity.Property(attachment => attachment.CreatedAt).HasColumnName("created_at").IsRequired();

        entity.HasOne<Project>().WithMany().HasForeignKey(attachment => attachment.ProjectId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<FileAsset>().WithMany().HasForeignKey(attachment => attachment.FileId).OnDelete(DeleteBehavior.Restrict);
    }
}