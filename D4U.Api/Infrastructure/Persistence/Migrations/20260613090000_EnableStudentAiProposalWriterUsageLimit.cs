using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace D4U.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class EnableStudentAiProposalWriterUsageLimit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE public.feature_packages
                SET description = 'Mo khoa AI Matching va AI Proposal Writer cho Student trong 30 ngay.',
                    usage_limit = 30
                WHERE id = '55555555-5555-5555-5555-555555555555';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE public.feature_packages
                SET description = 'Mo khoa AI Matching de goi y du an mo phu hop cho Student trong 30 ngay.',
                    usage_limit = NULL
                WHERE id = '55555555-5555-5555-5555-555555555555';
                """);
        }
    }
}
