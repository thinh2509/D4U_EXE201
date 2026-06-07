using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace D4U.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class HardenPhase4aMoneyMovement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_withdrawal_requests_wallet_id",
                schema: "public",
                table: "withdrawal_requests");

            migrationBuilder.AddColumn<string>(
                name: "bank_transaction_reference",
                schema: "public",
                table: "withdrawal_requests",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "processed_by_user_id",
                schema: "public",
                table: "withdrawal_requests",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "processing_started_at",
                schema: "public",
                table: "withdrawal_requests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "transferred_at",
                schema: "public",
                table: "withdrawal_requests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.UpdateData(
                schema: "public",
                table: "subscription_plans",
                keyColumn: "id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "platform_fee_rate",
                value: 0.05m);

            migrationBuilder.UpdateData(
                schema: "public",
                table: "subscription_plans",
                keyColumn: "id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "platform_fee_rate",
                value: 0.03m);

            migrationBuilder.UpdateData(
                schema: "public",
                table: "subscription_plans",
                keyColumn: "id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                column: "platform_fee_rate",
                value: 0.02m);

            migrationBuilder.CreateIndex(
                name: "IX_withdrawal_requests_processed_by_user_id",
                schema: "public",
                table: "withdrawal_requests",
                column: "processed_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_withdrawal_requests_wallet_id",
                schema: "public",
                table: "withdrawal_requests",
                column: "wallet_id",
                unique: true,
                filter: "status IN ('PENDING', 'PROCESSING')");

            migrationBuilder.CreateIndex(
                name: "IX_notifications_recipient_user_id_type_reference_type_referen~",
                schema: "public",
                table: "notifications",
                columns: new[] { "recipient_user_id", "type", "reference_type", "reference_id" },
                unique: true,
                filter: "reference_type IS NOT NULL AND reference_id IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_withdrawal_requests_users_processed_by_user_id",
                schema: "public",
                table: "withdrawal_requests",
                column: "processed_by_user_id",
                principalSchema: "public",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_withdrawal_requests_users_processed_by_user_id",
                schema: "public",
                table: "withdrawal_requests");

            migrationBuilder.DropIndex(
                name: "IX_withdrawal_requests_processed_by_user_id",
                schema: "public",
                table: "withdrawal_requests");

            migrationBuilder.DropIndex(
                name: "IX_withdrawal_requests_wallet_id",
                schema: "public",
                table: "withdrawal_requests");

            migrationBuilder.DropIndex(
                name: "IX_notifications_recipient_user_id_type_reference_type_referen~",
                schema: "public",
                table: "notifications");

            migrationBuilder.DropColumn(
                name: "bank_transaction_reference",
                schema: "public",
                table: "withdrawal_requests");

            migrationBuilder.DropColumn(
                name: "processed_by_user_id",
                schema: "public",
                table: "withdrawal_requests");

            migrationBuilder.DropColumn(
                name: "processing_started_at",
                schema: "public",
                table: "withdrawal_requests");

            migrationBuilder.DropColumn(
                name: "transferred_at",
                schema: "public",
                table: "withdrawal_requests");

            migrationBuilder.UpdateData(
                schema: "public",
                table: "subscription_plans",
                keyColumn: "id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "platform_fee_rate",
                value: 0.10m);

            migrationBuilder.UpdateData(
                schema: "public",
                table: "subscription_plans",
                keyColumn: "id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "platform_fee_rate",
                value: 0.07m);

            migrationBuilder.UpdateData(
                schema: "public",
                table: "subscription_plans",
                keyColumn: "id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                column: "platform_fee_rate",
                value: 0.05m);

            migrationBuilder.CreateIndex(
                name: "IX_withdrawal_requests_wallet_id",
                schema: "public",
                table: "withdrawal_requests",
                column: "wallet_id");
        }
    }
}
