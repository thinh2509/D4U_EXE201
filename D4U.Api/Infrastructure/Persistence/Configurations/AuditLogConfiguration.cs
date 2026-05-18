namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> entity)
    {
        entity.ToTable("audit_logs");
        entity.HasKey(log => log.Id);
        entity.HasIndex(log => new { log.ActorUserId, log.CreatedAt });
        entity.HasIndex(log => new { log.EntityType, log.EntityId });
        entity.HasIndex(log => new { log.Action, log.CreatedAt });

        entity.Property(log => log.Id).HasColumnName("id");
        entity.Property(log => log.ActorUserId).HasColumnName("actor_user_id");
        entity.Property(log => log.Action).HasColumnName("action").HasMaxLength(100).IsRequired();
        entity.Property(log => log.EntityType).HasColumnName("entity_type").HasMaxLength(100).IsRequired();
        entity.Property(log => log.EntityId).HasColumnName("entity_id");
        entity.Property(log => log.BeforeJson).HasColumnName("before_json").HasColumnType("jsonb");
        entity.Property(log => log.AfterJson).HasColumnName("after_json").HasColumnType("jsonb");
        entity.Property(log => log.IpAddress).HasColumnName("ip_address").HasMaxLength(64);
        entity.Property(log => log.UserAgent).HasColumnName("user_agent");
        entity.Property(log => log.CreatedAt).HasColumnName("created_at").IsRequired();

        entity.HasOne<User>().WithMany().HasForeignKey(log => log.ActorUserId).OnDelete(DeleteBehavior.Restrict);
    }
}