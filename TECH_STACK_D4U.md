# D4U MVP Technical Stack

## 1. Purpose

This document defines the technical stack, architecture, conventions, and implementation strategy for the D4U MVP. It is the main technical guide for developers and Codex agents so implementation stays consistent and MVP-only.

Related source of truth:

- MVP scope: `MVP_D4U.md`
- MVP backlog: `BACKLOG_D4U_MVP.md`
- GitHub workflow: `GITHUB_WORKFLOW_D4U.md`
- MVP ERD: `D4U_ERD.dbml`
- Entity dictionary: `Entity_Dictionary_D4U.md`
- Agent guide: `AGENTS.md`
- Project skill: `.codex/skills/d4u-mvp-dotnet`

## 2. Core Stack

### 2.1. Backend

- Framework: ASP.NET Core Web API
- Target framework: .NET 8 (`net8.0`)
- Language: C#
- API style: REST
- Documentation: Swagger/OpenAPI
- ORM: Entity Framework Core 8
- PostgreSQL provider: Npgsql.EntityFrameworkCore.PostgreSQL

### 2.2. Database

- Database: PostgreSQL
- Migrations: EF Core Migrations
- ID strategy: UUID/GUID
- Money fields: `decimal(12,2)`
- C# timestamp type: `DateTimeOffset`
- Database naming: snake_case tables and columns

### 2.3. Authentication

MVP authentication:

- Email/password login.
- Password hashing.
- JWT access token.
- Refresh token stored as hash in `user_sessions`.
- Role-based authorization: `STUDENT`, `SME`, `ADMIN`.

Out of MVP:

- Social login.
- SSO.
- MFA.

### 2.4. File Storage

MVP direction:

- Store file metadata in PostgreSQL table `files`.
- Store binary files in external object storage or local development storage.
- Use signed URL or controlled endpoint for private file access.

Recommended production options:

- S3-compatible storage.
- Azure Blob Storage.
- Cloudflare R2.

Local development option:

- Local folder storage with metadata persisted in PostgreSQL.

### 2.5. Payment

MVP direction:

- Payment sandbox first.
- Provider can be PayOS, VNPAY, or a mocked provider behind an interface.
- Webhook handling must be idempotent.
- Escrow, payment, disbursement, and wallet transaction updates must be transactionally consistent.

## 3. Solution Structure

Current simple structure:

```text
D4U.Api/
  Controllers/
  Domain/
    Entities/
    Enums/
  Application/
    Common/
    Features/
  Infrastructure/
    Persistence/
  Program.cs
```

Recommended structure when the project grows:

```text
D4U.sln
src/
  D4U.Api/
  D4U.Application/
  D4U.Domain/
  D4U.Infrastructure/
tests/
  D4U.Tests/
  D4U.IntegrationTests/
```

For MVP speed, one Web API project is acceptable. Split into multiple projects when module boundaries or tests become difficult to manage.

## 4. Architecture Layers

### 4.1. API Layer

Responsibilities:

- HTTP routing.
- Authentication and authorization attributes.
- Request/response DTO binding.
- HTTP status codes.
- No business logic beyond basic input shape.

### 4.2. Application Layer

Responsibilities:

- Use cases.
- Business rules.
- Validation.
- Ownership checks that require database data.
- Transaction orchestration.
- Notification and audit event creation.

### 4.3. Domain Layer

Responsibilities:

- Entity classes.
- Domain enums.
- State transition helpers.
- Core business constants.

Keep the domain layer independent from ASP.NET-specific concepts.

### 4.4. Infrastructure Layer

Responsibilities:

- EF Core DbContext.
- Entity configuration.
- Database migrations.
- External integrations: payment provider, file storage, email later.
- System clock abstraction if needed.

## 5. MVP Module Boundaries

### 5.1. Auth

Owns register, login, refresh token, logout, password hashing, and JWT issuing.

Tables:

- `users`
- `user_sessions`

### 5.2. Profiles

Owns Student profile, SME profile, Admin profile, and Student verification.

Tables:

- `student_profiles`
- `sme_profiles`
- `admin_profiles`
- `student_verifications`
- `files`

### 5.3. Subscription

Owns Basic/Pro/Premium seed data, current SME subscription, project publishing limits, and platform fee rate lookup.

Tables:

- `subscription_plans`
- `sme_subscriptions`

### 5.4. Projects

Owns project drafts, publish/cancel, listing/detail, attachments, and status history.

Tables:

- `projects`
- `project_attachments`
- `project_status_histories`
- `design_categories`

### 5.5. Applications and Offers

Owns Student applications, SME offers, and Student accept/reject.

