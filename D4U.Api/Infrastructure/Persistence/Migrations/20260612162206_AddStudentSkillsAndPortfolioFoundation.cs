using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace D4U.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentSkillsAndPortfolioFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "student_skills",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    skill_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    normalized_skill_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    level = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    years_of_experience = table.Column<int>(type: "integer", nullable: true),
                    experience_note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_highlighted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_skills", x => x.id);
                    table.ForeignKey(
                        name: "FK_student_skills_student_profiles_student_profile_id",
                        column: x => x.student_profile_id,
                        principalSchema: "public",
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "student_portfolio_items",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    source_project_id = table.Column<Guid>(type: "uuid", nullable: true),
                    design_category_id = table.Column<Guid>(type: "uuid", nullable: true),
                    title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    thumbnail_url = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    project_url = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    file_url = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    completed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    is_featured = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    published_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_portfolio_items", x => x.id);
                    table.ForeignKey(
                        name: "FK_student_portfolio_items_design_categories_design_category_id",
                        column: x => x.design_category_id,
                        principalSchema: "public",
                        principalTable: "design_categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_student_portfolio_items_projects_source_project_id",
                        column: x => x.source_project_id,
                        principalSchema: "public",
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_student_portfolio_items_student_profiles_student_profile_id",
                        column: x => x.student_profile_id,
                        principalSchema: "public",
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "student_portfolio_item_skills",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    portfolio_item_id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_skill_id = table.Column<Guid>(type: "uuid", nullable: false),
                    display_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_portfolio_item_skills", x => x.id);
                    table.ForeignKey(
                        name: "FK_student_portfolio_item_skills_student_portfolio_items_portf~",
                        column: x => x.portfolio_item_id,
                        principalSchema: "public",
                        principalTable: "student_portfolio_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_student_portfolio_item_skills_student_skills_student_skill_~",
                        column: x => x.student_skill_id,
                        principalSchema: "public",
                        principalTable: "student_skills",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_student_portfolio_item_skills_portfolio_item_id_student_ski~",
                schema: "public",
                table: "student_portfolio_item_skills",
                columns: new[] { "portfolio_item_id", "student_skill_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_student_portfolio_item_skills_student_skill_id",
                schema: "public",
                table: "student_portfolio_item_skills",
                column: "student_skill_id");

            migrationBuilder.CreateIndex(
                name: "IX_student_portfolio_items_design_category_id_status",
                schema: "public",
                table: "student_portfolio_items",
                columns: new[] { "design_category_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_student_portfolio_items_source_project_id",
                schema: "public",
                table: "student_portfolio_items",
                column: "source_project_id");

            migrationBuilder.CreateIndex(
                name: "IX_student_portfolio_items_student_profile_id_is_featured",
                schema: "public",
                table: "student_portfolio_items",
                columns: new[] { "student_profile_id", "is_featured" });

            migrationBuilder.CreateIndex(
                name: "IX_student_portfolio_items_student_profile_id_status",
                schema: "public",
                table: "student_portfolio_items",
                columns: new[] { "student_profile_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_student_skills_student_profile_id_is_highlighted",
                schema: "public",
                table: "student_skills",
                columns: new[] { "student_profile_id", "is_highlighted" });

            migrationBuilder.CreateIndex(
                name: "IX_student_skills_student_profile_id_normalized_skill_name",
                schema: "public",
                table: "student_skills",
                columns: new[] { "student_profile_id", "normalized_skill_name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "student_portfolio_item_skills",
                schema: "public");

            migrationBuilder.DropTable(
                name: "student_portfolio_items",
                schema: "public");

            migrationBuilder.DropTable(
                name: "student_skills",
                schema: "public");
        }
    }
}
