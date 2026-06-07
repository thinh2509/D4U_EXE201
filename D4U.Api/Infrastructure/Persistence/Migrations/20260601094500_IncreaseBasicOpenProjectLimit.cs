namespace D4U.Api.Infrastructure.Persistence.Migrations;

using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

[DbContext(typeof(D4UDbContext))]
[Migration("20260601094500_IncreaseBasicOpenProjectLimit")]
public partial class IncreaseBasicOpenProjectLimit : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            UPDATE public.subscription_plans
            SET max_active_open_projects = 5
            WHERE code = 'BASIC';
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            UPDATE public.subscription_plans
            SET max_active_open_projects = 2
            WHERE code = 'BASIC';
            """);
    }
}
