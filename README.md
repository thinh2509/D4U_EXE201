# D4U MVP

## Description

D4U (Design 4 You) is an MVP marketplace that connects Student Designers with SMEs that need design work. The MVP focuses on a complete project workflow: SME posts a project, Student applies or receives an offer, SME funds escrow, Student submits Sketch and Final deliverables, SME reviews the work, funds are released to the Student wallet, and both parties can rate each other.

## Tech Stack

- Backend: ASP.NET Core Web API
- Runtime: .NET 8
- Database: PostgreSQL
- ORM: Entity Framework Core 8 with Npgsql
- Database strategy: EF Core Code First
- Mapping strategy: Fluent API with `IEntityTypeConfiguration<T>`
- API documentation: Swagger/OpenAPI
- Authentication direction: JWT access token + refresh sessions
- Validation direction: FluentValidation
- Error handling direction: ProblemDetails

## Features

- Email/password registration and login
- Role-based users: Student, SME, Admin
- Student and SME profile management
- Student verification reviewed by Admin
- Subscription plans for SME project limits and platform fee rates
- Open/private project creation and publishing
- Student applications and SME offers
- Escrow payment flow
- Sketch and Final milestones
- Submission upload and review actions
- Revision requests and invalid file reports
- Dispute opening, evidence, and Admin resolution
- Wallet balance, disbursement, payment methods, and withdrawal requests
- Ratings after project completion
- In-app notifications
- Audit logs for important actions

## Architecture

The MVP uses a layered architecture inside one ASP.NET Core project for speed and clarity.

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
  Program.cs
```

Layer responsibilities:

- API Layer: controllers, routing, authentication/authorization, DTO binding, HTTP responses.
- Application Layer: use cases, business rules, validation, ownership checks, transaction orchestration.
- Domain Layer: entities, enums, state transition helpers, domain constants.
- Infrastructure Layer: EF Core DbContext, Fluent API configurations, migrations, external integrations.

The project can later be split into separate `D4U.Api`, `D4U.Application`, `D4U.Domain`, `D4U.Infrastructure`, and test projects after the MVP is validated.

## Backend Install Guide

### Prerequisites

- Visual Studio 2022 version 17.8 or newer
- ASP.NET and web development workload
- .NET 8 SDK
- PostgreSQL

### Clone

```powershell
git clone https://github.com/thinh2509/D4U_EXE201.git
cd D4U_EXE201
```

### Configure Database

Update `D4U.Api/appsettings.json` or use user secrets:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=d4u_mvp;Username=postgres;Password=postgres"
  }
}
```

Recommended local secret setup:

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=d4u_mvp;Username=postgres;Password=your_password" --project D4U.Api
```

### Restore and Build

```powershell
dotnet restore D4U.sln
dotnet build D4U.sln
```

### Run API

```powershell
dotnet run --project D4U.Api/D4U.Api.csproj
```

Swagger is available at:

```text
http://localhost:5000/swagger
```

Health check:

```text
http://localhost:5000/health
```

### Open in Visual Studio 2022

Open `D4U.sln` directly in Visual Studio 2022, set `D4U.Api` as the startup project, then run with `Ctrl + F5` or the Start button.
