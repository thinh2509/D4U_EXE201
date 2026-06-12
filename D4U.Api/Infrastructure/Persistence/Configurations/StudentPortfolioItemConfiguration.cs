namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class StudentPortfolioItemConfiguration : IEntityTypeConfiguration<StudentPortfolioItem>
{
    public void Configure(EntityTypeBuilder<StudentPortfolioItem> entity)
    {
        entity.ToTable("student_portfolio_items");
        entity.HasKey(item => item.Id);
        entity.HasIndex(item => new { item.StudentProfileId, item.Status });
        entity.HasIndex(item => new { item.StudentProfileId, item.IsFeatured });
        entity.HasIndex(item => new { item.DesignCategoryId, item.Status });
        entity.HasIndex(item => item.SourceProjectId);

        entity.Property(item => item.Id).HasColumnName("id");
        entity.Property(item => item.StudentProfileId).HasColumnName("student_profile_id").IsRequired();
        entity.Property(item => item.SourceProjectId).HasColumnName("source_project_id");
        entity.Property(item => item.DesignCategoryId).HasColumnName("design_category_id");
        entity.Property(item => item.Title).HasColumnName("title").HasMaxLength(255).IsRequired();
        entity.Property(item => item.Description).HasColumnName("description").HasMaxLength(4000).IsRequired();
        entity.Property(item => item.ThumbnailUrl).HasColumnName("thumbnail_url").HasMaxLength(2000);
        entity.Property(item => item.ProjectUrl).HasColumnName("project_url").HasMaxLength(2000);
        entity.Property(item => item.FileUrl).HasColumnName("file_url").HasMaxLength(2000);
        entity.Property(item => item.CompletedAt).HasColumnName("completed_at");
        entity.Property(item => item.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(30).IsRequired();
        entity.Property(item => item.IsFeatured).HasColumnName("is_featured").HasDefaultValue(false).IsRequired();
        entity.Property(item => item.PublishedAt).HasColumnName("published_at");
        entity.Property(item => item.CreatedAt).HasColumnName("created_at").IsRequired();
        entity.Property(item => item.UpdatedAt).HasColumnName("updated_at").IsRequired();

        entity.HasOne<StudentProfile>().WithMany().HasForeignKey(item => item.StudentProfileId).OnDelete(DeleteBehavior.Cascade);
        entity.HasOne<Project>().WithMany().HasForeignKey(item => item.SourceProjectId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<DesignCategory>().WithMany().HasForeignKey(item => item.DesignCategoryId).OnDelete(DeleteBehavior.Restrict);
    }
}
