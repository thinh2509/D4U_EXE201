using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace D4U.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFeaturePackagePurchasesAndAiMatching : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "feature_package_purchase_id",
                schema: "public",
                table: "payments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "target_type",
                schema: "public",
                table: "payments",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "ESCROW");

            migrationBuilder.CreateTable(
                name: "feature_packages",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    code = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    currency = table.Column<string>(type: "character(3)", fixedLength: true, maxLength: 3, nullable: false, defaultValue: "VND"),
                    duration_days = table.Column<int>(type: "integer", nullable: false),
                    entitlement_code = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    usage_limit = table.Column<int>(type: "integer", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_feature_packages", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "feature_package_purchases",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    feature_package_id = table.Column<Guid>(type: "uuid", nullable: false),
                    buyer_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "PENDING"),
                    price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    currency = table.Column<string>(type: "character(3)", fixedLength: true, maxLength: 3, nullable: false, defaultValue: "VND"),
                    activated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    cancelled_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_feature_package_purchases", x => x.id);
                    table.ForeignKey(
                        name: "FK_feature_package_purchases_feature_packages_feature_package_~",
                        column: x => x.feature_package_id,
                        principalSchema: "public",
                        principalTable: "feature_packages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_feature_package_purchases_users_buyer_user_id",
                        column: x => x.buyer_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "user_feature_entitlements",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    feature_package_id = table.Column<Guid>(type: "uuid", nullable: false),
                    feature_package_purchase_id = table.Column<Guid>(type: "uuid", nullable: false),
                    entitlement_code = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "ACTIVE"),
                    usage_limit = table.Column<int>(type: "integer", nullable: true),
                    usage_consumed = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    activated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    cancelled_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_feature_entitlements", x => x.id);
                    table.ForeignKey(
                        name: "FK_user_feature_entitlements_feature_package_purchases_feature~",
                        column: x => x.feature_package_purchase_id,
                        principalSchema: "public",
                        principalTable: "feature_package_purchases",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_user_feature_entitlements_feature_packages_feature_package_~",
                        column: x => x.feature_package_id,
                        principalSchema: "public",
                        principalTable: "feature_packages",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_user_feature_entitlements_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                schema: "public",
                table: "feature_packages",
                columns: new[] { "id", "code", "created_at", "currency", "description", "duration_days", "entitlement_code", "is_active", "name", "price", "role", "updated_at", "usage_limit" },
                values: new object[,]
                {
                    { new Guid("44444444-4444-4444-4444-444444444444"), "SME_AI_MATCHING_30D", new DateTimeOffset(new DateTime(2026, 6, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "VND", "Mo khoa AI Matching de goi y sinh vien phu hop cho du an cua SME trong 30 ngay.", 30, "SME_AI_MATCHING", true, "SME AI Matching 30 ngày", 299000m, "SME", new DateTimeOffset(new DateTime(2026, 6, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null },
                    { new Guid("55555555-5555-5555-5555-555555555555"), "STUDENT_AI_MATCHING_30D", new DateTimeOffset(new DateTime(2026, 6, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "VND", "Mo khoa AI Matching de goi y du an mo phu hop cho Student trong 30 ngay.", 30, "STUDENT_AI_MATCHING", true, "Student AI Matching 30 ngày", 199000m, "STUDENT", new DateTimeOffset(new DateTime(2026, 6, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_payments_feature_package_purchase_id_status",
                schema: "public",
                table: "payments",
                columns: new[] { "feature_package_purchase_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_feature_package_purchases_buyer_user_id_status_created_at",
                schema: "public",
                table: "feature_package_purchases",
                columns: new[] { "buyer_user_id", "status", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_feature_package_purchases_feature_package_id_status",
                schema: "public",
                table: "feature_package_purchases",
                columns: new[] { "feature_package_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_feature_packages_code",
                schema: "public",
                table: "feature_packages",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_feature_packages_role_is_active",
                schema: "public",
                table: "feature_packages",
                columns: new[] { "role", "is_active" });

            migrationBuilder.CreateIndex(
                name: "IX_user_feature_entitlements_feature_package_id",
                schema: "public",
                table: "user_feature_entitlements",
                column: "feature_package_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_feature_entitlements_feature_package_purchase_id",
                schema: "public",
                table: "user_feature_entitlements",
                column: "feature_package_purchase_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_feature_entitlements_user_id_entitlement_code_status",
                schema: "public",
                table: "user_feature_entitlements",
                columns: new[] { "user_id", "entitlement_code", "status" });

            migrationBuilder.AddForeignKey(
                name: "FK_payments_feature_package_purchases_feature_package_purchase~",
                schema: "public",
                table: "payments",
                column: "feature_package_purchase_id",
                principalSchema: "public",
                principalTable: "feature_package_purchases",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_payments_feature_package_purchases_feature_package_purchase~",
                schema: "public",
                table: "payments");

            migrationBuilder.DropTable(
                name: "user_feature_entitlements",
                schema: "public");

            migrationBuilder.DropTable(
                name: "feature_package_purchases",
                schema: "public");

            migrationBuilder.DropTable(
                name: "feature_packages",
                schema: "public");

            migrationBuilder.DropIndex(
                name: "IX_payments_feature_package_purchase_id_status",
                schema: "public",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "feature_package_purchase_id",
                schema: "public",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "target_type",
                schema: "public",
                table: "payments");
        }
    }
}
