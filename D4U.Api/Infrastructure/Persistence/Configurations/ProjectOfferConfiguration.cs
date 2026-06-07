namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class ProjectOfferConfiguration : IEntityTypeConfiguration<ProjectOffer>
{
    public void Configure(EntityTypeBuilder<ProjectOffer> entity)
    {
        entity.ToTable("project_offers");
        entity.HasKey(offer => offer.Id);
        entity.HasIndex(offer => new { offer.ProjectId, offer.Status });
        entity.HasIndex(offer => new { offer.StudentProfileId, offer.Status });

        entity.Property(offer => offer.Id).HasColumnName("id");
        entity.Property(offer => offer.ProjectId).HasColumnName("project_id").IsRequired();
        entity.Property(offer => offer.StudentProfileId).HasColumnName("student_profile_id").IsRequired();
        entity.Property(offer => offer.ApplicationId).HasColumnName("application_id");
        entity.Property(offer => offer.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(40).HasDefaultValue(OfferStatus.WAITING_ACCEPTANCE).IsRequired();
        entity.Property(offer => offer.OfferedAmount).HasColumnName("offered_amount").HasPrecision(12, 2).IsRequired();
        entity.Property(offer => offer.ExpiresAt).HasColumnName("expires_at");
        entity.Property(offer => offer.PaymentDueAt).HasColumnName("payment_due_at");
        entity.Property(offer => offer.AcceptedAt).HasColumnName("accepted_at");
        entity.Property(offer => offer.RejectedAt).HasColumnName("rejected_at");
        entity.Property(offer => offer.ExpiredAt).HasColumnName("expired_at");
        entity.Property(offer => offer.CreatedAt).HasColumnName("created_at").IsRequired();

        entity.HasOne<Project>().WithMany().HasForeignKey(offer => offer.ProjectId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<StudentProfile>().WithMany().HasForeignKey(offer => offer.StudentProfileId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<ProjectApplication>().WithMany().HasForeignKey(offer => offer.ApplicationId).OnDelete(DeleteBehavior.Restrict);
    }
}
