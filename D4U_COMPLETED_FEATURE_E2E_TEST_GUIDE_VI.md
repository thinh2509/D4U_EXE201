# D4U Completed Feature E2E Test Guide

PayOS live smoke va Cloudflare named tunnel duoc huong dan rieng tai [PAYOS_LIVE_SMOKE_RUNBOOK_VI.md](PAYOS_LIVE_SMOKE_RUNBOOK_VI.md).

Kich ban test core theo tuong tac SME va Student tung buoc nam tai [D4U_CORE_INTERACTION_E2E_TEST_GUIDE_VI.md](D4U_CORE_INTERACTION_E2E_TEST_GUIDE_VI.md).

## 0. Core Flow Workspace Va Live Payment

Kich ban Done uu tien trong tuan `01/06/2026` den `07/06/2026`:

1. SME dang project; Student apply.
2. SME tao offer; Student accept.
3. SME mo `/projects/{projectId}/execution`, chon thanh toan PayOS va thanh toan that.
4. Return page chi poll `GET /api/v1/payments/{paymentId}`. Client khong duoc tu cap nhat payment success.
5. Webhook PayOS hop le chuyen payment sang `SUCCESS`, escrow sang `FUNDED`, project sang `IN_PROGRESS`.
6. Student vao workspace, upload jpg/png/pdf toi da 20 MB qua `POST /api/v1/files/submissions`, sau do nop Sketch.
7. SME vao workspace, download file va approve Sketch hoac request revision/report invalid file.
8. Student nop Final; SME approve.
9. Completion handoff chuyen escrow sang `RELEASE_PENDING`; hosted worker release idempotent sang `RELEASED`.
10. Vi Student tang dung net amount; chi co mot disbursement va mot `DISBURSEMENT_CREDIT`.

SQL kiem tra bo sung:

```sql
select id, status, provider, paid_at from payments order by created_at desc limit 5;
select id, project_id, status, funded_at, released_at from escrows order by created_at desc limit 5;
select escrow_id, gross_amount, platform_fee_amount, net_amount, status from disbursements order by created_at desc limit 5;
select user_id, available_balance, locked_balance from wallets order by created_at desc limit 5;
select type, amount, balance_after, reference_type, reference_id from wallet_transactions order by created_at desc limit 10;
```

Withdrawal trong tranche nay chi smoke manual: Student tao request; Admin complete hoac fail; balance khong am. Refund split rules thuoc Phase 4B.

TÃ i liá»‡u nÃ y dÃ¹ng Ä‘á»ƒ test thá»§ cÃ´ng toÃ n bá»™ feature D4U Ä‘Ã£ hoÃ n thÃ nh trÃªn branch `develop`. Ná»™i dung bÃ¡m theo cÃ¡c má»¥c Ä‘Ã£ tick `[x]` trong `BACKLOG_D4U_MVP.md`: Phase 1 Foundation, Phase 2 Marketplace, Phase 3A PayOS Escrow Payment, vÃ  Phase 3B Project Execution.

KhÃ´ng xem cÃ¡c pháº§n sau lÃ  Ä‘Ã£ hoÃ n thÃ nh: Phase 4 refund/cancellation split rules, Portfolio Builder backend, Ratings, Paid Feature Packages, AI Matching entitlement, notification Ä‘áº§y Ä‘á»§, automatic bank payout.

## 1. Chuáº©n Bá»‹ MÃ´i TrÆ°á»ng

### 1.1. Branch VÃ  Validation Nhanh

```powershell
cd D:\Codex
git switch develop
git pull --ff-only origin develop
git status --short --branch
dotnet build D4U.sln
cd FE
npm run build
npm run lint
cd ..
```

Ká»³ vá»ng:

- Branch lÃ  `develop`.
- Working tree sáº¡ch.
- Backend build pass.
- Frontend build vÃ  lint pass.
- Náº¿u Vite bÃ¡o chunk lá»›n hÆ¡n 500 kB, ghi nháº­n lÃ  warning, khÃ´ng pháº£i blocker cho E2E manual test.

### 1.2. Docker Local

Docker Desktop pháº£i cháº¡y trÆ°á»›c khi dÃ¹ng Docker Compose.

```powershell
cd D:\Codex
docker compose down -v
docker compose up -d --build
docker compose ps
```

Ká»³ vá»ng:

- `d4u-postgres` healthy.
- `d4u-api` running.
- `d4u-frontend` running.
- API tá»± cháº¡y EF migrations vÃ¬ `D4U_APPLY_MIGRATIONS=true` trong `docker-compose.yml`.

Náº¿u Docker bÃ¡o khÃ´ng káº¿t ná»‘i Ä‘Æ°á»£c `dockerDesktopLinuxEngine`, má»Ÿ Docker Desktop rá»“i cháº¡y láº¡i.

### 1.3. URL Test

| Má»¥c | URL |
| --- | --- |
| Frontend | `http://localhost:3000` |
| Login | `http://localhost:3000/login` |
| Register | `http://localhost:3000/register` |
| Verify account email | `http://localhost:3000/verify-email` |
| Swagger | `http://localhost:8080/swagger` |
| API base | `http://localhost:8080/api/v1` |

### 1.4. `.env` Tá»‘i Thiá»ƒu

```env
POSTGRES_DB=d4u_mvp
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me
POSTGRES_PORT=5433
D4U_API_PORT=8080
D4U_FRONTEND_PORT=3000

JWT_ISSUER=d4u-api
JWT_AUDIENCE=d4u-client
JWT_SIGNING_KEY=replace-with-a-local-development-signing-key-at-least-32-characters

ADMIN_EMAIL=admin.d4u.local@example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@123456
ADMIN_FULL_NAME=D4U Admin

AI_PROVIDER=Mock
AI_MODEL=mock-project-brief-v1

EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USERNAME=
EMAIL_PASSWORD=
EMAIL_FROM_EMAIL=
EMAIL_FROM_NAME=D4U
EMAIL_USE_SSL=true

GOOGLE_AUTH_CLIENT_ID=

PAYMENT_PROVIDER=Mock
PAYMENT_RETURN_URL=http://localhost:3000/payment/success
PAYMENT_CANCEL_URL=http://localhost:3000/payment/cancel
PAYMENT_PAYOS_CLIENT_ID=
PAYMENT_PAYOS_API_KEY=
PAYMENT_PAYOS_CHECKSUM_KEY=
PAYMENT_PAYOS_BASE_URL=https://api-merchant.payos.vn

STUDENT_EMAIL_ALLOWED_DOMAIN_0=edu
STUDENT_EMAIL_ALLOWED_DOMAIN_1=edu.vn
STUDENT_EMAIL_INCLUDE_CODE_IN_RESPONSE=true
```

Ghi chÃº:

