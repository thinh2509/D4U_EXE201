# D4U GitHub Workflow

This document defines the Git and GitHub workflow for vibe coding with Codex agents on the D4U MVP.

## 1. Core Rules

- Do not implement feature work directly on `main`.
- Create one branch per MVP slice.
- Keep branches small and focused.
- Use conventional commit messages.
- Push the branch and open a Pull Request.
- Every PR must describe scope, validation, and related backlog items.
- Merge only after build and review are complete.

## 2. Source of Truth Before Coding

Before each task, agents should read:

- `BACKLOG_D4U_MVP.md`
- `MVP_D4U.md`
- `TECH_STACK_D4U.md`
- `D4U_ERD.dbml` for database work
- `Entity_Dictionary_D4U.md` for entity/schema work

## 3. Branch Naming

Use:

```text
<type>/<scope>-<short-description>
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
feat/schema-mvp-entities
feat/projects-create-publish
feat/auth-email-password
fix/escrow-release-transaction
docs/update-mvp-backlog
```

## 4. Commit Messages

Use conventional commits:

```text
<type>(<scope>): <summary>
```

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

## 5. Standard Workflow

### 5.1. Start a New Task

```powershell
git status --short
git pull --ff-only origin main
git switch -c feat/<scope>-<short-description>
```

If the branch already exists:

```powershell
git switch feat/<scope>-<short-description>
git rebase main
```

### 5.2. While Coding

```powershell
git status --short
git diff
```

Validate before commit:

```powershell
dotnet build D4U.Api/D4U.Api.csproj
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

### 5.4. Push Branch

```powershell
git push -u origin HEAD
```

### 5.5. Create PR with GitHub CLI

If `gh` is installed:

```powershell
gh pr create --base main --head <branch-name> --title "feat(scope): summary" --body-file .github/PULL_REQUEST_TEMPLATE.md
```

Check PR status:

```powershell
gh pr status
gh pr checks
```

### 5.6. Fallback Without GitHub CLI

1. Push the branch with `git push -u origin HEAD`.
2. Open `https://github.com/thinh2509/D4U_EXE201`.
3. Click "Compare & pull request".
4. Fill in `.github/PULL_REQUEST_TEMPLATE.md`.

## 6. PR Checklist

Every PR must include:

- Change summary.
- Related backlog items.
- MVP scope confirmation.
- Build/test commands run.
- Risks or unfinished work, if any.

Do not merge a PR when:

- It adds post-MVP features without explicit approval.
- `dotnet build` fails.
- It changes payment, escrow, wallet, or money movement without careful validation.
- It changes schema without updating docs when needed.

## 7. Agent Command Pattern

Use prompts like:

```text
Use the D4U MVP .NET skill.
Create branch feat/<scope>-<short-description>.
Implement MVP slice: <slice name>.
Use BACKLOG_D4U_MVP.md as the checklist.
Run dotnet build.
Commit using a conventional commit.
Push the branch to origin.
Do not merge to main.
```

Example:

```text
Use the D4U MVP .NET skill.
Create branch feat/schema-mvp-entities.
Implement the Schema Worker task: all MVP EF entities, enums, DbContext mappings, and seed data.
Run dotnet build.
Commit using "feat(schema): add MVP EF entity mappings".
Push branch to origin.
Do not merge to main.
```

## 8. Recommended GitHub Branch Protection

In GitHub repository settings, enable:

- Require a pull request before merging.
- Require approvals.
- Require status checks to pass before merging.
- Require branches to be up to date before merging.
- Block force pushes.
- Block branch deletions.

If CI is not complete yet, enable PR requirement first and add CI checks later.

## 9. Required Updates After Each Slice

- Update `BACKLOG_D4U_MVP.md` for completed items.
- Update docs when API, schema, or technical conventions change.
- Keep `README.md` accurate.
- Do not edit `Requirement.md` just to justify implementation decisions; edit it only when the user changes requirements.
