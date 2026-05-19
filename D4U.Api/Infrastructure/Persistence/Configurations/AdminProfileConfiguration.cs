namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class AdminProfileConfiguration : IEntityTypeConfiguration<AdminProfile>
{
    public void Configure(EntityTypeBuilder<AdminProfile> entity)
    {
        entity.ToTable("admin_profiles");
        entity.HasKey(profile => profile.Id);
        entity.HasIndex(profile => profile.UserId).IsUnique();

        entity.Property(profile => profile.Id).HasColumnName("id");
        entity.Property(profile => profile.UserId).HasColumnName("user_id").IsRequired();
        entity.Property(profile => profile.PermissionLevel).HasColumnName("permission_level").HasMaxLength(50).IsRequired();
        entity.Property(profile => profile.CreatedAt).HasColumnName("created_at").IsRequired();

        entity.HasOne<User>().WithOne().HasForeignKey<AdminProfile>(profile => profile.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}