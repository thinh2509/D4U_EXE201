namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class StudentSkillConfiguration : IEntityTypeConfiguration<StudentSkill>
{
    public void Configure(EntityTypeBuilder<StudentSkill> entity)
    {
        entity.ToTable("student_skills");
        entity.HasKey(skill => skill.Id);
        entity.HasIndex(skill => new { skill.StudentProfileId, skill.NormalizedSkillName }).IsUnique();
        entity.HasIndex(skill => new { skill.StudentProfileId, skill.IsHighlighted });

        entity.Property(skill => skill.Id).HasColumnName("id");
        entity.Property(skill => skill.StudentProfileId).HasColumnName("student_profile_id").IsRequired();
        entity.Property(skill => skill.SkillName).HasColumnName("skill_name").HasMaxLength(150).IsRequired();
        entity.Property(skill => skill.NormalizedSkillName).HasColumnName("normalized_skill_name").HasMaxLength(150).IsRequired();
        entity.Property(skill => skill.Level).HasColumnName("level").HasConversion<string>().HasMaxLength(30).IsRequired();
        entity.Property(skill => skill.YearsOfExperience).HasColumnName("years_of_experience");
        entity.Property(skill => skill.ExperienceNote).HasColumnName("experience_note").HasMaxLength(500);
        entity.Property(skill => skill.IsHighlighted).HasColumnName("is_highlighted").HasDefaultValue(false).IsRequired();
        entity.Property(skill => skill.CreatedAt).HasColumnName("created_at").IsRequired();
        entity.Property(skill => skill.UpdatedAt).HasColumnName("updated_at").IsRequired();

        entity.HasOne<StudentProfile>().WithMany().HasForeignKey(skill => skill.StudentProfileId).OnDelete(DeleteBehavior.Cascade);
    }
}