- SMTP tháº­t cáº§n Gmail App Password hoáº·c provider SMTP há»£p lá»‡.
- Google login chá»‰ test Ä‘Æ°á»£c náº¿u `GOOGLE_AUTH_CLIENT_ID` há»£p lá»‡ vÃ  frontend Ä‘Ã£ rebuild.
- PayOS tháº­t cáº§n credentials vÃ  webhook public callback hoáº·c cÃ´ng cá»¥ tunnel.
- Local/test cÃ³ thá»ƒ dÃ¹ng `PAYMENT_PROVIDER=Mock`; mock provider khÃ´ng gá»i PayOS tháº­t, tráº£ checkout URL/QR giáº£ vÃ  cháº¥p nháº­n webhook cÃ³ `signature = ""` hoáº·c `"mock"`.
- EDU verification local cÃ³ thá»ƒ dÃ¹ng `STUDENT_EMAIL_INCLUDE_CODE_IN_RESPONSE=true` Ä‘á»ƒ láº¥y code trong response.

### 1.5. PostgreSQL Check

Káº¿t ná»‘i DBeaver/pgAdmin:

| Field | Value |
| --- | --- |
| Host | `localhost` |
| Port | `5433` hoáº·c `POSTGRES_PORT` |
| Database | `d4u_mvp` |
| Username | `postgres` |
| Password | `POSTGRES_PASSWORD` |

SQL seed check:

```sql
select count(*) as users_count from users;
select count(*) as categories_count from design_categories;
select count(*) as plans_count from subscription_plans;

select code, name, max_active_open_projects, max_project_budget, platform_fee_rate
from subscription_plans
order by monthly_price;
```

Ká»³ vá»ng:

- CÃ³ seed `design_categories`.
- CÃ³ seed `Basic`, `Pro`, `Premium`.
- CÃ³ admin bootstrap náº¿u `.env` cÃ³ `ADMIN_EMAIL` vÃ  `ADMIN_PASSWORD`.

## 2. Test Data Máº«u

| Role | Email máº«u | Password |
| --- | --- | --- |
| Student | `student.d4u.test+001@gmail.com` | `Student@123456` |
| SME | `sme.d4u.test+001@gmail.com` | `Sme@123456` |
| Admin | `ADMIN_EMAIL` trong `.env` | `ADMIN_PASSWORD` trong `.env` |

Project máº«u:

```json
{
  "title": "Thiáº¿t káº¿ bá»™ nháº­n diá»‡n quÃ¡n cÃ  phÃª",
  "brief": "Thiáº¿t káº¿ logo, báº£ng mÃ u vÃ  guideline cÆ¡ báº£n cho má»™t quÃ¡n cÃ  phÃª specialty má»›i táº¡i TP.HCM.",
  "usagePurpose": "DÃ¹ng cho báº£ng hiá»‡u, menu, social media vÃ  bao bÃ¬.",
  "projectType": "OPEN",
  "budgetAmount": 3000000,
  "currency": "VND",
  "isConfidential": false,
  "allowStudentPortfolio": true
}
```

Deadline gá»£i Ã½:

- `sketchDeadlineAt`: ngÃ y mai hoáº·c sau Ä‘Ã³.
- `finalDeadlineAt`: sau sketch deadline.
- `totalDeadlineAt`: sau final deadline.

## 3. Auth VÃ  Account

### 3.1. Register Student/SME

UI:

- `http://localhost:3000/register`

API:

- `POST /api/v1/auth/register`

Request:

```json
{
  "email": "student.d4u.test+001@gmail.com",
  "username": "student001",
  "password": "Student@123456",
  "fullName": "Student Test 001",
  "role": "STUDENT"
}
```

Expected:

- API tráº£ user má»›i.
- User cÃ³ `status = PENDING`.
- `email_verified_at` Ä‘ang null.
- Login email/password bá»‹ cháº·n trÆ°á»›c khi verify email.

SQL:

```sql
select email, username, role, status, email_verified_at
from users
where email in ('student.d4u.test+001@gmail.com', 'sme.d4u.test+001@gmail.com');

select email, status, requested_at, expires_at, confirmed_at
from user_email_verifications
order by requested_at desc;
```

### 3.2. Request VÃ  Confirm Account Email

UI:

- `http://localhost:3000/verify-email`

API:

- `POST /api/v1/auth/email-verification/request`
- `POST /api/v1/auth/email-verification/confirm`

Request code:

```json
{
  "email": "student.d4u.test+001@gmail.com"
}
```

Confirm:

```json
{
  "email": "student.d4u.test+001@gmail.com",
  "code": "123456"
}
```

Expected:

- Confirm Ä‘Ãºng code tráº£ `status = CONFIRMED`.
- `users.email_verified_at` Ä‘Æ°á»£c set.
- Login email/password báº¯t Ä‘áº§u thÃ nh cÃ´ng.

Negative:

- Confirm code sai tráº£ lá»—i.
- Login trÆ°á»›c verify tráº£ lá»—i unauthorized.

### 3.3. Login, Me, Refresh, Logout

API:

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

Login request:

```json
{
  "email": "student.d4u.test+001@gmail.com",
  "password": "Student@123456"
}
```

Expected:

- Login tráº£ `accessToken`, `refreshToken`, user role Ä‘Ãºng.
- `/auth/me` tráº£ current user khi cÃ³ Bearer token.
- Refresh tráº£ access/refresh token má»›i.
- Logout revoke refresh session.

SQL:

```sql
select user_id, revoked_at, expires_at, created_at
from user_sessions
order by created_at desc;
```

### 3.4. Google Login

UI:

- `http://localhost:3000/login`

API:

- `POST /api/v1/auth/google`

Request:

```json
{
  "idToken": "<google-id-token>",
  "role": "STUDENT"
}
```

Expected:

- Chá»‰ há»— trá»£ `STUDENT` vÃ  `SME`.
- Táº¡o/link user theo Google email.
- LÆ°u metadata provider trong `user_external_logins`.
- KhÃ´ng lÆ°u Google access token.

Skip náº¿u chÆ°a cáº¥u hÃ¬nh `GOOGLE_AUTH_CLIENT_ID`.

## 4. Profile VÃ  Verification

### 4.1. Student Profile

UI:

- `http://localhost:3000/student/profile`

API:

- `PUT /api/v1/students/me`
- `GET /api/v1/students/me`

Request:

```json
{
  "school": "D4U University",
  "major": "Graphic Design",
  "studyStartYear": 2023,
  "bio": "Sinh viÃªn thiáº¿t káº¿ Ä‘ang tÃ¬m dá»± Ã¡n nháº­n diá»‡n thÆ°Æ¡ng hiá»‡u."
}
```

Expected:

- Profile Ä‘Æ°á»£c táº¡o/cáº­p nháº­t.
- `verificationStatus` ban Ä‘áº§u lÃ  `NOT_SUBMITTED` hoáº·c chÆ°a approved.

### 4.2. SME Profile

UI:

- `http://localhost:3000/sme/profile`

API:

- `PUT /api/v1/smes/me`
- `GET /api/v1/smes/me`

Request:

```json
{
  "companyName": "D4U Coffee Lab",
  "representativeName": "SME Test 001",
  "phoneNumber": "0900000001",
  "businessField": "Food and Beverage",
  "logoFileId": null
}
```

Expected:

- SME profile Ä‘Æ°á»£c táº¡o.
- Basic subscription plan Ä‘Æ°á»£c gÃ¡n khi cáº§n publish/pay.

### 4.3. Student Document Verification

