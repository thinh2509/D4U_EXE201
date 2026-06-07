using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace D4U.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(D4UDbContext))]
    [Migration("20260603090000_AddPaymentMethodBankInfo")]
    public partial class AddPaymentMethodBankInfo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "fee_amount",
                schema: "public",
                table: "withdrawal_requests",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(12,2)",
                oldPrecision: 12,
                oldScale: 2,
                oldDefaultValue: 5000m);

            migrationBuilder.AddColumn<string>(
                name: "bank_code",
                schema: "public",
                table: "payment_methods",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "bank_name",
                schema: "public",
                table: "payment_methods",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "bank_code",
                schema: "public",
                table: "payment_methods");

            migrationBuilder.DropColumn(
                name: "bank_name",
                schema: "public",
                table: "payment_methods");

            migrationBuilder.AlterColumn<decimal>(
                name: "fee_amount",
                schema: "public",
                table: "withdrawal_requests",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: false,
                defaultValue: 5000m,
                oldClrType: typeof(decimal),
                oldType: "numeric(12,2)",
                oldPrecision: 12,
                oldScale: 2);
        }
    }
}
