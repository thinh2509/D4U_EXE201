namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class UserExternalLoginConfiguration : IEntityTypeConfiguration<UserExternalLogin>
{
    public void Configure(EntityTypeBuilder<UserExternalLogin> entity)
    {
        entity.ToTable("user_external_logins");
        entity.HasKey(login => login.Id);
        entity.HasIndex(login => new { login.Provider, login.ProviderUserId }).IsUnique();
        entity.HasIndex(login => new { login.Provider, login.Email });
        entity.HasIndex(login => login.UserId);

        entity.Property(login => login.Id).HasColumnName("id");
        entity.Property(login => login.UserId).HasColumnName("user_id").IsRequired();
        entity.Property(login => login.Provider).HasColumnName("provider").HasMaxLength(50).IsRequired();
        entity.Property(login => login.ProviderUserId).HasColumnName("provider_user_id").HasMaxLength(255).IsRequired();
        entity.Property(login => login.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
        entity.Property(login => login.CreatedAt).HasColumnName("created_at").IsRequired();
        entity.Property(login => login.UpdatedAt).HasColumnName("updated_at").IsRequired();

        entity.HasOne<User>().WithMany().HasForeignKey(login => login.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}
