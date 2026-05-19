namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class ProjectStatusHistoryConfiguration : IEntityTypeConfiguration<ProjectStatusHistory>
{
    public void Configure(EntityTypeBuilder<ProjectStatusHistory> entity)
    {
        entity.ToTable("project_status_histories");
        entity.HasKey(history => history.Id);

        entity.Property(history => history.Id).HasColumnName("id");
        entity.Property(history => history.ProjectId).HasColumnName("project_id").IsRequired();
        entity.Property(history => history.FromStatus).HasColumnName("from_status").HasConversion<string>().HasMaxLength(40);
        entity.Property(history => history.ToStatus).HasColumnName("to_status").HasConversion<string>().HasMaxLength(40).IsRequired();
        entity.Property(history => history.ChangedByUserId).HasColumnName("changed_by_user_id");
        entity.Property(history => history.ChangeReason).HasColumnName("change_reason");
        entity.Property(history => history.MetadataJson).HasColumnName("metadata_json").HasColumnType("jsonb");
        entity.Property(history => history.CreatedAt).HasColumnName("created_at").IsRequired();

        entity.HasOne<Project>().WithMany().HasForeignKey(history => history.ProjectId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<User>().WithMany().HasForeignKey(history => history.ChangedByUserId).OnDelete(DeleteBehavior.Restrict);
    }
}