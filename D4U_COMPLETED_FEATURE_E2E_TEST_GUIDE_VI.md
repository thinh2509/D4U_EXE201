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

Tài liệu này dùng để test thủ công toàn bộ feature D4U đã hoàn thành trên branch `develop`. Nội dung bám theo các mục đã tick `[x]` trong `BACKLOG_D4U_MVP.md`: Phase 1 Foundation, Phase 2 Marketplace, Phase 3A PayOS Escrow Payment, và Phase 3B Project Execution.

Không xem các phần sau là đã hoàn thành: Phase 4 refund/cancellation split rules, Portfolio Builder backend, Ratings, Paid Feature Packages, AI Matching entitlement, notification đầy đủ, automatic bank payout.

## 1. Chuẩn Bị Môi Trường

### 1.1. Branch Và Validation Nhanh

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

Kỳ vọng:

- Branch là `develop`.
- Working tree sạch.
- Backend build pass.
- Frontend build và lint pass.
- Nếu Vite báo chunk lớn hơn 500 kB, ghi nhận là warning, không phải blocker cho E2E manual test.

### 1.2. Docker Local

Docker Desktop phải chạy trước khi dùng Docker Compose.

```powershell
cd D:\Codex
docker compose down -v
docker compose up -d --build
docker compose ps
```

Kỳ vọng:

- `d4u-postgres` healthy.
- `d4u-api` running.
- `d4u-frontend` running.
- API tự chạy EF migrations vì `D4U_APPLY_MIGRATIONS=true` trong `docker-compose.yml`.

Nếu Docker báo không kết nối được `dockerDesktopLinuxEngine`, mở Docker Desktop rồi chạy lại.

### 1.3. URL Test

| Mục | URL |
| --- | --- |
| Frontend | `http://localhost:3000` |
| Login | `http://localhost:3000/login` |
| Register | `http://localhost:3000/register` |
| Verify account email | `http://localhost:3000/verify-email` |
| Swagger | `http://localhost:8080/swagger` |
| API base | `http://localhost:8080/api/v1` |

### 1.4. `.env` Tối Thiểu

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

Ghi chú:

- SMTP thật cần Gmail App Password hoặc provider SMTP hợp lệ.
- Google login chỉ test được nếu `GOOGLE_AUTH_CLIENT_ID` hợp lệ và frontend đã rebuild.
- PayOS thật cần credentials và webhook public callback hoặc công cụ tunnel.
- Local/test có thể dùng `PAYMENT_PROVIDER=Mock`; mock provider không gọi PayOS thật, trả checkout URL/QR giả và chấp nhận webhook có `signature = ""` hoặc `"mock"`.
- EDU verification local có thể dùng `STUDENT_EMAIL_INCLUDE_CODE_IN_RESPONSE=true` để lấy code trong response.

### 1.5. PostgreSQL Check

Kết nối DBeaver/pgAdmin:

| Field | Value |
| --- | --- |
| Host | `localhost` |
| Port | `5433` hoặc `POSTGRES_PORT` |
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

Kỳ vọng:

- Có seed `design_categories`.
- Có seed `Basic`, `Pro`, `Premium`.
- Có admin bootstrap nếu `.env` có `ADMIN_EMAIL` và `ADMIN_PASSWORD`.

## 2. Test Data Mẫu

| Role | Email mẫu | Password |
| --- | --- | --- |
| Student | `student.d4u.test+001@gmail.com` | `Student@123456` |
| SME | `sme.d4u.test+001@gmail.com` | `Sme@123456` |
| Admin | `ADMIN_EMAIL` trong `.env` | `ADMIN_PASSWORD` trong `.env` |

Project mẫu:

```json
{
  "title": "Thiết kế bộ nhận diện quán cà phê",
  "brief": "Thiết kế logo, bảng màu và guideline cơ bản cho một quán cà phê specialty mới tại TP.HCM.",
  "usagePurpose": "Dùng cho bảng hiệu, menu, social media và bao bì.",
  "projectType": "OPEN",
  "budgetAmount": 3000000,
  "currency": "VND",
  "isConfidential": false,
  "allowStudentPortfolio": true
}
```

