# D4U GitHub Workflow

This document defines the Git and GitHub workflow for vibe coding with Codex agents on the D4U MVP.

## 1. Branch Model

D4U uses this branch model:

```text
main
develop
feature/*
hotfix/*
```

### main

Purpose:

- Production-ready code.
- Production branch currently deployed on Vercel.
- Receives merges only after feature review is complete, or from `hotfix/*` for urgent fixes.
- Must always build successfully.

Rules:

- Do not commit directly to `main`.
- Do not merge unfinished feature work into `main` just to test UI.
- Protect this branch in GitHub settings.

### develop

Purpose:

- Main integration branch for MVP development.
- All feature branches are created from `develop`.
- Keeps the next round of development organized before review and release.

Rules:

- Do not commit directly to `develop`.
- Use PRs from `feature/*`.
- Keep it buildable.

### feature/*

Purpose:

- One MVP slice or one focused task.

Naming:

```text
feature/<scope>-<short-description>
```

Examples:

```text
feature/schema-mvp-entities
feature/auth-email-password
feature/projects-create-publish
feature/wallet-withdrawal-request
```

Flow:

```text
develop -> feature/* -> review -> main
```

### hotfix/*

Purpose:

- Fix urgent production issues from `main`.

Naming:

```text
hotfix/<short-description>
```

Flow:

```text
main -> hotfix/* -> main
hotfix/* -> develop
```

Rules:

- Keep scope minimal.
- Merge back to both `main` and `develop`.

## 2. Core Rules

- Do not implement feature work directly on `main` or `develop`.
- Create one `feature/*` branch per MVP slice.
- Keep branches small and focused.
- Use conventional commit messages.
- Push the branch and open a Pull Request.
- Review feature work on the feature branch first, either locally or through Vercel Preview Deployment.
- Every PR must describe scope, validation, and related backlog items.
- Merge to `main` only after build and review are complete and the user explicitly approves release.

## 3. Source of Truth Before Coding

Before each task, agents should read:

- `BACKLOG_D4U_MVP.md`
- `MVP_D4U.md`
- `TECH_STACK_D4U.md`
- `D4U_ERD.dbml` for database work
- `Entity_Dictionary_D4U.md` for entity/schema work

## 4. Commit Messages

Use conventional commits:

```text
<type>(<scope>): <summary>
```

Valid types:

- `feat`: new feature.
- `fix`: bug fix.
- `docs`: documentation.
- `test`: tests.
- `refactor`: behavior-preserving code change.
- `chore`: configuration, tooling, cleanup.

Examples:

```text
feat(schema): add MVP EF entities
feat(projects): implement create and publish flow
fix(wallets): prevent negative available balance
docs(backlog): mark project slice complete
```

Rules:

- Use a short English summary.
- Do not end the summary with a period.
- Prefer commits that can still build.

## 5. Feature Workflow

### 5.1. Start a Feature

```powershell
git status --short
git switch develop
git pull --ff-only origin develop
git switch -c feature/<scope>-<short-description>
```

Example:

```powershell
git switch develop
git pull --ff-only origin develop
git switch -c feature/schema-mvp-entities
```

### 5.2. While Coding

```powershell
git status --short
git diff
```

Validate before commit:

```powershell
dotnet build D4U.sln
```

If a test project exists:

```powershell
dotnet test
```

### 5.3. Commit

```powershell
git add .
git status --short
git commit -m "feat(scope): summary"
```

### 5.4. Push Feature Branch

```powershell
git push -u origin HEAD
```

### 5.5. Review Before Merge

Preferred review options:

1. Local review by checking out the feature branch and running the app.
2. Vercel Preview Deployment for the feature branch.

Rules:

- Keep `main` stable while review is in progress.
- Do not merge feature work into `main` until review is complete.
- If a feature branch is only for review, it may stay open until the user explicitly approves merge.

### 5.6. Create PR into main

If `gh` is installed:

```powershell
gh pr create --base main --head feature/<branch-name> --title "feat(scope): summary" --body-file .github/PULL_REQUEST_TEMPLATE.md
```

Without GitHub CLI:

1. Push the branch with `git push -u origin HEAD`.
2. Open `https://github.com/thinh2509/D4U_EXE201`.
3. Click "Compare & pull request".
4. Set base branch to `main`.
5. Fill in `.github/PULL_REQUEST_TEMPLATE.md`.

## 6. Vercel Deployment Flow

- Keep `main` as the Production Branch on Vercel.
- Use Vercel Preview Deployments for `feature/*` review.
- Do not repoint the main production project to another long-lived review branch unless the deployment strategy is intentionally changed.
- Before merging to `main`, confirm the feature branch has been reviewed on local or preview and still passes:
  - `npm run build` in `FE`
  - `dotnet build D4U.sln` when backend changes are involved

After merge to `main`, merge the same release branch back into `develop`:

```text
release/* -> develop
```

## 7. Hotfix Workflow

Create a hotfix branch from `main`:

```powershell
git switch main
git pull --ff-only origin main
git switch -c hotfix/<short-description>
```

Open PR:

```text
hotfix/* -> main
```

After merge to `main`, merge the same hotfix back into `develop`:

```text
hotfix/* -> develop
```

## 8. PR Checklist

Every PR must include:

- Change summary.
- Related backlog items.
- Target branch.
- MVP scope confirmation.
- Build/test commands run.
- Risks or unfinished work, if any.

Do not merge a PR when:

- It targets the wrong base branch.
- It adds post-MVP features without explicit approval.
- `dotnet build D4U.sln` fails.
- It changes payment, escrow, wallet, or money movement without careful validation.
- It changes schema without updating docs when needed.

## 9. Agent Command Pattern

Use prompts like:

```text
Use the D4U MVP .NET skill.
Create branch feature/<scope>-<short-description> from develop.
Implement MVP slice: <slice name>.
Use BACKLOG_D4U_MVP.md as the checklist.
Run dotnet build D4U.sln.
Commit using a conventional commit.
Push the branch to origin.
Open PR into develop if GitHub CLI is available.
Do not merge.
```

Example:

```text
Use the D4U MVP .NET skill.
Create branch feature/schema-mvp-entities from develop.
Implement the Schema Worker task: all MVP EF Code First entities, enums, Fluent API configurations, DbContext mappings, relationships, indexes, seed subscription plans, seed design categories, and initial migration.
Run dotnet build D4U.sln.
Commit using "feat(schema): add MVP EF entity mappings".
Push branch to origin.
Open PR into develop if GitHub CLI is available.
Do not merge.
```

## 10. Recommended GitHub Branch Protection

For `main`:

- Require a pull request before merging.
- Require approvals.
- Require status checks to pass.
- Require branches to be up to date before merging.
- Block force pushes.
- Block branch deletions.

For `develop`:

- Require a pull request before merging.
- Require status checks to pass.
- Block force pushes.

## 11. Required Updates After Each Slice

- Update `BACKLOG_D4U_MVP.md` for completed items.
- Update docs when API, schema, or technical conventions change.
- Keep `README.md` accurate.
- Do not edit `Requirement.md` just to justify implementation decisions; edit it only when the user changes requirements.
