namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class FileAssetConfiguration : IEntityTypeConfiguration<FileAsset>
{
    public void Configure(EntityTypeBuilder<FileAsset> entity)
    {
        entity.ToTable("files");
        entity.HasKey(file => file.Id);
        entity.HasIndex(file => new { file.OwnerUserId, file.CreatedAt });
        entity.HasIndex(file => new { file.StorageProvider, file.StorageKey });

        entity.Property(file => file.Id).HasColumnName("id");
        entity.Property(file => file.OwnerUserId).HasColumnName("owner_user_id");
        entity.Property(file => file.StorageProvider).HasColumnName("storage_provider").HasMaxLength(50).IsRequired();
        entity.Property(file => file.Bucket).HasColumnName("bucket").HasMaxLength(255);
        entity.Property(file => file.StorageKey).HasColumnName("storage_key").IsRequired();
        entity.Property(file => file.OriginalFilename).HasColumnName("original_filename").HasMaxLength(255).IsRequired();
        entity.Property(file => file.MimeType).HasColumnName("mime_type").HasMaxLength(100).IsRequired();
        entity.Property(file => file.FileExtension).HasColumnName("file_extension").HasMaxLength(20).IsRequired();
        entity.Property(file => file.FileSizeBytes).HasColumnName("file_size_bytes").IsRequired();
        entity.Property(file => file.Checksum).HasColumnName("checksum").HasMaxLength(128);
        entity.Property(file => file.Visibility).HasColumnName("visibility").HasMaxLength(50).HasDefaultValue("PRIVATE").IsRequired();
        entity.Property(file => file.ScanStatus).HasColumnName("scan_status").HasMaxLength(50);
        entity.Property(file => file.CreatedAt).HasColumnName("created_at").IsRequired();
        entity.Property(file => file.DeletedAt).HasColumnName("deleted_at");

        entity.HasOne<User>().WithMany().HasForeignKey(file => file.OwnerUserId).OnDelete(DeleteBehavior.Restrict);
    }
}