UI:

- `http://localhost:3000/student/verification`

API:

- `POST /api/v1/students/me/verification`

Request metadata:

```json
{
  "storageProvider": "LOCAL",
  "bucket": null,
  "storageKey": "App_Data/uploads/student-card-001.pdf",
  "originalFilename": "student-card-001.pdf",
  "mimeType": "application/pdf",
  "fileExtension": "pdf",
  "fileSizeBytes": 123456,
  "checksum": null
}
```

Expected:

- Táº¡o `files` record.
- Táº¡o `student_verifications` status `PENDING`.
- Chá»‰ cháº¥p nháº­n `jpg`, `png`, `pdf`.

Negative:

- `fileExtension = exe` bá»‹ cháº·n.

SQL:

```sql
select sv.id, sv.status, sv.submitted_at, f.original_filename, f.file_extension
from student_verifications sv
join files f on f.id = sv.document_file_id
order by sv.submitted_at desc;
```

### 4.4. EDU Email Verification

UI:

- `http://localhost:3000/student/verification`

API:

- `POST /api/v1/students/me/edu-verification/request`
- `POST /api/v1/students/me/edu-verification/confirm`

Request:

```json
{
  "email": "student001@school.edu"
}
```

Confirm:

```json
{
  "email": "student001@school.edu",
  "code": "123456"
}
```

Expected:

- Domain `.edu` hoáº·c `edu.vn` há»£p lá»‡.
- Confirm thÃ nh cÃ´ng set student profile `verification_status = APPROVED`.
- CÃ³ thá»ƒ apply project sau khi verified.

Negative:

- Email khÃ´ng thuá»™c allowed domain bá»‹ cháº·n.

### 4.5. Admin Review Verification

UI:

- `http://localhost:3000/admin/verifications`
- `http://localhost:3000/admin/verifications/{verificationId}`

API:

- `GET /api/v1/admin/student-verifications`
- `GET /api/v1/admin/student-verifications/{verificationId}`
- `GET /api/v1/admin/student-verifications/{verificationId}/document`
- `POST /api/v1/admin/student-verifications/{verificationId}/approve`
- `POST /api/v1/admin/student-verifications/{verificationId}/reject`

Reject request:

```json
{
  "rejectionReason": "Document is unreadable."
}
```

Expected:

- Approve set verification `APPROVED` vÃ  student profile `verification_status = APPROVED`.
- Reject set verification `REJECTED` kÃ¨m reason.

## 5. Marketplace

### 5.1. Design Categories

API:

- `GET /api/v1/design-categories`

Expected:

- Tráº£ danh sÃ¡ch active categories.
- DÃ¹ng `id` Ä‘áº§u tiÃªn lÃ m `designCategoryId` cho project.

### 5.2. AI Project Brief Assistant

API:

- `POST /api/v1/ai/project-brief-assistant`

Request:

```json
{
  "rawIdea": "TÃ´i cáº§n bá»™ nháº­n diá»‡n cho quÃ¡n cÃ  phÃª specialty má»›i.",
  "businessField": "Food and Beverage",
  "targetAudience": "KhÃ¡ch hÃ ng tráº» táº¡i TP.HCM",
  "preferredStyle": "Tá»‘i giáº£n, áº¥m Ã¡p",
  "budgetAmount": 3000000,
  "totalDeadline": "2026-06-30T00:00:00Z"
}
```

Expected:

- Tráº£ suggested title, brief, usage purpose, deliverables, category hint, deadline notes.
- KhÃ´ng tá»± publish project, khÃ´ng tá»± chá»n student, khÃ´ng tá»± Ä‘á»‹nh giÃ¡ cuá»‘i.

### 5.3. SME Create Draft, Update, Publish

UI:

- `http://localhost:3000/sme/projects/new`
- `http://localhost:3000/sme/projects`
- `http://localhost:3000/sme/projects/{projectId}`

API:

- `POST /api/v1/projects`
- `PUT /api/v1/projects/{projectId}`
- `POST /api/v1/projects/{projectId}/publish`
- `GET /api/v1/projects/mine`

Create draft request:

```json
{
  "designCategoryId": "<category-id>",
  "title": "Thiáº¿t káº¿ bá»™ nháº­n diá»‡n quÃ¡n cÃ  phÃª",
  "brief": "Thiáº¿t káº¿ logo, báº£ng mÃ u vÃ  guideline cÆ¡ báº£n cho má»™t quÃ¡n cÃ  phÃª specialty má»›i táº¡i TP.HCM.",
  "usagePurpose": "DÃ¹ng cho báº£ng hiá»‡u, menu, social media vÃ  bao bÃ¬.",
  "projectType": "OPEN",
  "budgetAmount": 3000000,
  "currency": "VND",
  "totalDeadlineAt": "2026-06-30T00:00:00Z",
  "sketchDeadlineAt": "2026-06-10T00:00:00Z",
  "finalDeadlineAt": "2026-06-20T00:00:00Z",
  "isConfidential": false,
  "allowStudentPortfolio": true
}
```

Expected:

- Draft táº¡o vá»›i status `DRAFT`.
- Publish chuyá»ƒn status `OPEN`.
- Project xuáº¥t hiá»‡n trong Student open project list.

Negative:

- Budget `<= 0` bá»‹ cháº·n.
- Sketch deadline sau final deadline bá»‹ cháº·n.
- Final deadline sau total deadline bá»‹ cháº·n.
- Basic plan khÃ´ng publish quÃ¡ 5 active open projects.
- Basic plan khÃ´ng publish project trÃªn `5,000,000 VND`.

SQL:

```sql
select title, status, budget_amount, published_at
from projects
order by created_at desc;
```

### 5.4. SME Cancel Draft/Open Project

API:

- `POST /api/v1/projects/{projectId}/cancel`
- `DELETE /api/v1/projects/{projectId}`

Request:

```json
{
  "cancellationReason": "SME changed business priority."
}
```

Expected:

- Chá»‰ cancel Ä‘Æ°á»£c `DRAFT`, `OPEN`, `PRIVATE_INVITED`.
- Status chuyá»ƒn `CANCELLED`.

### 5.5. Student List, Detail, Apply

UI:

- `http://localhost:3000/student/projects`
- `http://localhost:3000/student/projects/{projectId}`

API:

- `GET /api/v1/projects`
- `GET /api/v1/projects/{projectId}`
- `POST /api/v1/projects/{projectId}/applications`
- `GET /api/v1/students/me/applications`

Apply request:

```json
{
  "proposedPrice": 2800000,
  "coverLetter": "Em Ä‘á» xuáº¥t hÆ°á»›ng nháº­n diá»‡n tá»‘i giáº£n, Æ°u tiÃªn kháº£ nÄƒng á»©ng dá»¥ng trÃªn bao bÃ¬ vÃ  social media.",
  "estimatedDurationDays": null
}
```

Expected:

- Student verified má»›i apply Ä‘Æ°á»£c.
- Quick apply láº¥y `proposedPrice` báº±ng budget project vÃ  dÃ¹ng ghi chÃº xÃ¡c nháº­n máº·c Ä‘á»‹nh.
- Chá»‰ khi Student báº¥m `Äá» xuáº¥t khÃ¡c`, UI má»›i yÃªu cáº§u giÃ¡ má»›i vÃ  giáº£i phÃ¡p Ä‘á» xuáº¥t.
- Application status `SUBMITTED`.
- Open project response cÃ³ `hasApplied = true`.

Negative:

- Apply duplicate cÃ¹ng project bá»‹ cháº·n.
- Student chÆ°a verified bá»‹ cháº·n.

### 5.6. SME View Applications And Create Offer

UI:

- `http://localhost:3000/sme/projects/{projectId}/applications`

API:

- `GET /api/v1/projects/{projectId}/applications`
- `GET /api/v1/smes/me/applications`
- `POST /api/v1/projects/{projectId}/offers`
- `GET /api/v1/smes/me/offers`

Create offer request:

```json
{
  "studentProfileId": "<student-profile-id>",
  "applicationId": "<application-id>",
  "offeredAmount": 2800000,
  "expiresAt": null
}
```

Expected:

- Offer táº¡o status `WAITING_ACCEPTANCE`.
- Vá»›i offer gáº¯n application, backend luÃ´n láº¥y `offeredAmount` tá»« `project_applications.proposed_price`, ká»ƒ cáº£ client gá»­i amount khÃ¡c.
- SME chá»‰ xÃ¡c nháº­n gá»­i offer; server tá»± Ä‘áº·t háº¡n pháº£n há»“i sau 48 giá».
- Private offer khÃ´ng cÃ³ application váº«n nháº­n `offeredAmount` tá»« request.
- Project chuyá»ƒn/giá»¯ tráº¡ng thÃ¡i offer selected theo flow backend.
- Student tháº¥y offer á»Ÿ `/student/offers`.

### 5.7. Student Accept/Reject Offer

UI:

- `http://localhost:3000/student/offers`

API:

- `POST /api/v1/offers/{offerId}/accept`
- `POST /api/v1/offers/{offerId}/reject`

Expected accept:

- Offer chuyá»ƒn `ACCEPTED`.
- `paymentDueAt` Ä‘Æ°á»£c set 72 giá» sau khi accept.
- Project cÃ³ selected student nhÆ°ng chÆ°a `IN_PROGRESS` cho tá»›i khi escrow funded.

Expected reject:

- Offer chuyá»ƒn `REJECTED`.
- Náº¿u khÃ´ng cÃ²n active offer, project Ä‘Æ°á»£c release láº¡i theo rule backend.

### 5.8. Offer Expiry 48 Giá»

Background service:

- `OfferPaymentExpiryBackgroundService`

Äiá»u kiá»‡n:

- Offer Ä‘ang `WAITING_ACCEPTANCE`.
- `expires_at <= now()`.

Manual DB setup Ä‘á»ƒ test nhanh:

```sql
update project_offers
set expires_at = now() - interval '1 minute'
where id = '<offer-id>' and status = 'WAITING_ACCEPTANCE';
```

Expected:

- Offer chuyá»ƒn `EXPIRED`.
- `expired_at` Ä‘Æ°á»£c set.
- Náº¿u khÃ´ng cÃ²n offer active khÃ¡c, project quay vá» `OPEN` hoáº·c `PRIVATE_INVITED`.
- CÃ³ audit log `OFFER_EXPIRED`.

SQL check:

```sql
select po.status, po.expires_at, po.expired_at, p.status as project_status
from project_offers po
join projects p on p.id = po.project_id
where po.id = '<offer-id>';

select action, entity_type, entity_id, before_json, after_json, created_at
from audit_logs
where entity_id = '<offer-id>'
order by created_at desc;
```

## 6. PayOS Escrow Payment

Náº¿u test local khÃ´ng cÃ³ PayOS tháº­t, Ä‘áº·t `PAYMENT_PROVIDER=Mock` trong `.env`, cháº¡y láº¡i `docker compose up -d --build`, rá»“i dÃ¹ng cÃ¹ng endpoint payment/webhook bÃªn dÆ°á»›i. Mock provider tráº£ checkout URL/QR giáº£, khÃ´ng gá»i PayOS.

### 6.1. SME Create Offer Payment

UI:

- `http://localhost:3000/sme/offers`

API:

- `POST /api/v1/offers/{offerId}/payment`

Expected:

- Chá»‰ SME owner táº¡o payment Ä‘Æ°á»£c.
- Chá»‰ offer `ACCEPTED` má»›i táº¡o payment Ä‘Æ°á»£c.
- Táº¡o hoáº·c reuse escrow status `PENDING_PAYMENT`.
- Tráº£ `checkoutUrl` hoáº·c `qrCode`.
- Offer chuyá»ƒn `PENDING_PAYMENT`.
- Náº¿u payment webhook fail trÆ°á»›c khi háº¿t 72 giá», offer chuyá»ƒn `PAYMENT_FAILED` vÃ  SME cÃ³ thá»ƒ táº¡o láº¡i payment.

SQL:

```sql
select po.status as offer_status, po.payment_due_at, e.status as escrow_status,
       p.status as payment_status, p.provider, p.checkout_url
from project_offers po
left join escrows e on e.project_id = po.project_id and e.student_profile_id = po.student_profile_id
left join payments p on p.escrow_id = e.id
order by po.created_at desc;
```

### 6.2. Mock Webhook Success/Failure

API:

- `POST /api/v1/payments/payos/webhook`

Mock success request:

```json
{
  "code": "00",
  "desc": "success",
  "success": true,
  "signature": "mock",
  "data": {
    "orderCode": 1234567890,
    "amount": 2800000,
    "description": "D4U escrow",
    "accountNumber": "000000",
    "reference": "MOCK-SUCCESS-001",
    "transactionDateTime": "2026-05-27T10:00:00Z",
    "currency": "VND",
    "paymentLinkId": "mock-link-001",
    "code": "00",
    "desc": "success"
  }
}
```

Mock failure request:

```json
{
  "code": "99",
  "desc": "failed",
  "success": false,
  "signature": "mock",
  "data": {
    "orderCode": 1234567890,
    "amount": 2800000,
    "description": "D4U escrow",
    "accountNumber": "000000",
    "reference": "MOCK-FAILED-001",
    "transactionDateTime": "2026-05-27T10:00:00Z",
    "currency": "VND",
    "paymentLinkId": "mock-link-001",
    "code": "99",
    "desc": "failed"
  }
}
```

Expected success:

- Chá»‰ xá»­ lÃ½ payment Ä‘ang `PENDING`.
- Payment chuyá»ƒn `SUCCESS`.
- Escrow chuyá»ƒn `FUNDED`.
- Offer chuyá»ƒn `ACTIVE`.
- Project chuyá»ƒn `IN_PROGRESS`.

Expected failure:

- Payment chuyá»ƒn `FAILED`.
- Offer chuyá»ƒn `PAYMENT_FAILED`.
- Project khÃ´ng chuyá»ƒn `IN_PROGRESS`.
- SME cÃ³ thá»ƒ táº¡o payment má»›i náº¿u `payment_due_at` váº«n cÃ²n háº¡n.

