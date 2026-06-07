namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class UserEmailVerificationConfiguration : IEntityTypeConfiguration<UserEmailVerification>
{
    public void Configure(EntityTypeBuilder<UserEmailVerification> entity)
    {
        entity.ToTable("user_email_verifications");
        entity.HasKey(verification => verification.Id);
        entity.HasIndex(verification => new { verification.UserId, verification.Status });
        entity.HasIndex(verification => new { verification.Email, verification.Status });

        entity.Property(verification => verification.Id).HasColumnName("id");
        entity.Property(verification => verification.UserId).HasColumnName("user_id").IsRequired();
        entity.Property(verification => verification.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
        entity.Property(verification => verification.CodeHash).HasColumnName("code_hash").HasMaxLength(255).IsRequired();
        entity.Property(verification => verification.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("PENDING").IsRequired();
        entity.Property(verification => verification.RequestedAt).HasColumnName("requested_at").IsRequired();
        entity.Property(verification => verification.ExpiresAt).HasColumnName("expires_at").IsRequired();
        entity.Property(verification => verification.ConfirmedAt).HasColumnName("confirmed_at");

        entity.HasOne<User>().WithMany().HasForeignKey(verification => verification.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}
