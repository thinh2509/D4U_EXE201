# D4U MVP

## Description

D4U (Design 4 You) is an MVP marketplace that connects Student Designers with SMEs that need design work. The MVP focuses on the core project lifecycle: an SME posts a design project, students apply or receive offers, the SME funds escrow, the selected student submits sketch and final deliverables, the SME reviews the work, funds are released, and both sides can rate each other.

## Tech Stack

- Backend: ASP.NET Core Web API
- Runtime: .NET 8
- Database: PostgreSQL
- ORM: Entity Framework Core 8 with Npgsql
- Database strategy: EF Core Code First
- Mapping strategy: Fluent API with `IEntityTypeConfiguration<T>`
- API documentation: Swagger/OpenAPI
- Local container runtime: Docker Desktop with Docker Compose
- IDE: Visual Studio 2022
- Source control: GitHub

## Features

- Email/password authentication direction
- Role-based users: Student, SME, Admin
- Student and SME profile management
- Student verification reviewed by Admin
- SME subscription plans
- Open/private project creation and publishing
- Student applications and SME offers
- Escrow payment workflow
- Sketch and final milestones
- Submission upload and review actions
- Revision requests and invalid file reports
- Dispute opening, evidence, and Admin resolution
- Wallet balance, disbursement, payment method, and withdrawal workflow
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

Create a local `.env` file from `.env.example`, then change `POSTGRES_PASSWORD`:

```powershell
copy .env.example .env
```

Start PostgreSQL and the API:

```powershell
docker compose up -d --build
```

The Docker Compose project name is `d4u-mvp`. The API is bound to localhost only:

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