### 6.3. PayOS Webhook Success

API:

- `POST /api/v1/payments/payos/webhook`

Expected:

- Webhook signature há»£p lá»‡ má»›i Ä‘Æ°á»£c xá»­ lÃ½.
- Payment chuyá»ƒn `SUCCESS`.
- Escrow chuyá»ƒn `FUNDED`.
- Offer chuyá»ƒn `ACTIVE`.
- Project chuyá»ƒn `IN_PROGRESS`.
- Client-side success page khÃ´ng tá»± Ä‘Ã¡nh dáº¥u payment success tá»« query string. Backend chá»‰ cáº­p nháº­t sau webhook há»£p lá»‡ hoáº·c reconcile trusted trá»±c tiáº¿p vá»›i PayOS.

Skip náº¿u chÆ°a cÃ³ PayOS credentials hoáº·c public callback URL.

### 6.4. Payment Window Expiry 72 Giá»

Background service:

- `OfferPaymentExpiryBackgroundService`

Manual DB setup Ä‘á»ƒ test nhanh:

```sql
update project_offers
set payment_due_at = now() - interval '1 minute'
where id = '<offer-id>' and status in ('ACCEPTED', 'PENDING_PAYMENT', 'PAYMENT_FAILED');

update payments
set expires_at = now() - interval '1 minute'
where escrow_id = '<escrow-id>' and status = 'PENDING';
```

Expected:

- Offer chuyá»ƒn `EXPIRED`.
- Pending payment chuyá»ƒn `EXPIRED`.
- Escrow `PENDING_PAYMENT` chuyá»ƒn `CANCELLED`.
- Náº¿u khÃ´ng cÃ²n offer active khÃ¡c, project quay vá» `OPEN` hoáº·c `PRIVATE_INVITED`.
- Webhook success Ä‘áº¿n muá»™n cho payment `FAILED`, `CANCELLED`, hoáº·c `EXPIRED` khÃ´ng Ä‘Æ°á»£c start project.

SQL check:

```sql
select po.status as offer_status, po.payment_due_at, po.expired_at,
       e.status as escrow_status, p.status as payment_status,
       pr.status as project_status
from project_offers po
left join escrows e on e.project_id = po.project_id and e.student_profile_id = po.student_profile_id
left join payments p on p.escrow_id = e.id
join projects pr on pr.id = po.project_id
where po.id = '<offer-id>'
order by p.created_at desc;

select action, entity_type, entity_id, before_json, after_json, created_at
from audit_logs
where action in ('OFFER_EXPIRED', 'PAYMENT_EXPIRED', 'PROJECT_STATUS_CHANGED')
order by created_at desc;
```

### 6.5. View Payment/Escrow

API:

- `GET /api/v1/payments/{paymentId}`
- `GET /api/v1/projects/{projectId}/escrow`

Expected:

- SME owner, selected Student, hoáº·c Admin xem Ä‘Æ°á»£c escrow.
- User ngoÃ i project bá»‹ cháº·n.

## 7. Project Execution

LÆ°u Ã½: frontend Ä‘Ã£ cÃ³ project workspace cho Student vÃ  SME; Swagger/API váº«n há»¯u Ã­ch Ä‘á»ƒ kiá»ƒm tra dá»¯ liá»‡u vÃ  cÃ¡c nhÃ¡nh lá»—i.

### 7.1. Student Submit Sketch

Äiá»u kiá»‡n:

- Project status `IN_PROGRESS`.
- Escrow status `FUNDED`.
- User lÃ  selected Student.
- CÃ³ file metadata há»£p lá»‡ trong báº£ng `files`.

API:

- `POST /api/v1/projects/{projectId}/submissions`

Request:

```json
{
  "milestoneType": "SKETCH",
  "description": "Sketch logo vÃ  hÆ°á»›ng visual Ä‘áº§u tiÃªn.",
  "files": [
    {
      "fileId": "<file-id>",
      "watermarkedFileId": null,
      "isOriginalDownloadable": false
    }
  ]
}
```

Expected:

- Táº¡o `project_submissions` vá»›i `submission_type = SKETCH`, `milestone_type = SKETCH`, `status = SUBMITTED`.
- Táº¡o `submission_files`.
- Project chuyá»ƒn `SKETCH_REVIEW`.
- `review_due_at` Ä‘Æ°á»£c set sau 5 business days.

Negative:

- File ngoÃ i `jpg/png/pdf` bá»‹ cháº·n.
- Student khÃ´ng pháº£i selected Student bá»‹ cháº·n.
- Project chÆ°a funded escrow bá»‹ cháº·n.

### 7.2. SME Approve Sketch

API:

- `POST /api/v1/projects/{projectId}/submissions/{submissionId}/approve`

Request:

```json
{
  "comment": "Sketch direction is approved."
}
```

Expected:

- Submission chuyá»ƒn `APPROVED`.
- Review action `APPROVE_SKETCH`.
- Project quay vá» `IN_PROGRESS`.
- Student cÃ³ thá»ƒ submit Final.

### 7.3. Student Submit Final

API:

- `POST /api/v1/projects/{projectId}/submissions`

Request:

```json
{
  "milestoneType": "FINAL",
  "description": "Final logo package and brand guideline.",
  "files": [
    {
      "fileId": "<file-id>",
      "watermarkedFileId": "<optional-watermarked-file-id>",
      "isOriginalDownloadable": true
    }
  ]
}
```

Expected:

- Chá»‰ submit Final sau Sketch approved hoáº·c auto-approved.
- Project chuyá»ƒn `FINAL_REVIEW`.
- Submission lÆ°u `milestone_type = FINAL`.

Negative:

- Submit Final trÆ°á»›c Sketch approved bá»‹ cháº·n.

### 7.3.1. Workspace TÆ°Æ¡ng TÃ¡c Student VÃ  SME

- Student chá»n nhiá»u file vÃ o draft local trÆ°á»›c khi báº¥m `Ná»™p bÃ i`; file chá»‰ upload sau modal xÃ¡c nháº­n.
- Workspace tá»± poll má»—i 5 giÃ¢y vÃ  váº«n giá»¯ nÃºt `LÃ m má»›i`.
- SME dÃ¹ng panel `Báº£n Ä‘ang chá» duyá»‡t` Ä‘á»ƒ xá»­ lÃ½ submission má»›i nháº¥t thay vÃ¬ tÃ¬m trong lá»‹ch sá»­.
- Workspace hiá»ƒn thá»‹ Sketch, Final, Total deadline theo giá» Viá»‡t Nam, kÃ¨m countdown hoáº·c tráº¡ng thÃ¡i quÃ¡ háº¡n.
- Timeline tÆ°Æ¡ng tÃ¡c gá»™p offer, escrow, submission, feedback, approval vÃ  release theo thá»© tá»± thá»i gian.
- Khi SME bÃ¡o file lá»—i, submission cÅ© giá»¯ `INVALID_REPORTED`, project chuyá»ƒn `REVISION_REQUESTED`, Student Ä‘Æ°á»£c upload láº¡i cÃ¹ng milestone vÃ  há»‡ thá»‘ng khÃ´ng tÄƒng revision round do lá»—i ká»¹ thuáº­t.
- Xem ká»‹ch báº£n chi tiáº¿t trong `D4U_CORE_INTERACTION_E2E_TEST_GUIDE_VI.md`, má»¥c `7. Bá»• Sung Kiá»ƒm Tra Workspace Ná»™p BÃ i`.

