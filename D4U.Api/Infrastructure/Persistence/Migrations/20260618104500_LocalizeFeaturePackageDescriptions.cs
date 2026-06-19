using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace D4U.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LocalizeFeaturePackageDescriptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE public.feature_packages
                SET description = 'Mở AI Matching và tăng giới hạn tối đa 10 dự án đang mở cho SME trong 30 ngày.'
                WHERE id = '44444444-4444-4444-4444-444444444444';

                UPDATE public.feature_packages
                SET description = 'Mở AI Matching và AI Proposal Writer cho Student trong 30 ngày.'
                WHERE id = '55555555-5555-5555-5555-555555555555';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE public.feature_packages
                SET description = 'Mo khoa AI Matching va nang gioi han toi da 10 du an dang mo cho SME trong 30 ngay.'
                WHERE id = '44444444-4444-4444-4444-444444444444';

                UPDATE public.feature_packages
                SET description = 'Mo khoa AI Matching va AI Proposal Writer cho Student trong 30 ngay.'
                WHERE id = '55555555-5555-5555-5555-555555555555';
                """);
        }
    }
}
