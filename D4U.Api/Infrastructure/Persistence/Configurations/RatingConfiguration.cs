namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class RatingConfiguration : IEntityTypeConfiguration<Rating>
{
    public void Configure(EntityTypeBuilder<Rating> entity)
    {
        entity.ToTable("ratings");
        entity.HasKey(rating => rating.Id);
        entity.HasIndex(rating => new { rating.ProjectId, rating.RaterUserId, rating.RatedUserId }).IsUnique();
        entity.HasIndex(rating => new { rating.RatedUserId, rating.CreatedAt });

        entity.Property(rating => rating.Id).HasColumnName("id");
        entity.Property(rating => rating.ProjectId).HasColumnName("project_id").IsRequired();
        entity.Property(rating => rating.RaterUserId).HasColumnName("rater_user_id").IsRequired();
        entity.Property(rating => rating.RatedUserId).HasColumnName("rated_user_id").IsRequired();
        entity.Property(rating => rating.RatingValue).HasColumnName("rating_value").IsRequired();
        entity.Property(rating => rating.Comment).HasColumnName("comment").HasMaxLength(500);
        entity.Property(rating => rating.IsPublic).HasColumnName("is_public").HasDefaultValue(false).IsRequired();
        entity.Property(rating => rating.CreatedAt).HasColumnName("created_at").IsRequired();
        entity.ToTable(table => table.HasCheckConstraint("ck_ratings_rating_value", "rating_value between 1 and 5"));

        entity.HasOne<Project>().WithMany().HasForeignKey(rating => rating.ProjectId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<User>().WithMany().HasForeignKey(rating => rating.RaterUserId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<User>().WithMany().HasForeignKey(rating => rating.RatedUserId).OnDelete(DeleteBehavior.Restrict);
    }
}