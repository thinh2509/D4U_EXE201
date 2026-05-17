# D4U Agent Guide

Use the project-local skill at `.codex/skills/d4u-mvp-dotnet` for all D4U MVP implementation work.

## Project Stack

- ASP.NET Core Web API targeting .NET 8.
- PostgreSQL.
- EF Core with Npgsql.
- Swagger for local API exploration.

## Source of Truth

- MVP scope: `MVP_D4U.md`.
- MVP backlog: `BACKLOG_D4U_MVP.md`.
- Technical stack: `TECH_STACK_D4U.md`.
- GitHub workflow: `GITHUB_WORKFLOW_D4U.md`.
- ERD code: `D4U_ERD.dbml`.
- Entity dictionary: `Entity_Dictionary_D4U.md`.
- Broader product requirement: `Requirement.md`.

## Working Rules

- Keep implementation MVP-only unless the user explicitly expands scope.
- Use `BACKLOG_D4U_MVP.md` as the implementation checklist and update it as slices are completed.
- Use the branch + PR flow from `GITHUB_WORKFLOW_D4U.md`; do not commit feature work directly to `main`.
- Preserve the 34-entity MVP as the first database target.
- Do not add post-MVP features such as AI recommendation, realtime chat, social login, dispute appeal, or reputation ledger.
- Prefer thin controllers, application services, EF Core persistence configuration, and DTOs.
- Validate with `dotnet build` and tests when possible.

## Agent Roles

- Architect: read-only planning and boundary review.
- Schema Worker: EF entities, enums, DbContext, mappings, migrations.
- Feature Worker: one vertical feature at a time.
- QA Reviewer: read-only bug, test, and security review.