Tables:

- `project_applications`
- `project_offers`

### 5.6. Payments and Escrow

Owns escrow creation, payment creation, payment webhook, escrow status, refund, and disbursement.

Tables:

- `escrows`
- `payments`
- `refunds`
- `disbursements`

### 5.7. Project Execution

Owns milestone creation, Sketch submission, Final submission, review action, revision request, and invalid file report.

Tables:

- `project_milestones`
- `project_submissions`
- `submission_files`
- `review_actions`
- `revision_requests`
- `invalid_file_reports`

### 5.8. Wallets

Owns wallet balance, wallet ledger, payment methods, and withdrawal requests.

Tables:

- `wallets`
- `wallet_transactions`
- `payment_methods`
- `withdrawal_requests`

### 5.9. Disputes

Owns open dispute, evidence, Admin resolution, and refund/disbursement decision execution.

Tables:

- `disputes`
- `dispute_evidences`

### 5.10. Trust and Operations

Owns ratings, in-app notifications, and audit logs.

Tables:

- `ratings`
- `notifications`
- `audit_logs`

## 6. API Conventions

### 6.1. Route Style

Use plural resources:

```text
/api/auth/register
/api/auth/login
/api/projects
/api/projects/{projectId}
/api/projects/{projectId}/applications
/api/offers/{offerId}/accept
/api/submissions/{submissionId}/approve
/api/wallets/me
```

### 6.2. Response Style

Use response DTOs. Do not return EF entities directly.

Success example:

```json
{
  "id": "uuid",
  "status": "OPEN"
}
```

Error example:

```json
{
  "error": {
    "code": "PROJECT_BUDGET_EXCEEDS_PLAN",
    "message": "Project budget exceeds the current subscription plan limit."
  }
}
```

### 6.3. HTTP Status Codes

- `200 OK`: successful read/update/action.
- `201 Created`: resource created.
- `204 No Content`: successful action with no body.
- `400 Bad Request`: invalid input or business validation failure.
- `401 Unauthorized`: not authenticated.
- `403 Forbidden`: authenticated but not allowed.
- `404 Not Found`: missing resource or hidden by ownership rule.
- `409 Conflict`: duplicate application, invalid state transition, or idempotency conflict.

## 7. Authorization Rules

### 7.1. Role Checks

- Student endpoints require `STUDENT`.
- SME project creation/review endpoints require `SME`.
- Admin operation endpoints require `ADMIN`.

### 7.2. Ownership Checks

Always check ownership for:

- SME editing/reviewing only own projects.
- Student submitting only selected projects.
- Student viewing own wallet and withdrawals.
- User accessing own files unless Admin or explicit project permission applies.

### 7.3. Blocked Users

Users with `SUSPENDED`, `BANNED`, or `DELETED` status must not perform protected business actions.

## 8. EF Core Conventions

### 8.1. Entity Mapping

- Map tables and columns explicitly to snake_case.
- Configure indexes from `D4U_ERD.dbml`.
- Configure decimal precision for money fields.
- Configure max lengths from the ERD.
- Configure relationships explicitly.

### 8.2. Enums

Recommended MVP approach:

- Store enum values as strings for readability.
- Keep C# enums in `Domain/Enums`.
- Convert with EF Core `.HasConversion<string>()`.

### 8.3. Migrations

Commands:

```powershell
dotnet ef migrations add InitialMvpSchema --project D4U.Api
dotnet ef database update --project D4U.Api
```

If `dotnet-ef` is missing:

```powershell
dotnet tool install --global dotnet-ef
```

### 8.4. Seed Data

Seed minimum data:

- Subscription plans: BASIC, PRO, PREMIUM.
- Design categories from `MVP_D4U.md`.
- Optional development Admin user.

## 9. State Machines

### 9.1. Project

Important states:

- `DRAFT`
- `OPEN`
- `OFFER_SELECTED`
- `PAYMENT_SECURED`
- `WAITING_FOR_ACCEPTANCE`
- `IN_PROGRESS`
- `SKETCH_IN_REVIEW`
- `REVISION_REQUESTED`
- `FINAL_IN_REVIEW`
- `COMPLETED`
- `DISPUTED`
- `CANCELLED`

Always write `project_status_histories` when project status changes.

### 9.2. Offer

```text
PENDING_PAYMENT -> WAITING_ACCEPTANCE -> ACCEPTED
PENDING_PAYMENT -> REVOKED
WAITING_ACCEPTANCE -> REJECTED
WAITING_ACCEPTANCE -> EXPIRED
```

### 9.3. Escrow

