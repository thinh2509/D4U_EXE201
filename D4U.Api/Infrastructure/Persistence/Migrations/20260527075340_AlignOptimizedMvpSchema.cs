using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace D4U.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AlignOptimizedMvpSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_project_submissions_project_milestones_milestone_id",
                schema: "public",
                table: "project_submissions");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "subscription_current_period_end",
                schema: "public",
                table: "sme_profiles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "subscription_plan_id",
                schema: "public",
                table: "sme_profiles",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "subscription_started_at",
                schema: "public",
                table: "sme_profiles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql("""
                update public.sme_profiles sp
                set
                    subscription_plan_id = coalesce(
                        (
                            select ss.subscription_plan_id
                            from public.sme_subscriptions ss
                            where ss.sme_profile_id = sp.id and ss.status = 'ACTIVE'
                            order by ss.started_at desc
                            limit 1
                        ),
                        (
                            select id
                            from public.subscription_plans
                            where code = 'BASIC' and is_active = true
                            limit 1
                        )
                    ),
                    subscription_started_at = coalesce(
                        (
                            select ss.started_at
                            from public.sme_subscriptions ss
                            where ss.sme_profile_id = sp.id and ss.status = 'ACTIVE'
                            order by ss.started_at desc
                            limit 1
                        ),
                        now()
                    ),
                    subscription_current_period_end = (
                        select ss.current_period_end
                        from public.sme_subscriptions ss
                        where ss.sme_profile_id = sp.id and ss.status = 'ACTIVE'
                        order by ss.started_at desc
                        limit 1
                    )
                where sp.subscription_plan_id is null;
                """);

            migrationBuilder.AlterColumn<Guid>(
                name: "subscription_plan_id",
                schema: "public",
                table: "sme_profiles",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "subscription_started_at",
                schema: "public",
                table: "sme_profiles",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTimeOffset),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.DropTable(
                name: "dispute_evidences",
                schema: "public");

            migrationBuilder.DropTable(
                name: "invalid_file_reports",
                schema: "public");

            migrationBuilder.DropTable(
                name: "project_milestones",
                schema: "public");

            migrationBuilder.DropTable(
                name: "project_status_histories",
                schema: "public");

            migrationBuilder.DropTable(
                name: "revision_requests",
                schema: "public");

            migrationBuilder.DropTable(
                name: "sme_subscriptions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "disputes",
                schema: "public");

            migrationBuilder.DropIndex(
                name: "IX_review_actions_project_id",
                schema: "public",
                table: "review_actions");

            migrationBuilder.DropIndex(
                name: "IX_review_actions_submission_id",
                schema: "public",
                table: "review_actions");

            migrationBuilder.DropIndex(
                name: "IX_project_submissions_milestone_id",
                schema: "public",
                table: "project_submissions");

            migrationBuilder.DropColumn(
                name: "milestone_id",
                schema: "public",
                table: "project_submissions");

            migrationBuilder.RenameColumn(
                name: "revoked_at",
                schema: "public",
                table: "project_offers",
                newName: "payment_due_at");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "due_at",
                schema: "public",
                table: "review_actions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "invalid_file_reason",
                schema: "public",
                table: "review_actions",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "metadata_json",
                schema: "public",
                table: "review_actions",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "requested_changes",
                schema: "public",
                table: "review_actions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "resolved_at",
                schema: "public",
                table: "review_actions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "reupload_due_at",
                schema: "public",
                table: "review_actions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "revision_round",
                schema: "public",
                table: "review_actions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "approved_at",
                schema: "public",
                table: "project_submissions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "auto_approved_at",
                schema: "public",
                table: "project_submissions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "milestone_type",
                schema: "public",
                table: "project_submissions",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "SKETCH");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "review_due_at",
                schema: "public",
                table: "project_submissions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "status",
                schema: "public",
                table: "project_offers",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "WAITING_ACCEPTANCE",
                oldClrType: typeof(string),
                oldType: "character varying(40)",
                oldMaxLength: 40,
                oldDefaultValue: "PENDING_PAYMENT");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "expired_at",
                schema: "public",
                table: "project_offers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_wallets_non_negative_balances",
                schema: "public",
                table: "wallets",
                sql: "available_balance >= 0 AND pending_balance >= 0 AND locked_balance >= 0");

            migrationBuilder.CreateIndex(
                name: "IX_sme_profiles_subscription_plan_id",
                schema: "public",
                table: "sme_profiles",
                column: "subscription_plan_id");

            migrationBuilder.CreateIndex(
                name: "IX_review_actions_project_id_action",
                schema: "public",
                table: "review_actions",
                columns: new[] { "project_id", "action" });

            migrationBuilder.CreateIndex(
                name: "IX_review_actions_project_id_revision_round",
                schema: "public",
                table: "review_actions",
                columns: new[] { "project_id", "revision_round" });

            migrationBuilder.CreateIndex(
                name: "IX_review_actions_submission_id_action",
                schema: "public",
                table: "review_actions",
                columns: new[] { "submission_id", "action" });

            migrationBuilder.CreateIndex(
                name: "IX_project_submissions_project_id_milestone_type_status",
                schema: "public",
                table: "project_submissions",
                columns: new[] { "project_id", "milestone_type", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_project_submissions_status_review_due_at",
                schema: "public",
                table: "project_submissions",
                columns: new[] { "status", "review_due_at" });

            migrationBuilder.AddForeignKey(
                name: "FK_sme_profiles_subscription_plans_subscription_plan_id",
                schema: "public",
                table: "sme_profiles",
                column: "subscription_plan_id",
                principalSchema: "public",
                principalTable: "subscription_plans",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_sme_profiles_subscription_plans_subscription_plan_id",
                schema: "public",
                table: "sme_profiles");

            migrationBuilder.DropCheckConstraint(
                name: "CK_wallets_non_negative_balances",
                schema: "public",
                table: "wallets");

            migrationBuilder.DropIndex(
                name: "IX_sme_profiles_subscription_plan_id",
                schema: "public",
                table: "sme_profiles");

            migrationBuilder.DropIndex(
                name: "IX_review_actions_project_id_action",
                schema: "public",
                table: "review_actions");

            migrationBuilder.DropIndex(
                name: "IX_review_actions_project_id_revision_round",
                schema: "public",
                table: "review_actions");

            migrationBuilder.DropIndex(
                name: "IX_review_actions_submission_id_action",
                schema: "public",
                table: "review_actions");

            migrationBuilder.DropIndex(
                name: "IX_project_submissions_project_id_milestone_type_status",
                schema: "public",
                table: "project_submissions");

            migrationBuilder.DropIndex(
                name: "IX_project_submissions_status_review_due_at",
                schema: "public",
                table: "project_submissions");

            migrationBuilder.DropColumn(
                name: "subscription_current_period_end",
                schema: "public",
                table: "sme_profiles");

            migrationBuilder.DropColumn(
                name: "subscription_plan_id",
                schema: "public",
                table: "sme_profiles");

            migrationBuilder.DropColumn(
                name: "subscription_started_at",
                schema: "public",
                table: "sme_profiles");

            migrationBuilder.DropColumn(
                name: "due_at",
                schema: "public",
                table: "review_actions");

            migrationBuilder.DropColumn(
                name: "invalid_file_reason",
                schema: "public",
                table: "review_actions");

            migrationBuilder.DropColumn(
                name: "metadata_json",
                schema: "public",
                table: "review_actions");

            migrationBuilder.DropColumn(
                name: "requested_changes",
                schema: "public",
                table: "review_actions");

            migrationBuilder.DropColumn(
                name: "resolved_at",
                schema: "public",
                table: "review_actions");

            migrationBuilder.DropColumn(
                name: "reupload_due_at",
                schema: "public",
                table: "review_actions");

            migrationBuilder.DropColumn(
                name: "revision_round",
                schema: "public",
                table: "review_actions");

            migrationBuilder.DropColumn(
                name: "approved_at",
                schema: "public",
                table: "project_submissions");

            migrationBuilder.DropColumn(
                name: "auto_approved_at",
                schema: "public",
                table: "project_submissions");

            migrationBuilder.DropColumn(
                name: "milestone_type",
                schema: "public",
                table: "project_submissions");

            migrationBuilder.DropColumn(
                name: "review_due_at",
                schema: "public",
                table: "project_submissions");

            migrationBuilder.DropColumn(
                name: "expired_at",
                schema: "public",
                table: "project_offers");

            migrationBuilder.RenameColumn(
                name: "payment_due_at",
                schema: "public",
                table: "project_offers",
                newName: "revoked_at");

            migrationBuilder.AddColumn<Guid>(
                name: "milestone_id",
                schema: "public",
                table: "project_submissions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AlterColumn<string>(
                name: "status",
                schema: "public",
                table: "project_offers",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "PENDING_PAYMENT",
                oldClrType: typeof(string),
                oldType: "character varying(40)",
                oldMaxLength: 40,
                oldDefaultValue: "WAITING_ACCEPTANCE");

            migrationBuilder.CreateTable(
                name: "disputes",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    against_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    assigned_admin_id = table.Column<Guid>(type: "uuid", nullable: true),
                    decision_rationale = table.Column<string>(type: "text", nullable: true),
                    decision_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    description = table.Column<string>(type: "text", nullable: false),
                    escrow_id = table.Column<Guid>(type: "uuid", nullable: true),
                    opened_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    opened_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    platform_fee_amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false, defaultValue: 0m),
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reason_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    resolved_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    sme_refund_amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false, defaultValue: 0m),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "OPEN"),
                    student_payout_amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false, defaultValue: 0m)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_disputes", x => x.id);
                    table.ForeignKey(
                        name: "FK_disputes_escrows_escrow_id",
                        column: x => x.escrow_id,
                        principalSchema: "public",
                        principalTable: "escrows",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_disputes_projects_project_id",
                        column: x => x.project_id,
                        principalSchema: "public",
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_disputes_users_against_user_id",
                        column: x => x.against_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_disputes_users_assigned_admin_id",
                        column: x => x.assigned_admin_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_disputes_users_opened_by_user_id",
                        column: x => x.opened_by_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "invalid_file_reports",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reason_code = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    reported_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    resolved_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    reupload_due_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "OPEN"),
                    submission_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_invalid_file_reports", x => x.id);
                    table.ForeignKey(
                        name: "FK_invalid_file_reports_project_submissions_submission_id",
                        column: x => x.submission_id,
                        principalSchema: "public",
                        principalTable: "project_submissions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_invalid_file_reports_projects_project_id",
                        column: x => x.project_id,
                        principalSchema: "public",
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_invalid_file_reports_users_reported_by_user_id",
                        column: x => x.reported_by_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "project_milestones",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    approved_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    auto_approved_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    deadline_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    milestone_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),
                    review_due_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false, defaultValue: "PENDING"),
                    submitted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_project_milestones", x => x.id);
                    table.ForeignKey(
                        name: "FK_project_milestones_projects_project_id",
                        column: x => x.project_id,
                        principalSchema: "public",
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "project_status_histories",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    change_reason = table.Column<string>(type: "text", nullable: true),
                    changed_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    from_status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    metadata_json = table.Column<string>(type: "jsonb", nullable: true),
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),
                    to_status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_project_status_histories", x => x.id);
                    table.ForeignKey(
                        name: "FK_project_status_histories_projects_project_id",
                        column: x => x.project_id,
                        principalSchema: "public",
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_project_status_histories_users_changed_by_user_id",
                        column: x => x.changed_by_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "revision_requests",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    due_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),
                    requested_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    requested_changes = table.Column<string>(type: "text", nullable: false),
                    resolved_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    revision_round = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "OPEN"),
                    submission_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_revision_requests", x => x.id);
                    table.ForeignKey(
                        name: "FK_revision_requests_project_submissions_submission_id",
                        column: x => x.submission_id,
                        principalSchema: "public",
                        principalTable: "project_submissions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_revision_requests_projects_project_id",
                        column: x => x.project_id,
                        principalSchema: "public",
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_revision_requests_users_requested_by_user_id",
                        column: x => x.requested_by_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "sme_subscriptions",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    cancelled_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    current_period_end = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    sme_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    started_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "ACTIVE"),
                    subscription_plan_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sme_subscriptions", x => x.id);
                    table.ForeignKey(
                        name: "FK_sme_subscriptions_sme_profiles_sme_profile_id",
                        column: x => x.sme_profile_id,
                        principalSchema: "public",
                        principalTable: "sme_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_sme_subscriptions_subscription_plans_subscription_plan_id",
                        column: x => x.subscription_plan_id,
                        principalSchema: "public",
                        principalTable: "subscription_plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "dispute_evidences",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    comment = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    dispute_id = table.Column<Guid>(type: "uuid", nullable: false),
                    file_id = table.Column<Guid>(type: "uuid", nullable: true),
                    submitted_by_user_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_dispute_evidences", x => x.id);
                    table.ForeignKey(
                        name: "FK_dispute_evidences_disputes_dispute_id",
                        column: x => x.dispute_id,
                        principalSchema: "public",
                        principalTable: "disputes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_dispute_evidences_files_file_id",
                        column: x => x.file_id,
                        principalSchema: "public",
                        principalTable: "files",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_dispute_evidences_users_submitted_by_user_id",
                        column: x => x.submitted_by_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_review_actions_project_id",
                schema: "public",
                table: "review_actions",
                column: "project_id");

            migrationBuilder.CreateIndex(
                name: "IX_review_actions_submission_id",
                schema: "public",
                table: "review_actions",
                column: "submission_id");

            migrationBuilder.CreateIndex(
                name: "IX_project_submissions_milestone_id",
                schema: "public",
                table: "project_submissions",
                column: "milestone_id");

            migrationBuilder.CreateIndex(
                name: "IX_dispute_evidences_dispute_id",
                schema: "public",
                table: "dispute_evidences",
                column: "dispute_id");

            migrationBuilder.CreateIndex(
                name: "IX_dispute_evidences_file_id",
                schema: "public",
                table: "dispute_evidences",
                column: "file_id");

            migrationBuilder.CreateIndex(
                name: "IX_dispute_evidences_submitted_by_user_id",
                schema: "public",
                table: "dispute_evidences",
                column: "submitted_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_disputes_against_user_id",
                schema: "public",
                table: "disputes",
                column: "against_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_disputes_assigned_admin_id_status",
                schema: "public",
                table: "disputes",
                columns: new[] { "assigned_admin_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_disputes_escrow_id",
                schema: "public",
                table: "disputes",
                column: "escrow_id");

            migrationBuilder.CreateIndex(
                name: "IX_disputes_opened_by_user_id",
                schema: "public",
                table: "disputes",
                column: "opened_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_disputes_project_id_status",
                schema: "public",
                table: "disputes",
                columns: new[] { "project_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_invalid_file_reports_project_id",
                schema: "public",
                table: "invalid_file_reports",
                column: "project_id");

            migrationBuilder.CreateIndex(
                name: "IX_invalid_file_reports_reported_by_user_id",
                schema: "public",
                table: "invalid_file_reports",
                column: "reported_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_invalid_file_reports_submission_id",
                schema: "public",
                table: "invalid_file_reports",
                column: "submission_id");

            migrationBuilder.CreateIndex(
                name: "IX_project_milestones_project_id_milestone_type",
                schema: "public",
                table: "project_milestones",
                columns: new[] { "project_id", "milestone_type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_project_milestones_status_deadline_at",
                schema: "public",
                table: "project_milestones",
                columns: new[] { "status", "deadline_at" });

            migrationBuilder.CreateIndex(
                name: "IX_project_milestones_status_review_due_at",
                schema: "public",
                table: "project_milestones",
                columns: new[] { "status", "review_due_at" });

            migrationBuilder.CreateIndex(
                name: "IX_project_status_histories_changed_by_user_id",
                schema: "public",
                table: "project_status_histories",
                column: "changed_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_project_status_histories_project_id",
                schema: "public",
                table: "project_status_histories",
                column: "project_id");

            migrationBuilder.CreateIndex(
                name: "IX_revision_requests_project_id_revision_round_submission_id",
                schema: "public",
                table: "revision_requests",
                columns: new[] { "project_id", "revision_round", "submission_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_revision_requests_project_id_status",
                schema: "public",
                table: "revision_requests",
                columns: new[] { "project_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_revision_requests_requested_by_user_id",
                schema: "public",
                table: "revision_requests",
                column: "requested_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_revision_requests_submission_id",
                schema: "public",
                table: "revision_requests",
                column: "submission_id");

            migrationBuilder.CreateIndex(
                name: "IX_sme_subscriptions_sme_profile_id_status",
                schema: "public",
                table: "sme_subscriptions",
                columns: new[] { "sme_profile_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_sme_subscriptions_subscription_plan_id",
                schema: "public",
                table: "sme_subscriptions",
                column: "subscription_plan_id");

            migrationBuilder.AddForeignKey(
                name: "FK_project_submissions_project_milestones_milestone_id",
                schema: "public",
                table: "project_submissions",
                column: "milestone_id",
                principalSchema: "public",
                principalTable: "project_milestones",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
