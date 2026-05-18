namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class UserSessionConfiguration : IEntityTypeConfiguration<UserSession>
{
    public void Configure(EntityTypeBuilder<UserSession> entity)
    {
        entity.ToTable("user_sessions");
        entity.HasKey(session => session.Id);

        entity.Property(session => session.Id).HasColumnName("id");
        entity.Property(session => session.UserId).HasColumnName("user_id").IsRequired();
        entity.Property(session => session.RefreshTokenHash).HasColumnName("refresh_token_hash").HasMaxLength(255).IsRequired();
        entity.Property(session => session.DeviceInfo).HasColumnName("device_info");
        entity.Property(session => session.IpAddress).HasColumnName("ip_address").HasMaxLength(64);
        entity.Property(session => session.ExpiresAt).HasColumnName("expires_at").IsRequired();
        entity.Property(session => session.RevokedAt).HasColumnName("revoked_at");
        entity.Property(session => session.CreatedAt).HasColumnName("created_at").IsRequired();

        entity.HasOne<User>().WithMany().HasForeignKey(session => session.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}