```text
PENDING_PAYMENT -> FUNDED -> RELEASE_PENDING -> RELEASED
FUNDED -> DISPUTED -> RELEASED
FUNDED -> DISPUTED -> REFUNDED
FUNDED -> REFUNDED
```

### 9.4. Milestone

```text
PENDING -> SUBMITTED -> IN_REVIEW -> APPROVED
IN_REVIEW -> REVISION_REQUESTED
IN_REVIEW -> AUTO_APPROVED
```

## 10. Transaction Boundaries

Use database transactions for:

- Payment webhook updates payment + escrow + offer/project status.
- Student accepts offer + project starts + milestones are created.
- Final approval + disbursement + wallet credit + wallet transaction + escrow release.
- Dispute resolution + refund/disbursement + escrow/project status update.
- Withdrawal processing + wallet debit + wallet transaction.

## 11. Testing Strategy

### 11.1. Unit Tests

Use for:

- State transition rules.
- Subscription limit validation.
- Platform fee calculation.
- Wallet balance calculation.

### 11.2. Integration Tests

Use for:

- API endpoint behavior.
- EF Core mapping.
- Auth and authorization.
- Key MVP workflows.

Recommended test database:

- PostgreSQL test container if available.
- Separate local PostgreSQL database if containers are not available.

### 11.3. MVP Workflow Tests

Priority flows:

1. SME publishes project within Basic limits.
2. Student applies once; duplicate application fails.
3. SME creates offer and pays escrow.
4. Student accepts offer; project starts and milestones are created.
5. Student submits Sketch and SME approves.
6. Student submits Final and SME approves.
7. Escrow releases to wallet.
8. Student creates withdrawal request.
9. Dispute blocks escrow release.
10. Rating is allowed after completion and duplicate rating fails.

## 12. Logging and Audit

Use structured logs for:

- Authentication failures.
- Payment webhook events.
- Escrow state changes.
- Wallet transactions.
- Dispute resolution.
- Unexpected exceptions.

Write audit logs for:

- Admin verification decisions.
- Project publish/cancel.
- Payment webhook success/failure.
- Escrow funded/released/refunded/disputed.
- Admin dispute resolution.
- Wallet balance changes.
- Withdrawal processing.
- User status changes.

## 13. Local Development

### 13.1. Prerequisites

- .NET SDK that can target .NET 8.
- PostgreSQL.
- Optional: pgAdmin or another database client.

### 13.2. Connection String

Set in `D4U.Api/appsettings.json` or user secrets:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=d4u_mvp;Username=postgres;Password=postgres"
  }
}
```

Prefer user secrets for real credentials:

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=d4u_mvp;Username=postgres;Password=your_password" --project D4U.Api
```

### 13.3. Run

```powershell
dotnet restore D4U.Api/D4U.Api.csproj
dotnet build D4U.Api/D4U.Api.csproj
dotnet run --project D4U.Api/D4U.Api.csproj
```

Swagger:

```text
http://localhost:5000/swagger
```

Health check:

```text
http://localhost:5000/health
```

## 14. MVP Deployment Direction

Recommended simple MVP deployment:

- Backend: containerized ASP.NET Core app.
- Database: managed PostgreSQL.
- File storage: S3-compatible object storage.
- Secrets: environment variables or cloud secret manager.
- Logs: platform log aggregation.

Required environment variables:

- `ConnectionStrings__DefaultConnection`
- `Jwt__Issuer`
- `Jwt__Audience`
- `Jwt__SigningKey`
- `Payment__Provider`
- `Payment__WebhookSecret`
- `Storage__Provider`
- `Storage__Bucket`

## 15. Agent Usage Guidance

When using Codex agents, use:

```text
Use the D4U MVP .NET skill.
```

Good task shape:

```text
Use the D4U MVP .NET skill. Implement MVP slice: Projects.

Scope:
- project create/publish/list/detail
- subscription limit validation
- project status history

Own files:
- Application/Features/Projects
- Controllers/ProjectsController.cs

Do not implement:
- payment
- submission
- dispute
```

For review:

```text
Use the D4U MVP .NET skill. Review the Projects slice against MVP_D4U.md, D4U_ERD.dbml, and TECH_STACK_D4U.md. Do not edit files. Report bugs, risks, and missing tests.
```

## 16. Non-MVP Guardrail

Do not implement unless explicitly requested:

- AI recommendation.
- Realtime chat.
- Social login.
- Portfolio builder.
- Skill/software matching.
- Dispute appeal.
- Reputation ledger.
- Email/push notification pipeline.
- Advanced KYC.
- Native mobile app.
