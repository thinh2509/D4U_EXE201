namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class EscrowConfiguration : IEntityTypeConfiguration<Escrow>
{
    public void Configure(EntityTypeBuilder<Escrow> entity)
    {
        entity.ToTable("escrows");
        entity.HasKey(escrow => escrow.Id);
        entity.HasIndex(escrow => escrow.ProjectId).IsUnique();
        entity.HasIndex(escrow => escrow.Status);
        entity.HasIndex(escrow => new { escrow.SmeProfileId, escrow.Status });
        entity.HasIndex(escrow => new { escrow.StudentProfileId, escrow.Status });

        entity.Property(escrow => escrow.Id).HasColumnName("id");
        entity.Property(escrow => escrow.ProjectId).HasColumnName("project_id").IsRequired();
        entity.Property(escrow => escrow.SmeProfileId).HasColumnName("sme_profile_id").IsRequired();
        entity.Property(escrow => escrow.StudentProfileId).HasColumnName("student_profile_id").IsRequired();
        entity.Property(escrow => escrow.Amount).HasColumnName("amount").HasPrecision(12, 2).IsRequired();
        entity.Property(escrow => escrow.Currency).HasColumnName("currency").HasMaxLength(3).HasDefaultValue("VND").IsFixedLength().IsRequired();
        entity.Property(escrow => escrow.PlatformFeeRate).HasColumnName("platform_fee_rate").HasPrecision(5, 2).IsRequired();
        entity.Property(escrow => escrow.PlatformFeeAmount).HasColumnName("platform_fee_amount").HasPrecision(12, 2);
        entity.Property(escrow => escrow.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(40).HasDefaultValue(EscrowStatus.PENDING_PAYMENT).IsRequired();
        entity.Property(escrow => escrow.FundedAt).HasColumnName("funded_at");
        entity.Property(escrow => escrow.ReleasedAt).HasColumnName("released_at");
        entity.Property(escrow => escrow.RefundedAt).HasColumnName("refunded_at");
        entity.Property(escrow => escrow.CreatedAt).HasColumnName("created_at").IsRequired();
        entity.Property(escrow => escrow.UpdatedAt).HasColumnName("updated_at").IsRequired();

        entity.HasOne<Project>().WithOne().HasForeignKey<Escrow>(escrow => escrow.ProjectId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<SmeProfile>().WithMany().HasForeignKey(escrow => escrow.SmeProfileId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<StudentProfile>().WithMany().HasForeignKey(escrow => escrow.StudentProfileId).OnDelete(DeleteBehavior.Restrict);
    }
}