### 7.4. SME Approve Final

API:

- `POST /api/v1/projects/{projectId}/submissions/{submissionId}/approve`

Expected:

- Submission chuyá»ƒn `APPROVED`.
- Review action `APPROVE_FINAL`.
- Project chuyá»ƒn `COMPLETED`.
- `projects.completed_at` Ä‘Æ°á»£c set.
- `projects.rating_due_at = completed_at + 7 ngÃ y`.
- Escrow `FUNDED` chuyá»ƒn `RELEASE_PENDING`, sau Ä‘Ã³ Phase 4A release service chuyá»ƒn `RELEASED`.
- Student wallet Ä‘Æ°á»£c credit net amount sau platform fee.
- KhÃ´ng tá»± payout ngÃ¢n hÃ ng; withdrawal váº«n do Admin/Finance xá»­ lÃ½ thá»§ cÃ´ng.

SQL check:

```sql
select p.status, p.completed_at, p.rating_due_at, e.status as escrow_status,
       d.gross_amount, d.platform_fee_amount, d.net_amount, d.status as disbursement_status,
       w.available_balance
from projects p
left join escrows e on e.project_id = p.id
left join disbursements d on d.escrow_id = e.id
left join wallets w on w.id = d.wallet_id
where p.id = '<project-id>';
```

### 7.5. SME Request Revision

API:

- `POST /api/v1/projects/{projectId}/submissions/{submissionId}/revision-requests`

Request:

```json
{
  "requestedChanges": "Vui lÃ²ng chá»‰nh láº¡i báº£ng mÃ u vÃ  typography theo hÆ°á»›ng tá»‘i giáº£n hÆ¡n.",
  "dueAt": "2026-06-25T00:00:00Z"
}
```

Expected:

- Submission hiá»‡n táº¡i chuyá»ƒn `REVISION_REQUESTED`.
- Project chuyá»ƒn `REVISION_REQUESTED`.
- `projects.current_revision_round` tÄƒng 1.
- Táº¡o `review_actions` action `REQUEST_REVISION`.

Student submit revision:

```json
{
  "milestoneType": "SKETCH",
  "description": "Revision theo feedback SME.",
  "files": [
    {
      "fileId": "<file-id>",
      "watermarkedFileId": null,
      "isOriginalDownloadable": false
    }
  ]
}
```

Expected:

- Revision submit dÃ¹ng `submission_type = REVISION`.
- Project quay láº¡i `SKETCH_REVIEW` hoáº·c `FINAL_REVIEW` theo milestone cáº§n revise.

### 7.6. Revision KhÃ´ng Giá»›i Háº¡n

SME cÃ³ thá»ƒ yÃªu cáº§u chá»‰nh sá»­a nhiá»u láº§n khi cáº§n. Há»‡ thá»‘ng váº«n tÄƒng `revision_round` Ä‘á»ƒ audit nhÆ°ng khÃ´ng cháº·n theo sá»‘ láº§n chá»‰nh sá»­a vÃ  khÃ´ng chuyá»ƒn `ADMIN_REVIEW` do háº¿t lÆ°á»£t.

### 7.7. SME Report Invalid File

API:

- `POST /api/v1/projects/{projectId}/submissions/{submissionId}/invalid-file-reports`

Request:

```json
{
  "reason": "CANNOT_OPEN",
  "description": "File PDF khÃ´ng má»Ÿ Ä‘Æ°á»£c.",
  "reuploadDueAt": "2026-06-24T00:00:00Z"
}
```

Expected:

- Submission chuyá»ƒn `INVALID_REPORTED`.
- Táº¡o `review_actions` action `REPORT_INVALID_FILE`.
- LÆ°u `invalid_file_reason`, description, `reupload_due_at`.

### 7.8. Auto-Approve Sau 5 Business Days

Background service:

- `SubmissionAutoApprovalBackgroundService`

Expected:

- Submission `SUBMITTED` cÃ³ `review_due_at <= now` sáº½ auto-approve náº¿u project Ä‘ang `SKETCH_REVIEW` hoáº·c `FINAL_REVIEW`.
- Sketch auto-approve chuyá»ƒn project vá» `IN_PROGRESS`.
- Final auto-approve chuyá»ƒn project `COMPLETED`.
- Final auto-approve dÃ¹ng cÃ¹ng completion handoff: set `completed_at`, `rating_due_at`, escrow release sang `RELEASED`, credit Student wallet.
- Táº¡o review action `AUTO_APPROVE`.
- Táº¡o audit log `PROJECT_STATUS_CHANGED`.

Manual DB setup Ä‘á»ƒ test nhanh:

```sql
update project_submissions
set review_due_at = now() - interval '1 minute'
where id = '<submission-id>';
```

Sau Ä‘Ã³ chá» background service poll, hoáº·c restart API container:

```powershell
docker compose restart api
docker compose logs -f api
```

SQL check:

```sql
select ps.id, ps.milestone_type, ps.status, ps.review_due_at, ps.auto_approved_at,
       p.status as project_status, p.completed_at, p.rating_due_at,
       e.status as escrow_status
from project_submissions ps
join projects p on p.id = ps.project_id
left join escrows e on e.project_id = p.id
order by ps.submitted_at desc;

select action, entity_type, entity_id, before_json, after_json, created_at
from audit_logs
where action = 'PROJECT_STATUS_CHANGED'
order by created_at desc;
```

## 8. Wallet, Disbursement VÃ  Withdrawal

### 8.1. Escrow Release VÃ  Wallet Credit

Äiá»u kiá»‡n:

- Project Ä‘Ã£ `COMPLETED`.
- Escrow Ä‘Ã£ Ä‘Æ°á»£c handoff sang `RELEASE_PENDING`.
- Student profile cá»§a selected student tá»“n táº¡i.

API retry/idempotency:

- `POST /api/v1/projects/{projectId}/escrow/release` vá»›i Admin token.

Luá»“ng máº·c Ä‘á»‹nh:

- SME approve Final hoáº·c Final auto-approve sáº½ thá»­ release escrow ngay.
- Náº¿u release tá»©c thá»i lá»—i táº¡m thá»i, escrow giá»¯ `RELEASE_PENDING`; hosted worker retry idempotent.
- Platform fee dÃ¹ng rate Ä‘Ã£ Ä‘Ã³ng bÄƒng trÃªn escrow lÃºc funding. Rate má»›i chá»‰ Ã¡p dá»¥ng cho escrow táº¡o sau migration: Basic `5%`, Pro `3%`, Premium `2%`.

Expected:

