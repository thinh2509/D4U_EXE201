using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace D4U.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateFeaturePackagePricingAndNames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                schema: "public",
                table: "feature_packages",
                keyColumn: "id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "name", "price" },
                values: new object[] { "SME AI Boost 30 ngày", 99000m });

            migrationBuilder.UpdateData(
                schema: "public",
                table: "feature_packages",
                keyColumn: "id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                column: "price",
                value: 59000m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                schema: "public",
                table: "feature_packages",
                keyColumn: "id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "name", "price" },
                values: new object[] { "SME Growth 30 ngày", 299000m });

            migrationBuilder.UpdateData(
                schema: "public",
                table: "feature_packages",
                keyColumn: "id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                column: "price",
                value: 199000m);
        }
    }
}
