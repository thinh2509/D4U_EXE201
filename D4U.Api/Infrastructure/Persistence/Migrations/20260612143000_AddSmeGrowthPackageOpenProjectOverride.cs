using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace D4U.Api.Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(D4UDbContext))]
    [Migration("20260612143000_AddSmeGrowthPackageOpenProjectOverride")]
    public partial class AddSmeGrowthPackageOpenProjectOverride : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "max_active_open_projects_override",
                schema: "public",
                table: "feature_packages",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE public.feature_packages
                SET code = 'SME_GROWTH_30D',
                    name = 'SME Growth 30 ngày',
                    description = 'Mo khoa AI Matching va nang gioi han toi da 10 du an dang mo cho SME trong 30 ngay.',
                    max_active_open_projects_override = 10
                WHERE id = '44444444-4444-4444-4444-444444444444';

                UPDATE public.feature_packages
                SET max_active_open_projects_override = NULL
                WHERE id = '55555555-5555-5555-5555-555555555555';
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE public.feature_packages
                SET code = 'SME_AI_MATCHING_30D',
                    name = 'SME AI Matching 30 ngày',
                    description = 'Mo khoa AI Matching de goi y sinh vien phu hop cho du an cua SME trong 30 ngay.'
                WHERE id = '44444444-4444-4444-4444-444444444444';
                """);

            migrationBuilder.DropColumn(
                name: "max_active_open_projects_override",
                schema: "public",
                table: "feature_packages");
        }
    }
}
