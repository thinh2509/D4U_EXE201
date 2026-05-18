namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class SubmissionFileConfiguration : IEntityTypeConfiguration<SubmissionFile>
{
    public void Configure(EntityTypeBuilder<SubmissionFile> entity)
    {
        entity.ToTable("submission_files");
        entity.HasKey(file => file.Id);

        entity.Property(file => file.Id).HasColumnName("id");
        entity.Property(file => file.SubmissionId).HasColumnName("submission_id").IsRequired();
        entity.Property(file => file.FileId).HasColumnName("file_id").IsRequired();
        entity.Property(file => file.WatermarkedFileId).HasColumnName("watermarked_file_id");
        entity.Property(file => file.IsOriginalDownloadable).HasColumnName("is_original_downloadable").HasDefaultValue(false).IsRequired();
        entity.Property(file => file.CreatedAt).HasColumnName("created_at").IsRequired();

        entity.HasOne<ProjectSubmission>().WithMany().HasForeignKey(file => file.SubmissionId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<FileAsset>().WithMany().HasForeignKey(file => file.FileId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<FileAsset>().WithMany().HasForeignKey(file => file.WatermarkedFileId).OnDelete(DeleteBehavior.Restrict);
    }
}