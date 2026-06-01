# D4U MVP

## Description

D4U (Design 4 You) is an MVP marketplace that connects Student Designers with SMEs that need design work. The MVP focuses on the core project lifecycle: an SME posts a design project, students apply or receive offers, the SME funds escrow, the selected student submits sketch and final deliverables, the SME reviews the work, funds are released, and both sides can rate each other.

## Tech Stack

- Backend: ASP.NET Core Web API
- Runtime: .NET 8
- Database: PostgreSQL
- ORM: Entity Framework Core 8 with Npgsql
- Read-query helper: Dapper for targeted read-only SQL queries
- Database strategy: EF Core Code First
- Mapping strategy: Fluent API with `IEntityTypeConfiguration<T>`
- Persistence patterns: Generic Repository and Unit of Work
- Cache: Redis via `IDistributedCache`, with local memory fallback
- Logging: Serilog structured logging
- Authentication: JWT Bearer, account email verification by SMTP, Google login, and optional OAuth2 external provider registration
- API documentation: Swagger/OpenAPI
- Local container runtime: Docker Desktop with Docker Compose
- IDE: Visual Studio 2022
- Source control: GitHub

## Features

- Email/password registration with SMTP email verification before login
- Role-based users: Student, SME, Admin
- Student and SME profile management
- Student verification reviewed by Admin
- SME subscription plans
- Open/private project creation and publishing
- Student applications and SME offers
- Escrow payment workflow through one selected real payment provider
- Paid feature package purchase flow for AI Matching entitlements
- Sketch and final milestones
- Submission upload and review actions
- Revision requests and invalid file reports
- Basic Student Portfolio Builder with project confidentiality checks
- Internal wallet ledger, disbursement, payment method, and manual withdrawal workflow
- Ratings after project completion
- In-app notification records
- Audit logs for important actions

## Architecture

The MVP uses a layered architecture inside one ASP.NET Core project for fast delivery while keeping responsibilities clear.

```text
D4U.Api/
  Controllers/
  Application/
    Common/
    Features/
  Domain/
    Entities/
    Enums/
  Infrastructure/
    Persistence/
      Configurations/
      Migrations/
  Program.cs
```

Layer responsibilities:

- API Layer: controllers, routing, request/response DTOs, authentication and authorization.
- Application Layer: use cases, business rules, validation, ownership checks, and transaction orchestration.
- Domain Layer: entities, enums, domain constants, and state rules.
- Infrastructure Layer: EF Core DbContext, Fluent API mappings, migrations, and external integrations.

## Backend Install Guide

Backend foundation details are documented in [BACKEND_FOUNDATION_D4U.md](BACKEND_FOUNDATION_D4U.md).

Completed feature manual E2E testing is documented in [D4U_COMPLETED_FEATURE_E2E_TEST_GUIDE_VI.md](D4U_COMPLETED_FEATURE_E2E_TEST_GUIDE_VI.md).

PayOS live payment and Cloudflare named tunnel setup is documented in [PAYOS_LIVE_SMOKE_RUNBOOK_VI.md](PAYOS_LIVE_SMOKE_RUNBOOK_VI.md).

The SME and Student back-and-forth core-flow test script is documented in [D4U_CORE_INTERACTION_E2E_TEST_GUIDE_VI.md](D4U_CORE_INTERACTION_E2E_TEST_GUIDE_VI.md).

### Prerequisites

- Visual Studio 2022 version 17.8 or newer
- ASP.NET and web development workload
- .NET 8 SDK
- PostgreSQL
- Docker Desktop, if running with Docker
- Git

### Clone

```powershell
git clone https://github.com/thinh2509/D4U_EXE201.git
cd D4U_EXE201
```

### Configure Database Without Docker

The project uses .NET User Secrets for local development. Do not put database passwords in `appsettings.json`.

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=d4u_mvp;Username=postgres;Password=your_password" --project D4U.Api
```

For deployed environments, configure `D4U_DATABASE_CONNECTION` as an environment variable.

### Run With Docker Desktop

Create a local `.env` file from `.env.example`, then change `POSTGRES_PASSWORD` and any local ports if needed:

```powershell
copy .env.example .env
```

If Google login is enabled, set the same Google OAuth client ID for backend validation and frontend build-time configuration:

```env
GOOGLE_AUTH_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

For email/password registration, configure SMTP so D4U can send account verification codes:

```env
EMAIL_SMTP_HOST=smtp.example.com
EMAIL_SMTP_PORT=587
EMAIL_USERNAME=your-smtp-username
EMAIL_PASSWORD=your-smtp-password
EMAIL_FROM_EMAIL=no-reply@example.com
EMAIL_FROM_NAME=D4U
EMAIL_USE_SSL=true
USER_EMAIL_CODE_EXPIRES_MINUTES=15
USER_EMAIL_CODE_LENGTH=6
```

For MVP payment-in, choose one real provider for production use. Keep `Mock` only for local development/tests:

```env
PAYMENT_PROVIDER=PayOS
PAYMENT_WEBHOOK_SECRET=your-provider-webhook-secret
PAYMENT_RETURN_URL=http://localhost:3000/payment/success
PAYMENT_CANCEL_URL=http://localhost:3000/payment/cancel
PAYMENT_PAYOS_CLIENT_ID=your-payos-client-id
PAYMENT_PAYOS_API_KEY=your-payos-api-key
PAYMENT_PAYOS_CHECKSUM_KEY=your-payos-checksum-key
```

Paid feature package purchases and escrow funding both use this payment-in provider. Student withdrawals remain manual in MVP: Admin/Finance transfers money externally, then updates the withdrawal status in D4U.

For Google OAuth, add these local frontend origins in Google Cloud Console:

```text
http://localhost:3000
http://127.0.0.1:3000
```

Start PostgreSQL, the API, and the frontend:

```powershell
docker compose up -d --build
```

The Docker Compose project name is `d4u-mvp`.

Frontend:

```text
http://localhost:3000
```

The frontend container serves the React app with Nginx and proxies `/api/*` to the API container. Frontend users should call the app URL above; API calls use the same browser origin.

API:

```text
http://localhost:8080
```

Swagger:

```text
http://localhost:8080/swagger
```

Health check:

```text
http://localhost:8080/health
```

The API container applies EF Core migrations automatically when `D4U_APPLY_MIGRATIONS=true`.

View API logs:

```powershell
docker compose logs -f api
```

View frontend logs:

```powershell
docker compose logs -f frontend
```

If `GOOGLE_AUTH_CLIENT_ID` changes, rebuild the frontend because Vite embeds `VITE_*` variables into the static bundle:

```powershell
docker compose build frontend
docker compose up -d frontend
```

Stop containers:

```powershell
docker compose down
```

Reset the local Docker database volume:

```powershell
docker compose down -v
```

### Restore and Build

```powershell
dotnet restore D4U.sln
dotnet build D4U.sln
```

### Apply Database Migrations

```powershell
dotnet ef database update --project D4U.Api --startup-project D4U.Api
```

### Run API Without Docker

```powershell
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

### Open in Visual Studio 2022

Open `D4U.sln`, set `D4U.Api` as the startup project, then run with `Ctrl + F5` or the Start button.