Deadline gợi ý:

- `sketchDeadlineAt`: ngày mai hoặc sau đó.
- `finalDeadlineAt`: sau sketch deadline.
- `totalDeadlineAt`: sau final deadline.

## 3. Auth Và Account

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

- API trả user mới.
- User có `status = PENDING`.
- `email_verified_at` đang null.
- Login email/password bị chặn trước khi verify email.

SQL:

```sql
select email, username, role, status, email_verified_at
from users
where email in ('student.d4u.test+001@gmail.com', 'sme.d4u.test+001@gmail.com');

select email, status, requested_at, expires_at, confirmed_at
from user_email_verifications
order by requested_at desc;
```

### 3.2. Request Và Confirm Account Email

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

- Confirm đúng code trả `status = CONFIRMED`.
- `users.email_verified_at` được set.
- Login email/password bắt đầu thành công.

Negative:

- Confirm code sai trả lỗi.
- Login trước verify trả lỗi unauthorized.

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

- Login trả `accessToken`, `refreshToken`, user role đúng.
- `/auth/me` trả current user khi có Bearer token.
- Refresh trả access/refresh token mới.
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

- Chỉ hỗ trợ `STUDENT` và `SME`.
- Tạo/link user theo Google email.
- Lưu metadata provider trong `user_external_logins`.
- Không lưu Google access token.

Skip nếu chưa cấu hình `GOOGLE_AUTH_CLIENT_ID`.

## 4. Profile Và Verification

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
  "bio": "Sinh viên thiết kế đang tìm dự án nhận diện thương hiệu."
}
```

Expected:

- Profile được tạo/cập nhật.
- `verificationStatus` ban đầu là `NOT_SUBMITTED` hoặc chưa approved.

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

- SME profile được tạo.
- Basic subscription plan được gán khi cần publish/pay.

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

- Tạo `files` record.
- Tạo `student_verifications` status `PENDING`.
- Chỉ chấp nhận `jpg`, `png`, `pdf`.

Negative:

- `fileExtension = exe` bị chặn.

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

- Domain `.edu` hoặc `edu.vn` hợp lệ.
- Confirm thành công set student profile `verification_status = APPROVED`.
- Có thể apply project sau khi verified.

Negative:

- Email không thuộc allowed domain bị chặn.

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

- Approve set verification `APPROVED` và student profile `verification_status = APPROVED`.
- Reject set verification `REJECTED` kèm reason.

## 5. Marketplace

### 5.1. Design Categories

API:

- `GET /api/v1/design-categories`

Expected:

- Trả danh sách active categories.
- Dùng `id` đầu tiên làm `designCategoryId` cho project.

### 5.2. AI Project Brief Assistant

API:

- `POST /api/v1/ai/project-brief-assistant`

Request:

```json
{
  "rawIdea": "Tôi cần bộ nhận diện cho quán cà phê specialty mới.",
  "businessField": "Food and Beverage",
  "targetAudience": "Khách hàng trẻ tại TP.HCM",
  "preferredStyle": "Tối giản, ấm áp",
  "budgetAmount": 3000000,
  "totalDeadline": "2026-06-30T00:00:00Z"
}
```

Expected:

- Trả suggested title, brief, usage purpose, deliverables, category hint, deadline notes.
- Không tự publish project, không tự chọn student, không tự định giá cuối.

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
  "title": "Thiết kế bộ nhận diện quán cà phê",
  "brief": "Thiết kế logo, bảng màu và guideline cơ bản cho một quán cà phê specialty mới tại TP.HCM.",
  "usagePurpose": "Dùng cho bảng hiệu, menu, social media và bao bì.",
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

- Draft tạo với status `DRAFT`.
- Publish chuyển status `OPEN`.
- Project xuất hiện trong Student open project list.

Negative:

- Budget `<= 0` bị chặn.
- Sketch deadline sau final deadline bị chặn.
- Final deadline sau total deadline bị chặn.
- Basic plan không publish quá 2 active open projects.
- Basic plan không publish project trên `5,000,000 VND`.

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

- Chỉ cancel được `DRAFT`, `OPEN`, `PRIVATE_INVITED`.
- Status chuyển `CANCELLED`.

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
  "coverLetter": "Em đã từng làm nhận diện thương hiệu cho quán cà phê và có thể gửi sketch đầu trong 5 ngày.",
  "estimatedDurationDays": 14
}
```

