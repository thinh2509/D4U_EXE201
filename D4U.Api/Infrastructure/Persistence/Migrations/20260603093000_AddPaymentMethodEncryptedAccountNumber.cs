using D4U.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace D4U.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(D4UDbContext))]
    [Migration("20260603093000_AddPaymentMethodEncryptedAccountNumber")]
    public partial class AddPaymentMethodEncryptedAccountNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "account_number_encrypted",
                schema: "public",
                table: "payment_methods",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "account_number_encrypted",
                schema: "public",
                table: "payment_methods");
        }
    }
}
