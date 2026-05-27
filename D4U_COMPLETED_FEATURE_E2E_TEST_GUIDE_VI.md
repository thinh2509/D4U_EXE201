# D4U Completed Feature E2E Test Guide

Tài liệu này dùng để test thủ công toàn bộ feature D4U đã hoàn thành trên branch `develop`. Nội dung bám theo các mục đã tick `[x]` trong `BACKLOG_D4U_MVP.md`: Phase 1 Foundation, Phase 2 Marketplace, Phase 3A PayOS Escrow Payment, và Phase 3B Project Execution.

Không xem các phần sau là đã hoàn thành: Phase 4 wallet/disbursement, Portfolio Builder backend, Ratings, Paid Feature Packages, AI Matching entitlement, notification đầy đủ, automatic bank payout.

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
  "maxRevisionRounds": 2,
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
  "maxRevisionRounds": 2,
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
- Escrow `FUNDED` chuyển `RELEASE_PENDING`.
- Không credit wallet, không tạo withdrawal, không tự payout ngân hàng trong MVP hiện tại.

SQL check:

```sql
select p.status, p.completed_at, p.rating_due_at, e.status as escrow_status
from projects p
left join escrows e on e.project_id = p.id
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

### 7.6. Revision Limit Và Admin Review

Điều kiện:

- Project có `maxRevisionRounds = 0` hoặc đã đạt limit.

API:

- SME gọi `POST /api/v1/projects/{projectId}/submissions/{submissionId}/revision-requests`.

Expected:

- Khi vượt/đạt limit, project chuyển `ADMIN_REVIEW`.
- SME không tạo thêm revision round mới.

Admin force complete:

```json
{
  "reason": "Admin resolved after revision limit."
}
```

API:

- `POST /api/v1/projects/{projectId}/admin/force-complete`

Expected:

- Chỉ Admin gọi được.
- Project phải đang `ADMIN_REVIEW`.
- Project chuyển `COMPLETED`.
- Tạo review action `ADMIN_FORCE_COMPLETE` và audit log.

Admin cancel:

- `POST /api/v1/projects/{projectId}/admin/cancel`

Expected:

- Project chuyển `CANCELLED`.
- Có cancellation reason.
- Tạo review action `ADMIN_CANCEL` và audit log.

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
- Final auto-approve dùng cùng completion handoff: set `completed_at`, `rating_due_at`, escrow `RELEASE_PENDING`.
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

## 8. Negative Regression Checklist

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

## 9. SQL Tổng Hợp Sau E2E

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

select submission_type, milestone_type, revision_round, status, submitted_at, review_due_at, approved_at, auto_approved_at
from project_submissions
order by submitted_at desc;

select action, invalid_file_reason, revision_round, due_at, reupload_due_at, created_at
from review_actions
order by created_at desc;
```

## 10. Known Gaps Và Skip Notes

- PayOS payment success thật cần credentials thật và webhook callback hợp lệ; nếu không có, dùng `PAYMENT_PROVIDER=Mock` để smoke success/failure webhook local.
- SMTP thật cần provider hợp lệ; nếu không có, account email OTP không nhận được trong inbox.
- Google login cần Google OAuth client ID và frontend rebuild.
- Frontend Phase 3B execution hiện chủ yếu là shell route; test submission/review/admin execution qua Swagger/API.
- Phase 4 money movement chưa hoàn thành: chỉ test completion handoff tới `COMPLETED`, `RELEASE_PENDING`, `rating_due_at`; không kỳ vọng wallet credit, disbursement, withdrawal sau Final approval.
- Portfolio, Ratings, Paid Packages, AI Matching, notification đầy đủ chưa thuộc completed feature set trong guide này.