Expected:

- Student verified mới apply được.
- Application status `SUBMITTED`.
- Open project response có `hasApplied = true`.

Negative:

- Apply duplicate cùng project bị chặn.
- Student chưa verified bị chặn.

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

- Offer tạo status `WAITING_ACCEPTANCE`.
- Project chuyển/giữ trạng thái offer selected theo flow backend.
- Student thấy offer ở `/student/offers`.

### 5.7. Student Accept/Reject Offer

UI:

- `http://localhost:3000/student/offers`

API:

- `POST /api/v1/offers/{offerId}/accept`
- `POST /api/v1/offers/{offerId}/reject`

Expected accept:

- Offer chuyển `ACCEPTED`.
- `paymentDueAt` được set 72 giờ sau khi accept.
- Project có selected student nhưng chưa `IN_PROGRESS` cho tới khi escrow funded.

Expected reject:

- Offer chuyển `REJECTED`.
- Nếu không còn active offer, project được release lại theo rule backend.

### 5.8. Offer Expiry 48 Giờ

Background service:

- `OfferPaymentExpiryBackgroundService`

Điều kiện:

- Offer đang `WAITING_ACCEPTANCE`.
- `expires_at <= now()`.

Manual DB setup để test nhanh:

```sql
update project_offers
set expires_at = now() - interval '1 minute'
where id = '<offer-id>' and status = 'WAITING_ACCEPTANCE';
```

Expected:

- Offer chuyển `EXPIRED`.
- `expired_at` được set.
- Nếu không còn offer active khác, project quay về `OPEN` hoặc `PRIVATE_INVITED`.
- Có audit log `OFFER_EXPIRED`.

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

Nếu test local không có PayOS thật, đặt `PAYMENT_PROVIDER=Mock` trong `.env`, chạy lại `docker compose up -d --build`, rồi dùng cùng endpoint payment/webhook bên dưới. Mock provider trả checkout URL/QR giả, không gọi PayOS.

### 6.1. SME Create Offer Payment

UI:

- `http://localhost:3000/sme/offers`

API:

- `POST /api/v1/offers/{offerId}/payment`

Expected:

- Chỉ SME owner tạo payment được.
- Chỉ offer `ACCEPTED` mới tạo payment được.
- Tạo hoặc reuse escrow status `PENDING_PAYMENT`.
- Trả `checkoutUrl` hoặc `qrCode`.
- Offer chuyển `PENDING_PAYMENT`.
- Nếu payment webhook fail trước khi hết 72 giờ, offer chuyển `PAYMENT_FAILED` và SME có thể tạo lại payment.

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

- Chỉ xử lý payment đang `PENDING`.
- Payment chuyển `SUCCESS`.
- Escrow chuyển `FUNDED`.
- Offer chuyển `ACTIVE`.
- Project chuyển `IN_PROGRESS`.

Expected failure:

- Payment chuyển `FAILED`.
- Offer chuyển `PAYMENT_FAILED`.
- Project không chuyển `IN_PROGRESS`.
- SME có thể tạo payment mới nếu `payment_due_at` vẫn còn hạn.

### 6.3. PayOS Webhook Success

API:

- `POST /api/v1/payments/payos/webhook`

