using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace D4U.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPayOsEscrowPayment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "checkout_url",
                schema: "public",
                table: "payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "expires_at",
                schema: "public",
                table: "payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "provider_order_code",
                schema: "public",
                table: "payments",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "qr_code",
                schema: "public",
                table: "payments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "raw_provider_response_json",
                schema: "public",
                table: "payments",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "updated_at",
                schema: "public",
                table: "payments",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.CreateIndex(
                name: "IX_payments_provider_provider_order_code",
                schema: "public",
                table: "payments",
                columns: new[] { "provider", "provider_order_code" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_payments_provider_provider_order_code",
                schema: "public",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "checkout_url",
                schema: "public",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "expires_at",
                schema: "public",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "provider_order_code",
                schema: "public",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "qr_code",
                schema: "public",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "raw_provider_response_json",
                schema: "public",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "updated_at",
                schema: "public",
                table: "payments");
        }
    }
}
