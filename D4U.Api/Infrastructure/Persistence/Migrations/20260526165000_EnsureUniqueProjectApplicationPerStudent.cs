using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace D4U.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(D4UDbContext))]
    [Migration("20260526165000_EnsureUniqueProjectApplicationPerStudent")]
    public partial class EnsureUniqueProjectApplicationPerStudent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DELETE FROM public.project_applications AS duplicate
                USING public.project_applications AS original
                WHERE duplicate.project_id = original.project_id
                    AND duplicate.student_profile_id = original.student_profile_id
                    AND (
                        duplicate.submitted_at > original.submitted_at
                        OR (
                            duplicate.submitted_at = original.submitted_at
                            AND duplicate.id::text > original.id::text
                        )
                    );
                """);

            migrationBuilder.Sql(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS "IX_project_applications_project_id_student_profile_id"
                ON public.project_applications (project_id, student_profile_id);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
