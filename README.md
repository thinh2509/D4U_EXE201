# D4U MVP

D4U is an MVP marketplace connecting Student Designers and SMEs with project applications, offers, escrow payment, sketch/final submissions, review, dispute handling, wallet withdrawal, rating, notifications, and audit logs.

## Stack

- ASP.NET Core Web API targeting .NET 8
- PostgreSQL
- EF Core with Npgsql
- Swagger/OpenAPI

## Project Docs

- MVP scope: `MVP_D4U.md`
- MVP backlog: `BACKLOG_D4U_MVP.md`
- Technical stack: `TECH_STACK_D4U.md`
- ERD DBML: `D4U_ERD.dbml`
- Entity dictionary: `Entity_Dictionary_D4U.md`
- Full requirement: `Requirement.md`
- Agent guide: `AGENTS.md`
- GitHub workflow: `GITHUB_WORKFLOW_D4U.md`
- Project skill: `.codex/skills/d4u-mvp-dotnet`

## Run API

Update the PostgreSQL connection string in `D4U.Api/appsettings.json`, then run:

```powershell
dotnet restore D4U.Api/D4U.Api.csproj
dotnet run --project D4U.Api/D4U.Api.csproj
```

Open Swagger at the URL printed by ASP.NET Core, usually:

```text
http://localhost:5000/swagger
```

## Vibe Coding Workflow

Use the project skill for implementation:

```text
Use the D4U MVP .NET skill to implement the Projects vertical slice.
```

For multi-agent work, split by ownership:

- Schema Worker: entities, enums, DbContext, migrations.
- Feature Worker: one vertical slice such as Projects, Offers, Submissions, Wallets.
- QA Reviewer: read-only review against MVP checklist.

Keep the first build MVP-only. Post-MVP features are listed in `MVP_D4U.md`.

## GitHub Workflow

Use branch + PR flow for implementation:

```powershell
git pull --ff-only origin main
git switch -c feat/<scope>-<short-description>
dotnet build D4U.Api/D4U.Api.csproj
git add .
git commit -m "feat(scope): summary"
git push -u origin HEAD
```

Full workflow: `GITHUB_WORKFLOW_D4U.md`.
