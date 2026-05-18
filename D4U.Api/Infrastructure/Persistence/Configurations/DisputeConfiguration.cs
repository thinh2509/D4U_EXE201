namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class DisputeConfiguration : IEntityTypeConfiguration<Dispute>
{
    public void Configure(EntityTypeBuilder<Dispute> entity)
    {
        entity.ToTable("disputes");
        entity.HasKey(dispute => dispute.Id);
        entity.HasIndex(dispute => new { dispute.ProjectId, dispute.Status });
        entity.HasIndex(dispute => new { dispute.AssignedAdminId, dispute.Status });

        entity.Property(dispute => dispute.Id).HasColumnName("id");
        entity.Property(dispute => dispute.ProjectId).HasColumnName("project_id").IsRequired();
        entity.Property(dispute => dispute.EscrowId).HasColumnName("escrow_id");
        entity.Property(dispute => dispute.OpenedByUserId).HasColumnName("opened_by_user_id").IsRequired();
        entity.Property(dispute => dispute.AgainstUserId).HasColumnName("against_user_id");
        entity.Property(dispute => dispute.ReasonCode).HasColumnName("reason_code").HasMaxLength(50).IsRequired();
        entity.Property(dispute => dispute.Description).HasColumnName("description").IsRequired();
        entity.Property(dispute => dispute.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(30).HasDefaultValue(DisputeStatus.OPEN).IsRequired();
        entity.Property(dispute => dispute.AssignedAdminId).HasColumnName("assigned_admin_id");
        entity.Property(dispute => dispute.DecisionType).HasColumnName("decision_type").HasMaxLength(50);
        entity.Property(dispute => dispute.SmeRefundAmount).HasColumnName("sme_refund_amount").HasPrecision(12, 2).HasDefaultValue(0m).IsRequired();
        entity.Property(dispute => dispute.StudentPayoutAmount).HasColumnName("student_payout_amount").HasPrecision(12, 2).HasDefaultValue(0m).IsRequired();
        entity.Property(dispute => dispute.PlatformFeeAmount).HasColumnName("platform_fee_amount").HasPrecision(12, 2).HasDefaultValue(0m).IsRequired();
        entity.Property(dispute => dispute.DecisionRationale).HasColumnName("decision_rationale");
        entity.Property(dispute => dispute.OpenedAt).HasColumnName("opened_at").IsRequired();
        entity.Property(dispute => dispute.ResolvedAt).HasColumnName("resolved_at");

        entity.HasOne<Project>().WithMany().HasForeignKey(dispute => dispute.ProjectId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<Escrow>().WithMany().HasForeignKey(dispute => dispute.EscrowId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<User>().WithMany().HasForeignKey(dispute => dispute.OpenedByUserId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<User>().WithMany().HasForeignKey(dispute => dispute.AgainstUserId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<User>().WithMany().HasForeignKey(dispute => dispute.AssignedAdminId).OnDelete(DeleteBehavior.Restrict);
    }
}