Expected:

- Webhook signature hợp lệ mới được xử lý.
- Payment chuyển `SUCCESS`.
- Escrow chuyển `FUNDED`.
- Offer chuyển `ACTIVE`.
- Project chuyển `IN_PROGRESS`.
- Client-side success page không tự đánh dấu payment success nếu chưa có webhook hợp lệ.

Skip nếu chưa có PayOS credentials hoặc public callback URL.

### 6.4. Payment Window Expiry 72 Giờ

Background service:

- `OfferPaymentExpiryBackgroundService`

Manual DB setup để test nhanh:

```sql
update project_offers
set payment_due_at = now() - interval '1 minute'
where id = '<offer-id>' and status in ('ACCEPTED', 'PENDING_PAYMENT', 'PAYMENT_FAILED');

update payments
set expires_at = now() - interval '1 minute'
where escrow_id = '<escrow-id>' and status = 'PENDING';
```

Expected:

- Offer chuyển `EXPIRED`.
- Pending payment chuyển `EXPIRED`.
- Escrow `PENDING_PAYMENT` chuyển `CANCELLED`.
- Nếu không còn offer active khác, project quay về `OPEN` hoặc `PRIVATE_INVITED`.
- Webhook success đến muộn cho payment `FAILED`, `CANCELLED`, hoặc `EXPIRED` không được start project.

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

- SME owner, selected Student, hoặc Admin xem được escrow.
- User ngoài project bị chặn.

## 7. Project Execution

Lưu ý: frontend hiện có shell route cho execution/submissions, nhưng các thao tác Phase 3B chính nên test qua Swagger/API.

### 7.1. Student Submit Sketch

Điều kiện:

- Project status `IN_PROGRESS`.
- Escrow status `FUNDED`.
- User là selected Student.
- Có file metadata hợp lệ trong bảng `files`.

API:

- `POST /api/v1/projects/{projectId}/submissions`

Request:

```json
{
  "milestoneType": "SKETCH",
  "description": "Sketch logo và hướng visual đầu tiên.",
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

- Tạo `project_submissions` với `submission_type = SKETCH`, `milestone_type = SKETCH`, `status = SUBMITTED`.
- Tạo `submission_files`.
- Project chuyển `SKETCH_REVIEW`.
- `review_due_at` được set sau 5 business days.

Negative:

- File ngoài `jpg/png/pdf` bị chặn.
- Student không phải selected Student bị chặn.
- Project chưa funded escrow bị chặn.

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

- Submission chuyển `APPROVED`.
- Review action `APPROVE_SKETCH`.
- Project quay về `IN_PROGRESS`.
- Student có thể submit Final.

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

- Chỉ submit Final sau Sketch approved hoặc auto-approved.
- Project chuyển `FINAL_REVIEW`.
- Submission lưu `milestone_type = FINAL`.

Negative:

- Submit Final trước Sketch approved bị chặn.

### 7.4. SME Approve Final

API:

- `POST /api/v1/projects/{projectId}/submissions/{submissionId}/approve`

Expected:

- Submission chuyển `APPROVED`.
- Review action `APPROVE_FINAL`.
- Project chuyển `COMPLETED`.
- `projects.completed_at` được set.
- `projects.rating_due_at = completed_at + 7 ngày`.
- Escrow `FUNDED` chuyển `RELEASE_PENDING`, sau đó Phase 4A release service chuyển `RELEASED`.
- Student wallet được credit net amount sau platform fee.
- Không tự payout ngân hàng; withdrawal vẫn do Admin/Finance xử lý thủ công.

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
  "requestedChanges": "Vui lòng chỉnh lại bảng màu và typography theo hướng tối giản hơn.",
  "dueAt": "2026-06-25T00:00:00Z"
}
```

Expected:

- Submission hiện tại chuyển `REVISION_REQUESTED`.
- Project chuyển `REVISION_REQUESTED`.
- `projects.current_revision_round` tăng 1.
- Tạo `review_actions` action `REQUEST_REVISION`.

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