- Escrow chuyá»ƒn `RELEASED`, set `released_at`.
- Táº¡o Ä‘Ãºng má»™t `disbursements` record status `COMPLETED`.
- `gross_amount = escrows.amount`.
- `platform_fee_amount = escrows.platform_fee_amount` hoáº·c `amount * platform_fee_rate`.
- `net_amount = gross_amount - platform_fee_amount`.
- Student wallet Ä‘Æ°á»£c auto-create náº¿u chÆ°a cÃ³.
- `wallets.available_balance` tÄƒng Ä‘Ãºng `net_amount`.
- Táº¡o `wallet_transactions` type `DISBURSEMENT_CREDIT`.
- Gá»i release láº¡i khÃ´ng double credit.
- CÃ³ audit log `ESCROW_RELEASED` vÃ  `WALLET_BALANCE_CHANGED`.

SQL check:

```sql
select e.status, e.released_at, d.gross_amount, d.platform_fee_amount, d.net_amount,
       d.status as disbursement_status, w.available_balance, wt.type, wt.amount, wt.balance_after
from escrows e
left join disbursements d on d.escrow_id = e.id
left join wallets w on w.id = d.wallet_id
left join wallet_transactions wt on wt.reference_id = d.id
where e.project_id = '<project-id>';

select action, entity_type, entity_id, before_json, after_json, created_at
from audit_logs
where action in ('ESCROW_RELEASED', 'WALLET_BALANCE_CHANGED')
order by created_at desc;
```

### 8.2. Student Wallet UI/API

UI:

- `http://localhost:3000/student/wallet`

API:

- `GET /api/v1/wallets/me`
- `GET /api/v1/wallets/me/transactions`

Expected:

- Student tháº¥y available, pending, locked balance, currency vÃ  status.
- Ledger hiá»ƒn thá»‹ `DISBURSEMENT_CREDIT`, `WITHDRAWAL_DEBIT`, `WITHDRAWAL_FAILED_REVERSAL`.
- CÃ³ thá»ƒ má»Ÿ rá»™ng dÃ²ng `DISBURSEMENT_CREDIT` Ä‘á»ƒ xem gross amount, platform fee vÃ  net amount.
- Non-Student bá»‹ cháº·n bá»Ÿi role authorization.

### 8.3. Payment Method VÃ  Withdrawal Request

API:

- `POST /api/v1/payment-methods`
- `GET /api/v1/payment-methods/me`
- `POST /api/v1/withdrawal-requests`
- `GET /api/v1/withdrawal-requests/me`

Create payment method request:

```json
{
  "bankName": "Vietcombank",
  "bankCode": "VCB",
  "accountHolderName": "Student Test 001",
  "accountNumber": "1234567890",
  "isDefault": true
}
```

Create withdrawal request:

```json
{
  "paymentMethodId": "<payment-method-id>",
  "amount": 50000
}
```

Expected:

- Payment method lÆ°u `bank_name`, `bank_code`, `masked_account_number` vÃ  `account_number_encrypted`; khÃ´ng lÆ°u raw bank account number.
- Payment method thiáº¿u `bankName` bá»‹ cháº·n khi táº¡o má»›i; method cÅ© thiáº¿u ngÃ¢n hÃ ng khÃ´ng Ä‘Æ°á»£c dÃ¹ng Ä‘á»ƒ rÃºt tiá»n.
- Student API chá»‰ tráº£ sá»‘ tÃ i khoáº£n mask; Admin withdrawal API tráº£ sá»‘ tÃ i khoáº£n Ä‘áº§y Ä‘á»§ vÃ  ná»™i dung chuyá»ƒn khoáº£n.
- Amount dÆ°á»›i `50,000 VND` bá»‹ cháº·n.
- Wallet khÃ´ng `ACTIVE` bá»‹ cháº·n.
- Student `can_withdraw = false` bá»‹ cháº·n.
- KhÃ´ng Ä‘á»§ available balance bá»‹ cháº·n.
- Pending withdrawal move `available_balance` sang `locked_balance`.
- Má»—i wallet chá»‰ cÃ³ tá»‘i Ä‘a má»™t withdrawal `PENDING` hoáº·c `PROCESSING`.
- PhÃ­ rÃºt tiá»n MVP lÃ  `0 VND`, `net_amount = amount`.

SQL check:

```sql
select bank_name, bank_code, account_holder_name, masked_account_number, account_number_encrypted is not null as has_encrypted_account_number, provider_token, is_default, status
from payment_methods
order by created_at desc;

select w.available_balance, w.locked_balance, wr.amount, wr.fee_amount, wr.net_amount, wr.status
from withdrawal_requests wr
join wallets w on w.id = wr.wallet_id
order by wr.requested_at desc;
```

### 8.4. Admin Process Withdrawal

UI:

- `http://localhost:3000/admin/withdrawals`

API:

- `GET /api/v1/admin/withdrawal-requests`
- `POST /api/v1/admin/withdrawal-requests/{withdrawalRequestId}/process`

Nháº­n xá»­ lÃ½:

```json
{
  "decision": "PROCESSING",
  "failureReason": null,
  "bankTransactionReference": null,
  "transferredAt": null
}
```

Sau khi chuyá»ƒn khoáº£n ngoÃ i há»‡ thá»‘ng, complete request:

```json
{
  "decision": "COMPLETED",
  "failureReason": null,
  "bankTransactionReference": "BANK-20260602-0001",
  "transferredAt": "2026-06-02T15:30:00Z"
}
```

Failed request:

```json
{
  "decision": "FAILED",
  "failureReason": "Bank transfer was rejected.",
  "bankTransactionReference": null,
  "transferredAt": null
}
```

Expected completed:

- Withdrawal Ä‘i qua `PENDING -> PROCESSING -> COMPLETED`.
- LÆ°u `processing_started_at`, `processed_by_user_id`, `bank_transaction_reference`, `transferred_at`.
- Wallet locked balance giáº£m theo amount.
- Táº¡o `wallet_transactions` type `WITHDRAWAL_DEBIT`.
- CÃ³ audit log `WITHDRAWAL_PROCESSED`.

Expected failed:

- Withdrawal Ä‘i qua `PENDING -> PROCESSING -> FAILED`, lÆ°u failure reason.
- Wallet locked balance giáº£m, available balance tÄƒng láº¡i theo amount.
- Táº¡o `wallet_transactions` type `WITHDRAWAL_FAILED_REVERSAL`.
- CÃ³ audit log `WITHDRAWAL_PROCESSED`.

## 9. Negative Regression Checklist

