using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace D4U.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class HardenMoneyMovementIdempotency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_disbursements_escrow_id",
                schema: "public",
                table: "disbursements");

            migrationBuilder.CreateIndex(
                name: "IX_wallet_transactions_reference_type_reference_id_type",
                schema: "public",
                table: "wallet_transactions",
                columns: new[] { "reference_type", "reference_id", "type" },
                unique: true,
                filter: "reference_type IS NOT NULL AND reference_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_disbursements_escrow_id",
                schema: "public",
                table: "disbursements",
                column: "escrow_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_wallet_transactions_reference_type_reference_id_type",
                schema: "public",
                table: "wallet_transactions");

            migrationBuilder.DropIndex(
                name: "IX_disbursements_escrow_id",
                schema: "public",
                table: "disbursements");

            migrationBuilder.CreateIndex(
                name: "IX_disbursements_escrow_id",
                schema: "public",
                table: "disbursements",
                column: "escrow_id");
        }
    }
}
