namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> entity)
    {
        entity.ToTable("projects");
        entity.HasKey(project => project.Id);
        entity.HasIndex(project => new { project.Status, project.ProjectType });
        entity.HasIndex(project => new { project.SmeProfileId, project.Status });
        entity.HasIndex(project => new { project.SelectedStudentProfileId, project.Status });
        entity.HasIndex(project => new { project.DesignCategoryId, project.Status });
        entity.HasIndex(project => project.PublishedAt);

        entity.Property(project => project.Id).HasColumnName("id");
        entity.Property(project => project.SmeProfileId).HasColumnName("sme_profile_id").IsRequired();
        entity.Property(project => project.SelectedStudentProfileId).HasColumnName("selected_student_profile_id");
        entity.Property(project => project.DesignCategoryId).HasColumnName("design_category_id").IsRequired();
        entity.Property(project => project.Title).HasColumnName("title").HasMaxLength(255).IsRequired();
        entity.Property(project => project.Brief).HasColumnName("brief").IsRequired();
        entity.Property(project => project.UsagePurpose).HasColumnName("usage_purpose");
        entity.Property(project => project.ProjectType).HasColumnName("project_type").HasConversion<string>().HasMaxLength(30).IsRequired();
        entity.Property(project => project.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(40).HasDefaultValue(ProjectStatus.DRAFT).IsRequired();
        entity.Property(project => project.BudgetAmount).HasColumnName("budget_amount").HasPrecision(12, 2).IsRequired();
        entity.Property(project => project.Currency).HasColumnName("currency").HasMaxLength(3).HasDefaultValue("VND").IsFixedLength().IsRequired();
        entity.Property(project => project.TotalDeadlineAt).HasColumnName("total_deadline_at").IsRequired();
        entity.Property(project => project.SketchDeadlineAt).HasColumnName("sketch_deadline_at").IsRequired();
        entity.Property(project => project.FinalDeadlineAt).HasColumnName("final_deadline_at").IsRequired();
        entity.Property(project => project.MaxRevisionRounds).HasColumnName("max_revision_rounds").HasDefaultValue(2).IsRequired();
        entity.Property(project => project.CurrentRevisionRound).HasColumnName("current_revision_round").HasDefaultValue(0).IsRequired();
        entity.Property(project => project.IsConfidential).HasColumnName("is_confidential").HasDefaultValue(false).IsRequired();
        entity.Property(project => project.AllowStudentPortfolio).HasColumnName("allow_student_portfolio").HasDefaultValue(true).IsRequired();
        entity.Property(project => project.RatingDueAt).HasColumnName("rating_due_at");
        entity.Property(project => project.PublishedAt).HasColumnName("published_at");
        entity.Property(project => project.AcceptedAt).HasColumnName("accepted_at");
        entity.Property(project => project.CompletedAt).HasColumnName("completed_at");
        entity.Property(project => project.CancelledAt).HasColumnName("cancelled_at");
        entity.Property(project => project.CancellationReason).HasColumnName("cancellation_reason");
        entity.Property(project => project.CreatedAt).HasColumnName("created_at").IsRequired();
        entity.Property(project => project.UpdatedAt).HasColumnName("updated_at").IsRequired();

        entity.HasOne<SmeProfile>().WithMany().HasForeignKey(project => project.SmeProfileId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<StudentProfile>().WithMany().HasForeignKey(project => project.SelectedStudentProfileId).OnDelete(DeleteBehavior.Restrict);
        entity.HasOne<DesignCategory>().WithMany().HasForeignKey(project => project.DesignCategoryId).OnDelete(DeleteBehavior.Restrict);
    }
}