- Revision submit dùng `submission_type = REVISION`.
- Project quay lại `SKETCH_REVIEW` hoặc `FINAL_REVIEW` theo milestone cần revise.

### 7.6. Revision Không Giới Hạn

SME có thể yêu cầu chỉnh sửa nhiều lần khi cần. Hệ thống vẫn tăng `revision_round` để audit nhưng không chặn theo số lần chỉnh sửa và không chuyển `ADMIN_REVIEW` do hết lượt.

### 7.7. SME Report Invalid File

API:

- `POST /api/v1/projects/{projectId}/submissions/{submissionId}/invalid-file-reports`

Request:

```json
{
  "reason": "CANNOT_OPEN",
  "description": "File PDF không mở được.",
  "reuploadDueAt": "2026-06-24T00:00:00Z"
}
```

Expected:

- Submission chuyển `INVALID_REPORTED`.
- Tạo `review_actions` action `REPORT_INVALID_FILE`.
- Lưu `invalid_file_reason`, description, `reupload_due_at`.

### 7.8. Auto-Approve Sau 5 Business Days

Background service:

- `SubmissionAutoApprovalBackgroundService`

Expected:

- Submission `SUBMITTED` có `review_due_at <= now` sẽ auto-approve nếu project đang `SKETCH_REVIEW` hoặc `FINAL_REVIEW`.
- Sketch auto-approve chuyển project về `IN_PROGRESS`.
- Final auto-approve chuyển project `COMPLETED`.
- Final auto-approve dùng cùng completion handoff: set `completed_at`, `rating_due_at`, escrow release sang `RELEASED`, credit Student wallet.
- Tạo review action `AUTO_APPROVE`.
- Tạo audit log `PROJECT_STATUS_CHANGED`.

Manual DB setup để test nhanh:

```sql
update project_submissions
set review_due_at = now() - interval '1 minute'
where id = '<submission-id>';
```

Sau đó chờ background service poll, hoặc restart API container:

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

## 8. Wallet, Disbursement Và Withdrawal

### 8.1. Escrow Release Và Wallet Credit

Điều kiện:

- Project đã `COMPLETED`.
- Escrow đã được handoff sang `RELEASE_PENDING`.
- Student profile của selected student tồn tại.

API retry/idempotency:

- `POST /api/v1/projects/{projectId}/escrow/release` với Admin token.

Expected:

- Escrow chuyển `RELEASED`, set `released_at`.
- Tạo đúng một `disbursements` record status `COMPLETED`.
- `gross_amount = escrows.amount`.
- `platform_fee_amount = escrows.platform_fee_amount` hoặc `amount * platform_fee_rate`.
- `net_amount = gross_amount - platform_fee_amount`.
- Student wallet được auto-create nếu chưa có.
- `wallets.available_balance` tăng đúng `net_amount`.
- Tạo `wallet_transactions` type `DISBURSEMENT_CREDIT`.
- Gọi release lại không double credit.
- Có audit log `ESCROW_RELEASED` và `WALLET_BALANCE_CHANGED`.

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

- Student thấy available, pending, locked balance, currency và status.
- Ledger hiển thị `DISBURSEMENT_CREDIT`, `WITHDRAWAL_DEBIT`, `WITHDRAWAL_FAILED_REVERSAL`.
- Non-Student bị chặn bởi role authorization.

### 8.3. Payment Method Và Withdrawal Request

API:

- `POST /api/v1/payment-methods`
- `GET /api/v1/payment-methods/me`
- `POST /api/v1/withdrawal-requests`
- `GET /api/v1/withdrawal-requests/me`

Create payment method request:

