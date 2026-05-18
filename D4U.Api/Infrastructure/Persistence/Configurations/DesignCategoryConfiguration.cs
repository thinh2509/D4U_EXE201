namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class DesignCategoryConfiguration : IEntityTypeConfiguration<DesignCategory>
{
    public void Configure(EntityTypeBuilder<DesignCategory> entity)
    {
        entity.ToTable("design_categories");
        entity.HasKey(category => category.Id);
        entity.HasIndex(category => category.Name).IsUnique();

        entity.Property(category => category.Id).HasColumnName("id");
        entity.Property(category => category.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
        entity.Property(category => category.Description).HasColumnName("description");
        entity.Property(category => category.IsActive).HasColumnName("is_active").HasDefaultValue(true).IsRequired();


        entity.HasData(
            new DesignCategory
            {
                Id = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000001"),
                Name = "Logo & Brand Identity",
                Description = "Logo, brand marks, and basic identity systems.",
                IsActive = true
            },
            new DesignCategory
            {
                Id = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000002"),
                Name = "Social Media Design",
                Description = "Posts, banners, ads, and social campaign visuals.",
                IsActive = true
            },
            new DesignCategory
            {
                Id = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000003"),
                Name = "Packaging Design",
                Description = "Product packaging, labels, and retail presentation.",
                IsActive = true
            },
            new DesignCategory
            {
                Id = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000004"),
                Name = "UI/UX Design",
                Description = "Website, app, landing page, and interface mockups.",
                IsActive = true
            },
            new DesignCategory
            {
                Id = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000005"),
                Name = "Print Design",
                Description = "Flyers, posters, brochures, menus, and print collateral.",
                IsActive = true
            },
            new DesignCategory
            {
                Id = Guid.Parse("aaaaaaaa-0000-0000-0000-000000000006"),
                Name = "Illustration",
                Description = "Custom illustration, icons, mascots, and visual assets.",
                IsActive = true
            });
    }
}
