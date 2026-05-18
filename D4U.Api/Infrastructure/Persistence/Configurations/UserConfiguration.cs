namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> entity)
    {
        entity.ToTable("users");
        entity.HasKey(user => user.Id);
        entity.HasIndex(user => user.Email).IsUnique();
        entity.HasIndex(user => user.Username).IsUnique();
        entity.HasIndex(user => new { user.Role, user.Status });

        entity.Property(user => user.Id).HasColumnName("id");
        entity.Property(user => user.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
        entity.Property(user => user.Username).HasColumnName("username").HasMaxLength(100).IsRequired();
        entity.Property(user => user.PasswordHash).HasColumnName("password_hash").HasMaxLength(255).IsRequired();
        entity.Property(user => user.FullName).HasColumnName("full_name").HasMaxLength(255).IsRequired();
        entity.Property(user => user.AvatarUrl).HasColumnName("avatar_url");
        entity.Property(user => user.Role).HasColumnName("role").HasConversion<string>().HasMaxLength(30).IsRequired();
        entity.Property(user => user.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(30).HasDefaultValue(UserStatus.PENDING).IsRequired();
        entity.Property(user => user.EmailVerifiedAt).HasColumnName("email_verified_at");
        entity.Property(user => user.LastLoginAt).HasColumnName("last_login_at");
        entity.Property(user => user.CreatedAt).HasColumnName("created_at").IsRequired();
        entity.Property(user => user.UpdatedAt).HasColumnName("updated_at").IsRequired();
    }
}