```json
{
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

- Payment method chỉ lưu `masked_account_number`, không lưu raw bank account number.
- Amount dưới `50,000 VND` bị chặn.
- Wallet không `ACTIVE` bị chặn.
- Student `can_withdraw = false` bị chặn.
- Không đủ available balance bị chặn.
- Pending withdrawal move `available_balance` sang `locked_balance`.
- Fee cố định `5,000 VND`, `net_amount = amount - 5,000`.

SQL check:

```sql
select account_holder_name, masked_account_number, provider_token, is_default, status
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

Complete request:

```json
{
  "decision": "COMPLETED",
  "failureReason": null
}
```

Failed request:

```json
{
  "decision": "FAILED",
  "failureReason": "Bank transfer was rejected."
}
```

Expected completed:

- Withdrawal chuyển `COMPLETED`.
- Wallet locked balance giảm theo amount.
- Tạo `wallet_transactions` type `WITHDRAWAL_DEBIT`.
- Có audit log `WITHDRAWAL_PROCESSED`.

Expected failed:

- Withdrawal chuyển `FAILED`, lưu failure reason.
- Wallet locked balance giảm, available balance tăng lại theo amount.
- Tạo `wallet_transactions` type `WITHDRAWAL_FAILED_REVERSAL`.
- Có audit log `WITHDRAWAL_PROCESSED`.

## 9. Negative Regression Checklist

| Case | Expected |
| --- | --- |
| Login email/password trước account email verification | Bị chặn |
| Register role `ADMIN` qua public endpoint | Bị chặn |
| Google login role không phải `STUDENT`/`SME` | Bị chặn |
| Student verification file `exe` | Bị chặn |
| EDU email domain không thuộc allowlist | Bị chặn |
| Project budget `0` hoặc âm | Bị chặn |
| Sketch deadline sau Final deadline | Bị chặn |
| Final deadline sau Total deadline | Bị chặn |
| Basic plan publish project thứ 3 đang `OPEN` | Bị chặn |
| Basic plan budget trên `5,000,000 VND` | Bị chặn |
| Student apply trùng project | Bị chặn |
| Offer `WAITING_ACCEPTANCE` quá 48 giờ | Chuyển `EXPIRED`, project release nếu không còn active offer |
| SME tạo payment khi offer chưa accepted | Bị chặn |
| Offer accepted quá 72 giờ chưa paid | Offer `EXPIRED`, pending payment `EXPIRED`, escrow `CANCELLED` |
| Webhook success đến sau payment `FAILED`/`CANCELLED`/`EXPIRED` | Không start project |
| Client tự gọi success page payment | Không đổi payment/escrow/project nếu không có webhook |
| Student submit Sketch khi escrow chưa `FUNDED` | Bị chặn |
| Student submit Final trước Sketch approved | Bị chặn |
| SME không owner review submission | Bị chặn |
| Admin force complete project không ở `ADMIN_REVIEW` | Bị chặn |
| Release escrow đã `RELEASED` lần nữa | Không double credit wallet |
| Withdrawal dưới `50,000 VND` | Bị chặn |
| Withdrawal khi `can_withdraw = false` | Bị chặn |
| Non-Admin process withdrawal | Bị chặn |

## 10. SQL Tổng Hợp Sau E2E

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

## 11. Known Gaps Và Skip Notes

- PayOS payment success thật cần credentials thật và webhook callback hợp lệ; nếu không có, dùng `PAYMENT_PROVIDER=Mock` để smoke success/failure webhook local.
- SMTP thật cần provider hợp lệ; nếu không có, account email OTP không nhận được trong inbox.
- Google login cần Google OAuth client ID và frontend rebuild.
- Frontend Phase 3B execution hiện chủ yếu là shell route; test submission/review/admin execution qua Swagger/API.
- Phase 4 refund/cancellation split rules chưa hoàn thành: không kỳ vọng các tỷ lệ refund 100/0, 60/40, 20/80, 70/30 trong guide này.
- Portfolio, Ratings, Paid Packages, AI Matching, notification đầy đủ chưa thuộc completed feature set trong guide này.
