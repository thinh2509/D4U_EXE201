namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> entity)
    {
        entity.ToTable("notifications");
        entity.HasKey(notification => notification.Id);
        entity.HasIndex(notification => new { notification.RecipientUserId, notification.Status, notification.CreatedAt });
        entity.HasIndex(notification => new { notification.RecipientUserId, notification.Type, notification.ReferenceType, notification.ReferenceId })
            .IsUnique()
            .HasFilter("reference_type IS NOT NULL AND reference_id IS NOT NULL");

        entity.Property(notification => notification.Id).HasColumnName("id");
        entity.Property(notification => notification.RecipientUserId).HasColumnName("recipient_user_id").IsRequired();
        entity.Property(notification => notification.ActorUserId).HasColumnName("actor_user_id");
        entity.Property(notification => notification.Type).HasColumnName("type").HasMaxLength(80).IsRequired();
        entity.Property(notification => notification.Title).HasColumnName("title").HasMaxLength(255).IsRequired();
        entity.Property(notification => notification.Body).HasColumnName("body");
        entity.Property(notification => notification.ReferenceType).HasColumnName("reference_type").HasMaxLength(50);
        entity.Property(notification => notification.ReferenceId).HasColumnName("reference_id");
        entity.Property(notification => notification.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(20).HasDefaultValue(NotificationStatus.UNREAD).IsRequired();
        entity.Property(notification => notification.ReadAt).HasColumnName("read_at");
        entity.Property(notification => notification.CreatedAt).HasColumnName("created_at").IsRequired();

        entity.HasOne<User>().WithMany().HasForeignKey(notification => notification.RecipientUserId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<User>().WithMany().HasForeignKey(notification => notification.ActorUserId).OnDelete(DeleteBehavior.Restrict);
    }
}
