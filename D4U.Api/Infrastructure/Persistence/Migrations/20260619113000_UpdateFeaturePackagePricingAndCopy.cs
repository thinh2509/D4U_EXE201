using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace D4U.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateFeaturePackagePricingAndCopy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE public.feature_packages
                SET
                    name = 'SME AI Growth 30 ngày',
                    description = 'Mở AI Matching và tăng giới hạn tối đa 10 dự án đang mở cho SME trong 30 ngày.',
                    price = 99000
                WHERE id = '44444444-4444-4444-4444-444444444444'
                   OR code IN ('SME_GROWTH_30D', 'SME_AI_MATCHING_30D');

                UPDATE public.feature_packages
                SET
                    name = 'Student AI Proposal 30 ngày',
                    description = 'Mở AI Proposal Writer cho Student trong 30 ngày để tăng tốc viết proposal.',
                    price = 69000
                WHERE id = '55555555-5555-5555-5555-555555555555'
                   OR code = 'STUDENT_AI_MATCHING_30D';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE public.feature_packages
                SET
                    name = 'SME AI Boost 30 ngày',
                    description = 'Mở AI Matching và tăng giới hạn tối đa 10 dự án đang mở cho SME trong 30 ngày.',
                    price = 99000
                WHERE id = '44444444-4444-4444-4444-444444444444'
                   OR code IN ('SME_GROWTH_30D', 'SME_AI_MATCHING_30D');

                UPDATE public.feature_packages
                SET
                    name = 'Student AI Matching 30 ngày',
                    description = 'Mở AI Matching và AI Proposal Writer cho Student trong 30 ngày.',
                    price = 59000
                WHERE id = '55555555-5555-5555-5555-555555555555'
                   OR code = 'STUDENT_AI_MATCHING_30D';
                """);
        }
    }
}