| Case | Expected |
| --- | --- |
| Login email/password trÆ°á»›c account email verification | Bá»‹ cháº·n |
| Register role `ADMIN` qua public endpoint | Bá»‹ cháº·n |
| Google login role khÃ´ng pháº£i `STUDENT`/`SME` | Bá»‹ cháº·n |
| Student verification file `exe` | Bá»‹ cháº·n |
| EDU email domain khÃ´ng thuá»™c allowlist | Bá»‹ cháº·n |
| Project budget `0` hoáº·c Ã¢m | Bá»‹ cháº·n |
| Sketch deadline sau Final deadline | Bá»‹ cháº·n |
| Final deadline sau Total deadline | Bá»‹ cháº·n |
| Basic plan publish project thá»© 6 Ä‘ang `OPEN` | Bá»‹ cháº·n |
| Basic plan budget trÃªn `5,000,000 VND` | Bá»‹ cháº·n |
| Student apply trÃ¹ng project | Bá»‹ cháº·n |
| Offer `WAITING_ACCEPTANCE` quÃ¡ 48 giá» | Chuyá»ƒn `EXPIRED`, project release náº¿u khÃ´ng cÃ²n active offer |
| SME táº¡o payment khi offer chÆ°a accepted | Bá»‹ cháº·n |
| Offer accepted quÃ¡ 72 giá» chÆ°a paid | Offer `EXPIRED`, pending payment `EXPIRED`, escrow `CANCELLED` |
| Webhook success Ä‘áº¿n sau payment `FAILED`/`CANCELLED`/`EXPIRED` | KhÃ´ng start project |
| Client tá»± gá»i success page payment | KhÃ´ng Ä‘á»•i payment/escrow/project náº¿u PayOS chÆ°a xÃ¡c nháº­n qua webhook hoáº·c reconcile trusted |
| Student submit Sketch khi escrow chÆ°a `FUNDED` | Bá»‹ cháº·n |
| Student submit Final trÆ°á»›c Sketch approved | Bá»‹ cháº·n |
| SME khÃ´ng owner review submission | Bá»‹ cháº·n |
| Admin force complete project khÃ´ng á»Ÿ `ADMIN_REVIEW` | Bá»‹ cháº·n |
| Release escrow Ä‘Ã£ `RELEASED` láº§n ná»¯a | KhÃ´ng double credit wallet |
| Withdrawal dÆ°á»›i `50,000 VND` | Bá»‹ cháº·n |
| Withdrawal khi `can_withdraw = false` | Bá»‹ cháº·n |
| Non-Admin process withdrawal | Bá»‹ cháº·n |

## 10. SQL Tá»•ng Há»£p Sau E2E

```sql
select email, role, status, email_verified_at
from users
order by created_at;

select sp.id, u.email, sp.verification_status, sp.can_withdraw
from student_profiles sp
join users u on u.id = sp.user_id;

select title, status, selected_student_profile_id, current_revision_round, completed_at, rating_due_at, cancelled_at
from projects
order by created_at desc;

select status, offered_amount, expires_at, payment_due_at, accepted_at, rejected_at, expired_at
from project_offers
order by created_at desc;

select status, amount, currency, platform_fee_rate, platform_fee_amount, funded_at
from escrows
order by created_at desc;

select provider, provider_order_code, status, amount, paid_at, expires_at
from payments
order by created_at desc;

select gross_amount, platform_fee_amount, net_amount, status, completed_at
from disbursements
order by created_at desc;

select available_balance, pending_balance, locked_balance, currency, status
from wallets
order by created_at desc;

select type, amount, balance_after, reference_type, reference_id, created_at
from wallet_transactions
order by created_at desc;

select amount, fee_amount, net_amount, status, failure_reason, requested_at, processed_at
from withdrawal_requests
order by requested_at desc;

select submission_type, milestone_type, revision_round, status, submitted_at, review_due_at, approved_at, auto_approved_at
from project_submissions
order by submitted_at desc;

select action, invalid_file_reason, revision_round, due_at, reupload_due_at, created_at
from review_actions
order by created_at desc;
```

## 11.1. Core Stabilization Regression

### Offer VÃ  Application Expiry

- Offer `WAITING_ACCEPTANCE` háº¿t háº¡n pháº£i chuyá»ƒn `EXPIRED`.
- Application liÃªn káº¿t pháº£i trá»Ÿ vá» `SUBMITTED`, khÃ´ng giá»¯ tráº¡ng thÃ¡i `SELECTED`.
- Náº¿u khÃ´ng cÃ²n offer active, project trá»Ÿ vá» `OPEN` hoáº·c `PRIVATE_INVITED`.

### Checkout Payment Expiry

- Payment `PENDING` cÃ³ checkout quÃ¡ háº¡n pháº£i chuyá»ƒn `EXPIRED` Ä‘á»™c láº­p vá»›i cá»­a sá»• thanh toÃ¡n offer 72 giá».
- Offer chuyá»ƒn `PAYMENT_FAILED`; SME Ä‘Æ°á»£c táº¡o checkout má»›i náº¿u `payment_due_at` váº«n cÃ²n háº¡n.
- Náº¿u checkout cÅ© háº¿t háº¡n nhÆ°ng checkout retry má»›i váº«n cÃ²n háº¡n, offer pháº£i giá»¯ `PENDING_PAYMENT`.
- Khi cá»­a sá»• 72 giá» háº¿t háº¡n, offer chuyá»ƒn `EXPIRED`, escrow pending chuyá»ƒn `CANCELLED`.

### Submission Upload Hardening

- Chá»‰ nháº­n `.jpg`, `.png`, `.pdf`, tá»‘i Ä‘a 20 MB má»—i file.
- File giáº£ Ä‘uÃ´i bá»‹ backend tá»« chá»‘i náº¿u signature ná»™i dung khÃ´ng khá»›p extension.
- File local upload thÃ nh cÃ´ng nhÆ°ng chÆ°a gáº¯n submission Ä‘Æ°á»£c worker dá»n sau 24 giá».

### PayOS Return UX

- Return page chá»‰ Ä‘á»c tráº¡ng thÃ¡i backend, poll má»—i 2 giÃ¢y tá»‘i Ä‘a 60 giÃ¢y.
- Khi payment cÃ²n `PENDING`, backend reconcile server-to-server vá»›i PayOS tá»‘i Ä‘a má»—i 5 giÃ¢y; query string client khÃ´ng Ä‘Æ°á»£c dÃ¹ng lÃ m báº±ng chá»©ng thanh toÃ¡n.
- Khi timeout, trang hiá»ƒn thá»‹ cáº£nh bÃ¡o, nÃºt `Kiá»ƒm tra láº¡i`, vÃ  CTA vá» workspace hoáº·c danh sÃ¡ch offer.

## 11. Known Gaps VÃ  Skip Notes

- PayOS payment success tháº­t cáº§n credentials tháº­t vÃ  webhook callback há»£p lá»‡; náº¿u khÃ´ng cÃ³, dÃ¹ng `PAYMENT_PROVIDER=Mock` Ä‘á»ƒ smoke success/failure webhook local.
- SMTP tháº­t cáº§n provider há»£p lá»‡; náº¿u khÃ´ng cÃ³, account email OTP khÃ´ng nháº­n Ä‘Æ°á»£c trong inbox.
- Google login cáº§n Google OAuth client ID vÃ  frontend rebuild.
- Frontend Phase 3B execution Ä‘Ã£ cÃ³ workspace Student/SME; Admin review nÃ¢ng cao váº«n cÃ³ thá»ƒ test qua Swagger/API.
- Phase 4 refund/cancellation split rules chÆ°a hoÃ n thÃ nh: khÃ´ng ká»³ vá»ng cÃ¡c tá»· lá»‡ refund 100/0, 60/40, 20/80, 70/30 trong guide nÃ y.
- Portfolio, Ratings, Paid Packages, AI Matching, notification Ä‘áº§y Ä‘á»§ chÆ°a thuá»™c completed feature set trong guide nÃ y.
