---
name: d4u-mvp-dotnet
description: Build and modify the D4U MVP backend using ASP.NET Core .NET 8, PostgreSQL, EF Core, and the project MVP documents. Use when implementing D4U MVP features, designing APIs, creating EF entities/migrations, reviewing backend architecture, splitting work across agents, or validating code against Requirement.md, MVP_D4U.md, D4U_ERD.dbml, and Entity_Dictionary_D4U.md.
---

# D4U MVP .NET

## Overview

D4U is an MVP marketplace connecting Student Designers and SMEs. Use this skill to keep backend implementation focused on MVP-only scope, with ASP.NET Core Web API, EF Core, PostgreSQL, Swagger, and clean module boundaries.

## Always Load First

Read only the files needed for the task:

- Product scope: `MVP_D4U.md`
- Implementation backlog: `BACKLOG_D4U_MVP.md`
- Technical stack: `TECH_STACK_D4U.md`
- GitHub workflow: `GITHUB_WORKFLOW_D4U.md`
- Schema source: `D4U_ERD.dbml`
- Entity details: `Entity_Dictionary_D4U.md`
- Full future scope, only when asked: `Requirement.md`

Use `references/agent-workflow.md` when planning or delegating work across agents.
Use `references/backend-guidelines.md` when implementing .NET code.
Use `references/mvp-boundaries.md` when deciding whether a feature belongs in MVP.

When the user asks to use GitHub commands, follow `GITHUB_WORKFLOW_D4U.md`: branch from `develop` using `feature/*`, implement one slice, build/test, commit with conventional commit, push branch, and open a PR into `develop` if possible. Use `release/*` for stabilization and `hotfix/*` for urgent production fixes. Do not merge unless the user explicitly asks.

## MVP Boundary

Build only the approved MVP scope unless the user explicitly asks for post-MVP work. Google authentication, EDU email verification, real payment-in through one selected provider, paid AI Matching, and basic Portfolio Builder are now MVP scope. Do not add chat realtime, non-Google social login, dispute workflow, dispute appeal, reputation ledger, standalone AI recommendation outside paid AI Matching, automatic bank payout, broad email/push delivery, advanced KYC, or mobile-native concerns to the first implementation.

## Backend Architecture

Prefer this structure:

```text
D4U.Api/
  Controllers/
  Domain/
    Entities/
    Enums/
  Infrastructure/
    Persistence/
  Application/
    Common/
    Features/
```

Keep controllers thin. Put business rules in application services. Put EF Core configuration in `Infrastructure/Persistence`.

## Implementation Order

1. Foundation: auth, users, profiles, file metadata, seed categories/plans.
2. Marketplace: projects, applications, offers, status history.
3. Execution: PayOS-funded escrow, fixed Sketch/Final submissions, unified review actions, revision/invalid file handling, auto-approve timeout, and Admin review resolution.
4. Money movement: completion, disbursement, internal wallet ledger, manual withdrawal processing.
5. Operations: verification admin, portfolio builder, rating, notification, audit.

## Agent Workflow

When the user asks to use agents, split work by ownership:

- Architect agent: validates module boundaries, API shape, and EF modeling choices.
- Schema agent: owns EF entities, enum mapping, DbContext, configurations, migrations.
- Feature agent: owns one vertical feature at a time, such as projects or submissions.
- QA agent: reviews tests, state transitions, missing validation, and security risks.

Do not let two agents edit the same file set at the same time. Give each worker a disjoint ownership area.

## Validation

Before finishing backend changes:

- Run `dotnet restore` if dependencies changed.
- Run `dotnet build`.
- Run tests when a test project exists.
- Check the implemented feature against `MVP_D4U.md` acceptance checklist.
- Update `BACKLOG_D4U_MVP.md` when a backlog item is completed or intentionally deferred.
- Mention any command that could not run because of NuGet, PostgreSQL, or sandbox permissions.
