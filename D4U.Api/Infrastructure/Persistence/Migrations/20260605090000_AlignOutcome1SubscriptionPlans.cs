namespace D4U.Api.Infrastructure.Persistence.Migrations;

using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

[DbContext(typeof(D4UDbContext))]
[Migration("20260605090000_AlignOutcome1SubscriptionPlans")]
public partial class AlignOutcome1SubscriptionPlans : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            UPDATE public.subscription_plans
            SET platform_fee_rate = 0.10,
                max_active_open_projects = 2,
                max_project_budget = 5000000
            WHERE code = 'BASIC';

            UPDATE public.subscription_plans
            SET platform_fee_rate = 0.07,
                max_active_open_projects = 10,
                max_project_budget = 20000000
            WHERE code = 'PRO';

            UPDATE public.subscription_plans
            SET platform_fee_rate = 0.05,
                max_active_open_projects = NULL,
                max_project_budget = NULL
            WHERE code = 'PREMIUM';
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            UPDATE public.subscription_plans
            SET platform_fee_rate = 0.05,
                max_active_open_projects = 5,
                max_project_budget = 5000000
            WHERE code = 'BASIC';

            UPDATE public.subscription_plans
            SET platform_fee_rate = 0.03,
                max_active_open_projects = 10,
                max_project_budget = 20000000
            WHERE code = 'PRO';

            UPDATE public.subscription_plans
            SET platform_fee_rate = 0.02,
                max_active_open_projects = NULL,
                max_project_budget = NULL
            WHERE code = 'PREMIUM';
            """);
    }
}
