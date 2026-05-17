# D4U GitHub Workflow

Tai lieu nay dinh nghia quy trinh dung Git/GitHub khi vibe coding voi Codex agents cho D4U MVP.

## 1. Nguyen tac chinh

- Khong commit truc tiep len `main` khi dang implement feature.
- Moi MVP slice phai lam tren mot branch rieng.
- Moi branch nen nho, tap trung vao mot backlog group hoac mot vertical slice.
- Commit message dung conventional commits.
- Push branch len GitHub va tao Pull Request.
- PR phai mo ta scope, test da chay, va backlog item lien quan.
- Chi merge khi build pass va review xong.

## 2. Source of truth truoc khi code

Truoc moi task, agent phai doc:

- `BACKLOG_D4U_MVP.md`
- `MVP_D4U.md`
- `TECH_STACK_D4U.md`
- `D4U_ERD.dbml` neu task cham database
- `Entity_Dictionary_D4U.md` neu task cham entity/schema

## 3. Branch naming

Dung format:

```text
<type>/<scope>-<short-description>
```

Type hop le:

- `feat`: tinh nang moi.
- `fix`: sua loi.
- `docs`: tai lieu.
- `test`: them/sua test.
- `refactor`: refactor khong doi behavior.
- `chore`: cau hinh, tooling, cleanup.

Vi du:

```text
feat/schema-mvp-entities
feat/projects-create-publish
feat/auth-email-password
fix/escrow-release-transaction
docs/update-mvp-backlog
```

## 4. Commit message

Dung conventional commits:

```text
<type>(<scope>): <summary>
```

Vi du:

```text
feat(schema): add MVP EF entities
feat(projects): implement create and publish flow
fix(wallets): prevent negative available balance
docs(backlog): mark project slice complete
```

Quy tac:

- Summary viet tieng Anh ngan gon.
- Khong ket thuc bang dau cham.
- Moi commit nen build duoc neu co the.

## 5. Quy trinh lam viec chuan

### 5.1. Bat dau task moi

```powershell
git status --short
git pull --ff-only origin main
git switch -c feat/<scope>-<short-description>
```

Neu branch da ton tai:

```powershell
git switch feat/<scope>-<short-description>
git rebase main
```

### 5.2. Trong khi code

Kiem tra thay doi:

```powershell
git status --short
git diff
```

Build/test truoc commit:

```powershell
dotnet build D4U.Api/D4U.Api.csproj
```

Neu co test project:

```powershell
dotnet test
```

### 5.3. Commit

```powershell
git add .
git status --short
git commit -m "feat(scope): summary"
```

### 5.4. Push branch

```powershell
git push -u origin HEAD
```

### 5.5. Tao PR bang GitHub CLI neu co `gh`

```powershell
gh pr create --base main --head <branch-name> --title "feat(scope): summary" --body-file .github/PULL_REQUEST_TEMPLATE.md
```

Neu can xem trang thai PR:

```powershell
gh pr status
gh pr checks
```

### 5.6. Neu chua co GitHub CLI

Dung fallback:

1. Push branch bang `git push -u origin HEAD`.
2. Mo repo GitHub: `https://github.com/thinh2509/D4U_EXE201`.
3. Bam "Compare & pull request".
4. Copy noi dung template tu `.github/PULL_REQUEST_TEMPLATE.md`.

## 6. PR checklist

Moi PR phai co:

- Summary thay doi.
- Backlog items lien quan.
- Scope trong MVP.
- Test/build da chay.
- Rui ro hoac viec chua lam neu co.

Khong merge PR neu:

- Co thay doi ngoai MVP khong duoc user yeu cau.
- `dotnet build` fail.
- Cham payment/wallet/escrow ma khong co test hoac review ky.
- Cham schema ma khong cap nhat ERD/dictionary/backlog neu can.

## 7. Agent command pattern

Khi dung agent, prompt nen co dang:

```text
Use the D4U MVP .NET skill.
Create branch feat/<scope>-<short-description>.
Implement MVP slice: <slice name>.
Use BACKLOG_D4U_MVP.md as checklist.
Run dotnet build.
Commit using conventional commit.
Push branch to origin.
Do not merge to main.
```

Vi du:

```text
Use the D4U MVP .NET skill.
Create branch feat/schema-mvp-entities.
Implement the Schema Worker task: all MVP EF entities, enums, DbContext mappings, and seed data.
Run dotnet build.
Commit using "feat(schema): add MVP EF entity mappings".
Push branch to origin.
Do not merge to main.
```

## 8. Main branch protection khuyen nghi tren GitHub

Trong GitHub repo settings, nen bat:

- Require a pull request before merging.
- Require approvals.
- Require status checks to pass before merging.
- Require branches to be up to date before merging.
- Block force pushes.
- Block deletions.

Neu chua co CI, co the bat PR requirement truoc, them CI sau.

## 9. Viec agent phai cap nhat sau moi slice

- Cap nhat `BACKLOG_D4U_MVP.md` item da xong.
- Cap nhat docs neu thay doi API/schema/tech convention.
- Dam bao `README.md` van dung cach run.
- Khong sua `Requirement.md` de hop ly hoa code; chi sua khi user thay doi yeu cau.
