using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace D4U.Api.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentSkillsAndPortfolioFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "public");

            migrationBuilder.CreateTable(
                name: "design_categories",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_design_categories", x => x.id);
                });

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
                    max_active_open_projects_override = table.Column<int>(type: "integer", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_feature_packages", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "subscription_plans",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    monthly_price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    platform_fee_rate = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    max_active_open_projects = table.Column<int>(type: "integer", nullable: true),
                    max_project_budget = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_subscription_plans", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    username = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    full_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    avatar_url = table.Column<string>(type: "text", nullable: true),
                    role = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "PENDING"),
                    email_verified_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    last_login_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "admin_profiles",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    permission_level = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_admin_profiles", x => x.id);
                    table.ForeignKey(
                        name: "FK_admin_profiles_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "audit_logs",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    actor_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    entity_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    entity_id = table.Column<Guid>(type: "uuid", nullable: true),
                    before_json = table.Column<string>(type: "jsonb", nullable: true),
                    after_json = table.Column<string>(type: "jsonb", nullable: true),
                    ip_address = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    user_agent = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_logs", x => x.id);
                    table.ForeignKey(
                        name: "FK_audit_logs_users_actor_user_id",
                        column: x => x.actor_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
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
                name: "files",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    owner_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    storage_provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    bucket = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    storage_key = table.Column<string>(type: "text", nullable: false),
                    original_filename = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    mime_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    file_extension = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    file_size_bytes = table.Column<long>(type: "bigint", nullable: false),
                    checksum = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    visibility = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "PRIVATE"),
                    scan_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_files", x => x.id);
                    table.ForeignKey(
                        name: "FK_files_users_owner_user_id",
                        column: x => x.owner_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "notifications",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    recipient_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    actor_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    type = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    body = table.Column<string>(type: "text", nullable: true),
                    reference_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    reference_id = table.Column<Guid>(type: "uuid", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "UNREAD"),
                    read_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notifications", x => x.id);
                    table.ForeignKey(
                        name: "FK_notifications_users_actor_user_id",
                        column: x => x.actor_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_notifications_users_recipient_user_id",
                        column: x => x.recipient_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "payment_methods",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    method_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "BANK_ACCOUNT"),
                    bank_name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    bank_code = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    account_holder_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    masked_account_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    account_number_encrypted = table.Column<string>(type: "text", nullable: true),
                    provider_token = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    is_default = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "ACTIVE"),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payment_methods", x => x.id);
                    table.ForeignKey(
                        name: "FK_payment_methods_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "student_profiles",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    school = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    major = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    study_start_year = table.Column<int>(type: "integer", nullable: false),
                    bio = table.Column<string>(type: "text", nullable: true),
                    onboarding_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "INCOMPLETE"),
                    verification_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "NOT_SUBMITTED"),
                    average_rating = table.Column<decimal>(type: "numeric(3,2)", precision: 3, scale: 2, nullable: false, defaultValue: 0m),
                    completed_projects_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    can_withdraw = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_profiles", x => x.id);
                    table.ForeignKey(
                        name: "FK_student_profiles_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "user_email_verifications",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    code_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "PENDING"),
                    requested_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    confirmed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_email_verifications", x => x.id);
                    table.ForeignKey(
                        name: "FK_user_email_verifications_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "user_external_logins",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    provider = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    provider_user_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_external_logins", x => x.id);
                    table.ForeignKey(
                        name: "FK_user_external_logins_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "user_sessions",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    refresh_token_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    device_info = table.Column<string>(type: "text", nullable: true),
                    ip_address = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    revoked_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_sessions", x => x.id);
                    table.ForeignKey(
                        name: "FK_user_sessions_users_user_id",
                        column: x => x.user_id,
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

            migrationBuilder.CreateTable(
                name: "sme_profiles",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    company_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    representative_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    phone_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    business_field = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    logo_file_id = table.Column<Guid>(type: "uuid", nullable: true),
                    onboarding_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "INCOMPLETE"),
                    average_rating = table.Column<decimal>(type: "numeric(3,2)", precision: 3, scale: 2, nullable: false, defaultValue: 0m),
                    completed_projects_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    active_open_project_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    subscription_plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    subscription_started_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    subscription_current_period_end = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sme_profiles", x => x.id);
                    table.ForeignKey(
                        name: "FK_sme_profiles_files_logo_file_id",
                        column: x => x.logo_file_id,
                        principalSchema: "public",
                        principalTable: "files",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_sme_profiles_subscription_plans_subscription_plan_id",
                        column: x => x.subscription_plan_id,
                        principalSchema: "public",
                        principalTable: "subscription_plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_sme_profiles_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "student_email_verifications",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    code_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "PENDING"),
                    requested_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    confirmed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_email_verifications", x => x.id);
                    table.ForeignKey(
                        name: "FK_student_email_verifications_student_profiles_student_profil~",
                        column: x => x.student_profile_id,
                        principalSchema: "public",
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_student_email_verifications_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

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
                name: "student_verifications",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    document_file_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "PENDING"),
                    reviewed_by_admin_id = table.Column<Guid>(type: "uuid", nullable: true),
                    rejection_reason = table.Column<string>(type: "text", nullable: true),
                    submitted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    reviewed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_verifications", x => x.id);
                    table.ForeignKey(
                        name: "FK_student_verifications_files_document_file_id",
                        column: x => x.document_file_id,
                        principalSchema: "public",
                        principalTable: "files",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_student_verifications_student_profiles_student_profile_id",
                        column: x => x.student_profile_id,
                        principalSchema: "public",
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_student_verifications_users_reviewed_by_admin_id",
                        column: x => x.reviewed_by_admin_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "wallets",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    owner_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_profile_id = table.Column<Guid>(type: "uuid", nullable: true),
                    currency = table.Column<string>(type: "character(3)", fixedLength: true, maxLength: 3, nullable: false, defaultValue: "VND"),
                    available_balance = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false, defaultValue: 0m),
                    pending_balance = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false, defaultValue: 0m),
                    locked_balance = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false, defaultValue: 0m),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "ACTIVE"),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_wallets", x => x.id);
                    table.CheckConstraint("CK_wallets_non_negative_balances", "available_balance >= 0 AND pending_balance >= 0 AND locked_balance >= 0");
                    table.ForeignKey(
                        name: "FK_wallets_student_profiles_student_profile_id",
                        column: x => x.student_profile_id,
                        principalSchema: "public",
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_wallets_users_owner_user_id",
                        column: x => x.owner_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "projects",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    sme_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    selected_student_profile_id = table.Column<Guid>(type: "uuid", nullable: true),
                    design_category_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    brief = table.Column<string>(type: "text", nullable: false),
                    usage_purpose = table.Column<string>(type: "text", nullable: true),
                    project_type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false, defaultValue: "DRAFT"),
                    budget_amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    currency = table.Column<string>(type: "character(3)", fixedLength: true, maxLength: 3, nullable: false, defaultValue: "VND"),
                    total_deadline_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    sketch_deadline_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    final_deadline_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    max_revision_rounds = table.Column<int>(type: "integer", nullable: false, defaultValue: 2),
                    current_revision_round = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    is_confidential = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    allow_student_portfolio = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    rating_due_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    published_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    accepted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    completed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    cancelled_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    cancellation_reason = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_projects", x => x.id);
                    table.ForeignKey(
                        name: "FK_projects_design_categories_design_category_id",
                        column: x => x.design_category_id,
                        principalSchema: "public",
                        principalTable: "design_categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_projects_sme_profiles_sme_profile_id",
                        column: x => x.sme_profile_id,
                        principalSchema: "public",
                        principalTable: "sme_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_projects_student_profiles_selected_student_profile_id",
                        column: x => x.selected_student_profile_id,
                        principalSchema: "public",
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "wallet_transactions",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    wallet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    balance_after = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    reference_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    reference_id = table.Column<Guid>(type: "uuid", nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_wallet_transactions", x => x.id);
                    table.ForeignKey(
                        name: "FK_wallet_transactions_wallets_wallet_id",
                        column: x => x.wallet_id,
                        principalSchema: "public",
                        principalTable: "wallets",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "withdrawal_requests",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    wallet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    requested_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    payment_method_id = table.Column<Guid>(type: "uuid", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    fee_amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    net_amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "PENDING"),
                    failure_reason = table.Column<string>(type: "text", nullable: true),
                    bank_transaction_reference = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    requested_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    processing_started_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    transferred_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    processed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    processed_by_user_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_withdrawal_requests", x => x.id);
                    table.ForeignKey(
                        name: "FK_withdrawal_requests_payment_methods_payment_method_id",
                        column: x => x.payment_method_id,
                        principalSchema: "public",
                        principalTable: "payment_methods",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_withdrawal_requests_users_processed_by_user_id",
                        column: x => x.processed_by_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_withdrawal_requests_users_requested_by_user_id",
                        column: x => x.requested_by_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_withdrawal_requests_wallets_wallet_id",
                        column: x => x.wallet_id,
                        principalSchema: "public",
                        principalTable: "wallets",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "escrows",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sme_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    currency = table.Column<string>(type: "character(3)", fixedLength: true, maxLength: 3, nullable: false, defaultValue: "VND"),
                    platform_fee_rate = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    platform_fee_amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true),
                    status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false, defaultValue: "PENDING_PAYMENT"),
                    funded_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    released_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    refunded_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_escrows", x => x.id);
                    table.ForeignKey(
                        name: "FK_escrows_projects_project_id",
                        column: x => x.project_id,
                        principalSchema: "public",
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_escrows_sme_profiles_sme_profile_id",
                        column: x => x.sme_profile_id,
                        principalSchema: "public",
                        principalTable: "sme_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_escrows_student_profiles_student_profile_id",
                        column: x => x.student_profile_id,
                        principalSchema: "public",
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "project_applications",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    proposed_price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    cover_letter = table.Column<string>(type: "text", nullable: false),
                    estimated_duration_days = table.Column<int>(type: "integer", nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "SUBMITTED"),
                    submitted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_project_applications", x => x.id);
                    table.ForeignKey(
                        name: "FK_project_applications_projects_project_id",
                        column: x => x.project_id,
                        principalSchema: "public",
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_project_applications_student_profiles_student_profile_id",
                        column: x => x.student_profile_id,
                        principalSchema: "public",
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "project_attachments",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),
                    file_id = table.Column<Guid>(type: "uuid", nullable: false),
                    attachment_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "BRIEF"),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_project_attachments", x => x.id);
                    table.ForeignKey(
                        name: "FK_project_attachments_files_file_id",
                        column: x => x.file_id,
                        principalSchema: "public",
                        principalTable: "files",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_project_attachments_projects_project_id",
                        column: x => x.project_id,
                        principalSchema: "public",
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "project_submissions",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),
                    submitted_by_student_id = table.Column<Guid>(type: "uuid", nullable: false),
                    submission_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    milestone_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    revision_round = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    description = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false, defaultValue: "SUBMITTED"),
                    submitted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    review_due_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    approved_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    auto_approved_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_project_submissions", x => x.id);
                    table.ForeignKey(
                        name: "FK_project_submissions_projects_project_id",
                        column: x => x.project_id,
                        principalSchema: "public",
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_project_submissions_student_profiles_submitted_by_student_id",
                        column: x => x.submitted_by_student_id,
                        principalSchema: "public",
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ratings",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),
                    rater_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    rated_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    rating_value = table.Column<int>(type: "integer", nullable: false),
                    comment = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_public = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ratings", x => x.id);
                    table.CheckConstraint("ck_ratings_rating_value", "rating_value between 1 and 5");
                    table.ForeignKey(
                        name: "FK_ratings_projects_project_id",
                        column: x => x.project_id,
                        principalSchema: "public",
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ratings_users_rated_user_id",
                        column: x => x.rated_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ratings_users_rater_user_id",
                        column: x => x.rater_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
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
                name: "disbursements",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    escrow_id = table.Column<Guid>(type: "uuid", nullable: false),
                    wallet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    gross_amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    platform_fee_amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    net_amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "PENDING"),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    completed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_disbursements", x => x.id);
                    table.ForeignKey(
                        name: "FK_disbursements_escrows_escrow_id",
                        column: x => x.escrow_id,
                        principalSchema: "public",
                        principalTable: "escrows",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_disbursements_wallets_wallet_id",
                        column: x => x.wallet_id,
                        principalSchema: "public",
                        principalTable: "wallets",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "payments",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    payer_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    target_type = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false, defaultValue: "ESCROW"),
                    escrow_id = table.Column<Guid>(type: "uuid", nullable: true),
                    feature_package_purchase_id = table.Column<Guid>(type: "uuid", nullable: true),
                    amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    currency = table.Column<string>(type: "character(3)", fixedLength: true, maxLength: 3, nullable: false, defaultValue: "VND"),
                    provider = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    provider_order_code = table.Column<long>(type: "bigint", nullable: true),
                    provider_transaction_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false, defaultValue: "PENDING"),
                    checkout_url = table.Column<string>(type: "text", nullable: true),
                    qr_code = table.Column<string>(type: "text", nullable: true),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    paid_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    raw_provider_response_json = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payments", x => x.id);
                    table.ForeignKey(
                        name: "FK_payments_escrows_escrow_id",
                        column: x => x.escrow_id,
                        principalSchema: "public",
                        principalTable: "escrows",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_payments_feature_package_purchases_feature_package_purchase~",
                        column: x => x.feature_package_purchase_id,
                        principalSchema: "public",
                        principalTable: "feature_package_purchases",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_payments_users_payer_user_id",
                        column: x => x.payer_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "project_offers",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),
                    student_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    application_id = table.Column<Guid>(type: "uuid", nullable: true),
                    status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false, defaultValue: "WAITING_ACCEPTANCE"),
                    offered_amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    payment_due_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    accepted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    rejected_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    expired_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_project_offers", x => x.id);
                    table.ForeignKey(
                        name: "FK_project_offers_project_applications_application_id",
                        column: x => x.application_id,
                        principalSchema: "public",
                        principalTable: "project_applications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_project_offers_projects_project_id",
                        column: x => x.project_id,
                        principalSchema: "public",
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_project_offers_student_profiles_student_profile_id",
                        column: x => x.student_profile_id,
                        principalSchema: "public",
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "review_actions",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),
                    submission_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reviewer_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    action = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    comment = table.Column<string>(type: "text", nullable: true),
                    requested_changes = table.Column<string>(type: "text", nullable: true),
                    revision_round = table.Column<int>(type: "integer", nullable: true),
                    due_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    invalid_file_reason = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    reupload_due_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    resolved_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    metadata_json = table.Column<string>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_review_actions", x => x.id);
                    table.ForeignKey(
                        name: "FK_review_actions_project_submissions_submission_id",
                        column: x => x.submission_id,
                        principalSchema: "public",
                        principalTable: "project_submissions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_review_actions_projects_project_id",
                        column: x => x.project_id,
                        principalSchema: "public",
                        principalTable: "projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_review_actions_users_reviewer_user_id",
                        column: x => x.reviewer_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "submission_files",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    submission_id = table.Column<Guid>(type: "uuid", nullable: false),
                    file_id = table.Column<Guid>(type: "uuid", nullable: false),
                    watermarked_file_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_original_downloadable = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_submission_files", x => x.id);
                    table.ForeignKey(
                        name: "FK_submission_files_files_file_id",
                        column: x => x.file_id,
                        principalSchema: "public",
                        principalTable: "files",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_submission_files_files_watermarked_file_id",
                        column: x => x.watermarked_file_id,
                        principalSchema: "public",
                        principalTable: "files",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_submission_files_project_submissions_submission_id",
                        column: x => x.submission_id,
                        principalSchema: "public",
                        principalTable: "project_submissions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
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

            migrationBuilder.CreateTable(
                name: "refunds",
                schema: "public",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    escrow_id = table.Column<Guid>(type: "uuid", nullable: false),
                    payment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    currency = table.Column<string>(type: "character(3)", fixedLength: true, maxLength: 3, nullable: false, defaultValue: "VND"),
                    reason = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "PENDING"),
                    provider_refund_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    completed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_refunds", x => x.id);
                    table.ForeignKey(
                        name: "FK_refunds_escrows_escrow_id",
                        column: x => x.escrow_id,
                        principalSchema: "public",
                        principalTable: "escrows",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_refunds_payments_payment_id",
                        column: x => x.payment_id,
                        principalSchema: "public",
                        principalTable: "payments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_refunds_users_created_by_user_id",
                        column: x => x.created_by_user_id,
                        principalSchema: "public",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                schema: "public",
                table: "design_categories",
                columns: new[] { "id", "description", "is_active", "name" },
                values: new object[,]
                {
                    { new Guid("aaaaaaaa-0000-0000-0000-000000000001"), "Logo, brand marks, and basic identity systems.", true, "Logo & Brand Identity" },
                    { new Guid("aaaaaaaa-0000-0000-0000-000000000002"), "Posts, banners, ads, and social campaign visuals.", true, "Social Media Design" },
                    { new Guid("aaaaaaaa-0000-0000-0000-000000000003"), "Product packaging, labels, and retail presentation.", true, "Packaging Design" },
                    { new Guid("aaaaaaaa-0000-0000-0000-000000000004"), "Website, app, landing page, and interface mockups.", true, "UI/UX Design" },
                    { new Guid("aaaaaaaa-0000-0000-0000-000000000005"), "Flyers, posters, brochures, menus, and print collateral.", true, "Print Design" },
                    { new Guid("aaaaaaaa-0000-0000-0000-000000000006"), "Custom illustration, icons, mascots, and visual assets.", true, "Illustration" }
                });

            migrationBuilder.InsertData(
                schema: "public",
                table: "feature_packages",
                columns: new[] { "id", "code", "created_at", "currency", "description", "duration_days", "entitlement_code", "is_active", "max_active_open_projects_override", "name", "price", "role", "updated_at", "usage_limit" },
                values: new object[,]
                {
                    { new Guid("44444444-4444-4444-4444-444444444444"), "SME_GROWTH_30D", new DateTimeOffset(new DateTime(2026, 6, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "VND", "Mo khoa AI Matching va nang gioi han toi da 10 du an dang mo cho SME trong 30 ngay.", 30, "SME_AI_MATCHING", true, 10, "SME Growth 30 ngày", 299000m, "SME", new DateTimeOffset(new DateTime(2026, 6, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null },
                    { new Guid("55555555-5555-5555-5555-555555555555"), "STUDENT_AI_MATCHING_30D", new DateTimeOffset(new DateTime(2026, 6, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), "VND", "Mo khoa AI Matching de goi y du an mo phu hop cho Student trong 30 ngay.", 30, "STUDENT_AI_MATCHING", true, null, "Student AI Matching 30 ngày", 199000m, "STUDENT", new DateTimeOffset(new DateTime(2026, 6, 12, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null }
                });

            migrationBuilder.InsertData(
                schema: "public",
                table: "subscription_plans",
                columns: new[] { "id", "code", "is_active", "max_active_open_projects", "max_project_budget", "monthly_price", "name", "platform_fee_rate" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), "BASIC", true, 2, 5000000m, 0m, "Basic", 0.10m },
                    { new Guid("22222222-2222-2222-2222-222222222222"), "PRO", true, 10, 20000000m, 199000m, "Pro", 0.07m },
                    { new Guid("33333333-3333-3333-3333-333333333333"), "PREMIUM", true, null, null, 499000m, "Premium", 0.05m }
                });

            migrationBuilder.CreateIndex(
                name: "IX_admin_profiles_user_id",
                schema: "public",
                table: "admin_profiles",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_action_created_at",
                schema: "public",
                table: "audit_logs",
                columns: new[] { "action", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_actor_user_id_created_at",
                schema: "public",
                table: "audit_logs",
                columns: new[] { "actor_user_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_logs_entity_type_entity_id",
                schema: "public",
                table: "audit_logs",
                columns: new[] { "entity_type", "entity_id" });

            migrationBuilder.CreateIndex(
                name: "IX_design_categories_name",
                schema: "public",
                table: "design_categories",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_disbursements_escrow_id",
                schema: "public",
                table: "disbursements",
                column: "escrow_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_disbursements_wallet_id",
                schema: "public",
                table: "disbursements",
                column: "wallet_id");

            migrationBuilder.CreateIndex(
                name: "IX_escrows_project_id",
                schema: "public",
                table: "escrows",
                column: "project_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_escrows_sme_profile_id_status",
                schema: "public",
                table: "escrows",
                columns: new[] { "sme_profile_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_escrows_status",
                schema: "public",
                table: "escrows",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_escrows_student_profile_id_status",
                schema: "public",
                table: "escrows",
                columns: new[] { "student_profile_id", "status" });

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
                name: "IX_files_owner_user_id_created_at",
                schema: "public",
                table: "files",
                columns: new[] { "owner_user_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_files_storage_provider_storage_key",
                schema: "public",
                table: "files",
                columns: new[] { "storage_provider", "storage_key" });

            migrationBuilder.CreateIndex(
                name: "IX_notifications_actor_user_id",
                schema: "public",
                table: "notifications",
                column: "actor_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_notifications_recipient_user_id_status_created_at",
                schema: "public",
                table: "notifications",
                columns: new[] { "recipient_user_id", "status", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_notifications_recipient_user_id_type_reference_type_referen~",
                schema: "public",
                table: "notifications",
                columns: new[] { "recipient_user_id", "type", "reference_type", "reference_id" },
                unique: true,
                filter: "reference_type IS NOT NULL AND reference_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_payment_methods_user_id",
                schema: "public",
                table: "payment_methods",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_payments_escrow_id_status",
                schema: "public",
                table: "payments",
                columns: new[] { "escrow_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_payments_feature_package_purchase_id_status",
                schema: "public",
                table: "payments",
                columns: new[] { "feature_package_purchase_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_payments_payer_user_id_created_at",
                schema: "public",
                table: "payments",
                columns: new[] { "payer_user_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_payments_provider_provider_order_code",
                schema: "public",
                table: "payments",
                columns: new[] { "provider", "provider_order_code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_payments_provider_provider_transaction_id",
                schema: "public",
                table: "payments",
                columns: new[] { "provider", "provider_transaction_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_project_applications_project_id_status",
                schema: "public",
                table: "project_applications",
                columns: new[] { "project_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_project_applications_project_id_student_profile_id",
                schema: "public",
                table: "project_applications",
                columns: new[] { "project_id", "student_profile_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_project_applications_student_profile_id_status",
                schema: "public",
                table: "project_applications",
                columns: new[] { "student_profile_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_project_attachments_file_id",
                schema: "public",
                table: "project_attachments",
                column: "file_id");

            migrationBuilder.CreateIndex(
                name: "IX_project_attachments_project_id",
                schema: "public",
                table: "project_attachments",
                column: "project_id");

            migrationBuilder.CreateIndex(
                name: "IX_project_offers_application_id",
                schema: "public",
                table: "project_offers",
                column: "application_id");

            migrationBuilder.CreateIndex(
                name: "IX_project_offers_project_id_status",
                schema: "public",
                table: "project_offers",
                columns: new[] { "project_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_project_offers_student_profile_id_status",
                schema: "public",
                table: "project_offers",
                columns: new[] { "student_profile_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_project_submissions_project_id_milestone_type_status",
                schema: "public",
                table: "project_submissions",
                columns: new[] { "project_id", "milestone_type", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_project_submissions_project_id_submission_type_revision_rou~",
                schema: "public",
                table: "project_submissions",
                columns: new[] { "project_id", "submission_type", "revision_round" });

            migrationBuilder.CreateIndex(
                name: "IX_project_submissions_status_review_due_at",
                schema: "public",
                table: "project_submissions",
                columns: new[] { "status", "review_due_at" });

            migrationBuilder.CreateIndex(
                name: "IX_project_submissions_submitted_by_student_id",
                schema: "public",
                table: "project_submissions",
                column: "submitted_by_student_id");

            migrationBuilder.CreateIndex(
                name: "IX_projects_design_category_id_status",
                schema: "public",
                table: "projects",
                columns: new[] { "design_category_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_projects_published_at",
                schema: "public",
                table: "projects",
                column: "published_at");

            migrationBuilder.CreateIndex(
                name: "IX_projects_selected_student_profile_id_status",
                schema: "public",
                table: "projects",
                columns: new[] { "selected_student_profile_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_projects_sme_profile_id_status",
                schema: "public",
                table: "projects",
                columns: new[] { "sme_profile_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_projects_status_project_type",
                schema: "public",
                table: "projects",
                columns: new[] { "status", "project_type" });

            migrationBuilder.CreateIndex(
                name: "IX_ratings_project_id_rater_user_id_rated_user_id",
                schema: "public",
                table: "ratings",
                columns: new[] { "project_id", "rater_user_id", "rated_user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ratings_rated_user_id_created_at",
                schema: "public",
                table: "ratings",
                columns: new[] { "rated_user_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_ratings_rater_user_id",
                schema: "public",
                table: "ratings",
                column: "rater_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_refunds_created_by_user_id",
                schema: "public",
                table: "refunds",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_refunds_escrow_id",
                schema: "public",
                table: "refunds",
                column: "escrow_id");

            migrationBuilder.CreateIndex(
                name: "IX_refunds_payment_id",
                schema: "public",
                table: "refunds",
                column: "payment_id");

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
                name: "IX_review_actions_reviewer_user_id",
                schema: "public",
                table: "review_actions",
                column: "reviewer_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_review_actions_submission_id_action",
                schema: "public",
                table: "review_actions",
                columns: new[] { "submission_id", "action" });

            migrationBuilder.CreateIndex(
                name: "IX_sme_profiles_logo_file_id",
                schema: "public",
                table: "sme_profiles",
                column: "logo_file_id");

            migrationBuilder.CreateIndex(
                name: "IX_sme_profiles_subscription_plan_id",
                schema: "public",
                table: "sme_profiles",
                column: "subscription_plan_id");

            migrationBuilder.CreateIndex(
                name: "IX_sme_profiles_user_id",
                schema: "public",
                table: "sme_profiles",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_student_email_verifications_email_status",
                schema: "public",
                table: "student_email_verifications",
                columns: new[] { "email", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_student_email_verifications_student_profile_id_status",
                schema: "public",
                table: "student_email_verifications",
                columns: new[] { "student_profile_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_student_email_verifications_user_id",
                schema: "public",
                table: "student_email_verifications",
                column: "user_id");

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
                name: "IX_student_profiles_average_rating",
                schema: "public",
                table: "student_profiles",
                column: "average_rating");

            migrationBuilder.CreateIndex(
                name: "IX_student_profiles_user_id",
                schema: "public",
                table: "student_profiles",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_student_profiles_verification_status",
                schema: "public",
                table: "student_profiles",
                column: "verification_status");

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

            migrationBuilder.CreateIndex(
                name: "IX_student_verifications_document_file_id",
                schema: "public",
                table: "student_verifications",
                column: "document_file_id");

            migrationBuilder.CreateIndex(
                name: "IX_student_verifications_reviewed_by_admin_id",
                schema: "public",
                table: "student_verifications",
                column: "reviewed_by_admin_id");

            migrationBuilder.CreateIndex(
                name: "IX_student_verifications_student_profile_id_status",
                schema: "public",
                table: "student_verifications",
                columns: new[] { "student_profile_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_submission_files_file_id",
                schema: "public",
                table: "submission_files",
                column: "file_id");

            migrationBuilder.CreateIndex(
                name: "IX_submission_files_submission_id",
                schema: "public",
                table: "submission_files",
                column: "submission_id");

            migrationBuilder.CreateIndex(
                name: "IX_submission_files_watermarked_file_id",
                schema: "public",
                table: "submission_files",
                column: "watermarked_file_id");

            migrationBuilder.CreateIndex(
                name: "IX_subscription_plans_code",
                schema: "public",
                table: "subscription_plans",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_email_verifications_email_status",
                schema: "public",
                table: "user_email_verifications",
                columns: new[] { "email", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_user_email_verifications_user_id_status",
                schema: "public",
                table: "user_email_verifications",
                columns: new[] { "user_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_user_external_logins_provider_email",
                schema: "public",
                table: "user_external_logins",
                columns: new[] { "provider", "email" });

            migrationBuilder.CreateIndex(
                name: "IX_user_external_logins_provider_provider_user_id",
                schema: "public",
                table: "user_external_logins",
                columns: new[] { "provider", "provider_user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_external_logins_user_id",
                schema: "public",
                table: "user_external_logins",
                column: "user_id");

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

            migrationBuilder.CreateIndex(
                name: "IX_user_sessions_user_id",
                schema: "public",
                table: "user_sessions",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_users_email",
                schema: "public",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_role_status",
                schema: "public",
                table: "users",
                columns: new[] { "role", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_users_username",
                schema: "public",
                table: "users",
                column: "username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_wallet_transactions_reference_type_reference_id",
                schema: "public",
                table: "wallet_transactions",
                columns: new[] { "reference_type", "reference_id" });

            migrationBuilder.CreateIndex(
                name: "IX_wallet_transactions_reference_type_reference_id_type",
                schema: "public",
                table: "wallet_transactions",
                columns: new[] { "reference_type", "reference_id", "type" },
                unique: true,
                filter: "reference_type IS NOT NULL AND reference_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_wallet_transactions_wallet_id_created_at",
                schema: "public",
                table: "wallet_transactions",
                columns: new[] { "wallet_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_wallets_owner_user_id",
                schema: "public",
                table: "wallets",
                column: "owner_user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_wallets_student_profile_id",
                schema: "public",
                table: "wallets",
                column: "student_profile_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_withdrawal_requests_payment_method_id",
                schema: "public",
                table: "withdrawal_requests",
                column: "payment_method_id");

            migrationBuilder.CreateIndex(
                name: "IX_withdrawal_requests_processed_by_user_id",
                schema: "public",
                table: "withdrawal_requests",
                column: "processed_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_withdrawal_requests_requested_by_user_id",
                schema: "public",
                table: "withdrawal_requests",
                column: "requested_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_withdrawal_requests_wallet_id",
                schema: "public",
                table: "withdrawal_requests",
                column: "wallet_id",
                unique: true,
                filter: "status IN ('PENDING', 'PROCESSING')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "admin_profiles",
                schema: "public");

            migrationBuilder.DropTable(
                name: "audit_logs",
                schema: "public");

            migrationBuilder.DropTable(
                name: "disbursements",
                schema: "public");

            migrationBuilder.DropTable(
                name: "notifications",
                schema: "public");

            migrationBuilder.DropTable(
                name: "project_attachments",
                schema: "public");

            migrationBuilder.DropTable(
                name: "project_offers",
                schema: "public");

            migrationBuilder.DropTable(
                name: "ratings",
                schema: "public");

            migrationBuilder.DropTable(
                name: "refunds",
                schema: "public");

            migrationBuilder.DropTable(
                name: "review_actions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "student_email_verifications",
                schema: "public");

            migrationBuilder.DropTable(
                name: "student_portfolio_item_skills",
                schema: "public");

            migrationBuilder.DropTable(
                name: "student_verifications",
                schema: "public");

            migrationBuilder.DropTable(
                name: "submission_files",
                schema: "public");

            migrationBuilder.DropTable(
                name: "user_email_verifications",
                schema: "public");

            migrationBuilder.DropTable(
                name: "user_external_logins",
                schema: "public");

            migrationBuilder.DropTable(
                name: "user_feature_entitlements",
                schema: "public");

            migrationBuilder.DropTable(
                name: "user_sessions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "wallet_transactions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "withdrawal_requests",
                schema: "public");

            migrationBuilder.DropTable(
                name: "project_applications",
                schema: "public");

            migrationBuilder.DropTable(
                name: "payments",
                schema: "public");

            migrationBuilder.DropTable(
                name: "student_portfolio_items",
                schema: "public");

            migrationBuilder.DropTable(
                name: "student_skills",
                schema: "public");

            migrationBuilder.DropTable(
                name: "project_submissions",
                schema: "public");

            migrationBuilder.DropTable(
                name: "payment_methods",
                schema: "public");

            migrationBuilder.DropTable(
                name: "wallets",
                schema: "public");

            migrationBuilder.DropTable(
                name: "escrows",
                schema: "public");

            migrationBuilder.DropTable(
                name: "feature_package_purchases",
                schema: "public");

            migrationBuilder.DropTable(
                name: "projects",
                schema: "public");

            migrationBuilder.DropTable(
                name: "feature_packages",
                schema: "public");

            migrationBuilder.DropTable(
                name: "design_categories",
                schema: "public");

            migrationBuilder.DropTable(
                name: "sme_profiles",
                schema: "public");

            migrationBuilder.DropTable(
                name: "student_profiles",
                schema: "public");

            migrationBuilder.DropTable(
                name: "files",
                schema: "public");

            migrationBuilder.DropTable(
                name: "subscription_plans",
                schema: "public");

            migrationBuilder.DropTable(
                name: "users",
                schema: "public");
        }
    }
}
