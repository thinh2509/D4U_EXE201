namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class InvalidFileReportConfiguration : IEntityTypeConfiguration<InvalidFileReport>
{
    public void Configure(EntityTypeBuilder<InvalidFileReport> entity)
    {
        entity.ToTable("invalid_file_reports");
        entity.HasKey(report => report.Id);

        entity.Property(report => report.Id).HasColumnName("id");
        entity.Property(report => report.ProjectId).HasColumnName("project_id").IsRequired();
        entity.Property(report => report.SubmissionId).HasColumnName("submission_id").IsRequired();
        entity.Property(report => report.ReportedByUserId).HasColumnName("reported_by_user_id").IsRequired();
        entity.Property(report => report.ReasonCode).HasColumnName("reason_code").HasConversion<string>().HasMaxLength(40).IsRequired();
        entity.Property(report => report.Description).HasColumnName("description");
        entity.Property(report => report.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("OPEN").IsRequired();
        entity.Property(report => report.ReuploadDueAt).HasColumnName("reupload_due_at").IsRequired();
        entity.Property(report => report.ResolvedAt).HasColumnName("resolved_at");
        entity.Property(report => report.CreatedAt).HasColumnName("created_at").IsRequired();

        entity.HasOne<Project>().WithMany().HasForeignKey(report => report.ProjectId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<ProjectSubmission>().WithMany().HasForeignKey(report => report.SubmissionId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<User>().WithMany().HasForeignKey(report => report.ReportedByUserId).OnDelete(DeleteBehavior.Restrict);
    }
}