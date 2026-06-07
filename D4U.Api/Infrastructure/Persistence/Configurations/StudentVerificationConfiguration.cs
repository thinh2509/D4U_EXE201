namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class StudentVerificationConfiguration : IEntityTypeConfiguration<StudentVerification>
{
    public void Configure(EntityTypeBuilder<StudentVerification> entity)
    {
        entity.ToTable("student_verifications");
        entity.HasKey(verification => verification.Id);
        entity.HasIndex(verification => new { verification.StudentProfileId, verification.Status });

        entity.Property(verification => verification.Id).HasColumnName("id");
        entity.Property(verification => verification.StudentProfileId).HasColumnName("student_profile_id").IsRequired();
        entity.Property(verification => verification.DocumentFileId).HasColumnName("document_file_id").IsRequired();
        entity.Property(verification => verification.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("PENDING").IsRequired();
        entity.Property(verification => verification.ReviewedByAdminId).HasColumnName("reviewed_by_admin_id");
        entity.Property(verification => verification.RejectionReason).HasColumnName("rejection_reason");
        entity.Property(verification => verification.SubmittedAt).HasColumnName("submitted_at").IsRequired();
        entity.Property(verification => verification.ReviewedAt).HasColumnName("reviewed_at");

        entity.HasOne<StudentProfile>().WithMany().HasForeignKey(verification => verification.StudentProfileId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<FileAsset>().WithMany().HasForeignKey(verification => verification.DocumentFileId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<User>().WithMany().HasForeignKey(verification => verification.ReviewedByAdminId).OnDelete(DeleteBehavior.Restrict);
    }
}