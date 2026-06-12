namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class StudentPortfolioItemSkillConfiguration : IEntityTypeConfiguration<StudentPortfolioItemSkill>
{
    public void Configure(EntityTypeBuilder<StudentPortfolioItemSkill> entity)
    {
        entity.ToTable("student_portfolio_item_skills");
        entity.HasKey(item => item.Id);
        entity.HasIndex(item => new { item.PortfolioItemId, item.StudentSkillId }).IsUnique();

        entity.Property(item => item.Id).HasColumnName("id");
        entity.Property(item => item.PortfolioItemId).HasColumnName("portfolio_item_id").IsRequired();
        entity.Property(item => item.StudentSkillId).HasColumnName("student_skill_id").IsRequired();
        entity.Property(item => item.DisplayOrder).HasColumnName("display_order").HasDefaultValue(0).IsRequired();
        entity.Property(item => item.CreatedAt).HasColumnName("created_at").IsRequired();

        entity.HasOne<StudentPortfolioItem>().WithMany().HasForeignKey(item => item.PortfolioItemId).OnDelete(DeleteBehavior.Cascade);
        entity.HasOne<StudentSkill>().WithMany().HasForeignKey(item => item.StudentSkillId).OnDelete(DeleteBehavior.Cascade);
    }
}
