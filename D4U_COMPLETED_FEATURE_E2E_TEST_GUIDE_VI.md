# D4U Outcome 1 E2E Test Guide

Tài liệu này là checklist test thủ công cho toàn bộ tính năng **Outcome 1** và các business rule chính trong codebase hiện tại. Source of truth scope: `D:\Download\D4U_Outcome1_Master.docx` và `BACKLOG_D4U_MVP.md`.

Guide thao tác core chi tiết từng màn SME/Student nằm tại [D4U_CORE_INTERACTION_E2E_TEST_GUIDE_VI.md](D4U_CORE_INTERACTION_E2E_TEST_GUIDE_VI.md). PayOS live smoke nằm tại [PAYOS_LIVE_SMOKE_RUNBOOK_VI.md](PAYOS_LIVE_SMOKE_RUNBOOK_VI.md).

## 1. Phạm Vi Outcome 1

Outcome 1 cần pass các nhóm sau:

- Foundation/Auth/Profile/Admin verification.
- File metadata, categories, subscription seed.
- Project marketplace, application, offer, offer expiry.
- PayOS escrow payment-in, webhook, payment expiry.
- Project execution: Sketch, Final, revision, invalid file, auto-approve, admin review.
- Student abandon before submission và Admin manual SME refund.
- Wallet, disbursement, payment method, manual withdrawal.
- Rating hai chiều sau project completed.
- In-app notifications cho 5 event core.
- Audit logs cho money/project/payment state changes.
- Demo readiness: build, E2E script, desktop/mobile route check, response time.

Không test như Outcome 1 blocker:

- Portfolio Builder.
- AI Matching.
- Paid Packages.
- Realtime chat.
- Dispute workflow.
- Automatic bank payout.
- Mid-project SME cancellation.
- Partial refund by milestone.
- PayOS refund API.

## 2. Chuẩn Bị Môi Trường

### 2.1. Branch Và Build

```powershell
cd D:\Codex
git status --short --branch
dotnet build
cd FE
npm run lint
npm run build
cd ..
```

Kỳ vọng:

- Đang ở branch cần test, ví dụ `feature/outcome1-hardening` hoặc branch đã merge.
- Backend build pass.
- Frontend lint/build pass. Vite warning chunk lớn hơn 500 kB không phải blocker.

### 2.2. Reset Local Data Để Test Từ Đầu

```powershell
cd D:\Codex
docker compose down -v
docker compose up -d --build
docker compose ps
Invoke-RestMethod -Uri http://localhost:8080/health
```

Kỳ vọng:

- `d4u-postgres` healthy.
- `d4u-api` running ở `http://localhost:8080`.
- `d4u-frontend` running ở `http://localhost:3000`.
- API health trả `{ "status": "ok" }`.
- Nếu chỉ seed Admin, `.env` không bật `DemoSeed__Enabled=true`.

### 2.3. Seed Và Cấu Hình Cần Kiểm Tra

SQL:

```sql
select role, count(*) from users group by role order by role;

select code, platform_fee_rate, max_active_open_projects, max_project_budget
from subscription_plans
order by code;

select count(*) as categories_count from design_categories;
```

Kỳ vọng sau reset chỉ seed Admin:

- `ADMIN = 1`.
- `STUDENT = 0`, `SME = 0`.
- Có design categories.
- Subscription plans:
  - `BASIC`: fee `0.10`, max open projects `2`, max budget `5,000,000`.
  - `PRO`: fee `0.07`, max open projects `10`, max budget `20,000,000`.
  - `PREMIUM`: fee `0.05`, unlimited project count và budget.

## 3. Test Data Mẫu

Tài khoản:

| Role | Email mẫu | Password |
| --- | --- | --- |
| Admin | `ADMIN_EMAIL` trong `.env` | `ADMIN_PASSWORD` trong `.env` |
| SME | `sme.d4u.test+001@gmail.com` | `Sme@123456` |
| Student | `student.d4u.test+001@gmail.com` | `Student@123456` |

Project mẫu:

```json
{
  "title": "Outcome 1 Smoke - Brand Identity",
  "brief": "Thiết kế logo, bảng màu và guideline cơ bản cho quán cà phê specialty.",
  "usagePurpose": "Dùng cho bảng hiệu, menu, social media và bao bì.",
  "projectType": "OPEN",
  "budgetAmount": 100000,
  "currency": "VND",
  "isConfidential": false,
  "allowStudentPortfolio": true
}
```

Deadline:

- `sketchDeadlineAt`: tương lai.
- `finalDeadlineAt`: sau sketch deadline.
- `totalDeadlineAt`: sau final deadline.

File hợp lệ:

- `.jpg`, `.png`, `.pdf`.
- Tối đa 20 MB mỗi file.

## 4. Happy Path Outcome 1 8 Bước

### Bước 1: Account, Profile, Student Verification

UI:

- `/register`
- `/verify-email`
- `/student/profile`
- `/student/verification`
- `/admin/verifications`
- `/sme/profile`

API chính:

```text
POST /api/v1/auth/register
POST /api/v1/auth/email-verification/request
POST /api/v1/auth/email-verification/confirm
POST /api/v1/auth/login
GET  /api/v1/auth/me
PUT  /api/v1/students/me
POST /api/v1/students/me/verification
GET  /api/v1/admin/student-verifications
POST /api/v1/admin/student-verifications/{verificationId}/approve
PUT  /api/v1/smes/me
```

Kỳ vọng:

- Register tạo user `PENDING`.
- Login email/password bị chặn trước khi account email verified.
- Confirm email thành công set `email_verified_at`, login được.
- Student tạo profile, upload metadata document `jpg/png/pdf`, tạo verification `PENDING`.
- Admin approve verification, Student profile chuyển `APPROVED`.
- SME tạo profile và được gắn Basic plan khi cần.

Business rules:

- Public register không cho tạo `ADMIN`.
- Google login chỉ cho `STUDENT` và `SME`.
- Suspended/banned/deleted users bị chặn business actions.
- Verification file extension ngoài `jpg/png/pdf` bị chặn.

### Bước 2: SME Create/Publish Project, Student Apply

UI:

- `/sme/projects/new`
- `/sme/projects`
- `/student/projects`

API:

```text
GET  /api/v1/design-categories
POST /api/v1/projects
PUT  /api/v1/projects/{projectId}
POST /api/v1/projects/{projectId}/publish
GET  /api/v1/projects
POST /api/v1/projects/{projectId}/applications
```

Kỳ vọng:

- Draft tạo status `DRAFT`.
- Publish chuyển `OPEN`.
- Student verified thấy project trong marketplace và apply được.
- Application lưu proposed price, cover letter/solution note, estimated duration nếu có.
- Duplicate application bị chặn bởi service và unique constraint.

Business rules:

- Budget phải `> 0`.
- Sketch deadline phải trước hoặc bằng final deadline.
- Final deadline phải trước hoặc bằng total deadline.
- Basic plan không publish quá `2` active open projects.
- Basic plan không publish project trên `5,000,000 VND`.
- Student chưa verified không apply được.
- SME chỉ cancel được draft/open/private-invited trước execution.

### Bước 3: SME Create Offer, Student Accept

UI:

- `/sme/projects/{projectId}/applications`
- `/sme/offers`
- `/student/offers`

API:

```text
GET  /api/v1/projects/{projectId}/applications
POST /api/v1/projects/{projectId}/offers
PATCH /api/v1/projects/{projectId}/deadlines
POST /api/v1/offers/{offerId}/accept
POST /api/v1/offers/{offerId}/reject
GET  /api/v1/smes/me/offers
GET  /api/v1/students/me/offers
```

Kỳ vọng:

- Offer tạo status `WAITING_ACCEPTANCE`.
- Student accept trước khi SME thanh toán.
- Accept chuyển offer `ACCEPTED`, set `paymentDueAt` sau 24 giờ.
- Reject/expired release project về `OPEN` hoặc `PRIVATE_INVITED` nếu không còn active offer.
- Notification `NEW_OFFER` được tạo cho Student.

Business rules:

- Offer waiting acceptance hết 24 giờ chuyển `EXPIRED`.
- Accepted offer hết 24 giờ chưa paid chuyển `EXPIRED`.
- SME không được start escrow payment trước khi Student accept offer.
- Active offer duplicate cho cùng student/project bị chặn.
- Tạo offer khi hạn Sketch còn dưới `48 giờ` bị chặn với `409 Conflict`.
- SME được sửa deadline khi offer còn `WAITING_ACCEPTANCE`; Student thấy deadline mới và nhận notification.
- Deadline bị khóa sau khi offer chuyển `ACCEPTED`.

### Bước 4: SME PayOS Escrow Payment

UI:

- `/sme/offers`
- `/projects/{projectId}/execution`
- `/payment/success`
- `/payment/cancel`

API:

```text
POST /api/v1/offers/{offerId}/payment
GET  /api/v1/payments/{paymentId}
GET  /api/v1/payments/{paymentId}/return-status
POST /api/v1/payments/payos/webhook
GET  /api/v1/projects/{projectId}/escrow
```

Kỳ vọng:

- Payment tạo trước khi gọi provider.
- Escrow tạo hoặc reuse với amount, currency, fee rate, fee amount, status.
- PayOS trả checkout link hoặc QR.
- Client return page chỉ poll backend, không tự set success từ query string.
- Webhook signature hợp lệ mới xử lý business logic.
- Payment success chuyển:
  - payment `SUCCESS`.
  - escrow `FUNDED`.
  - offer `ACTIVE`.
  - project `IN_PROGRESS`.
- Notification `PAYMENT_SUCCESS` tạo cho Student.
- Audit logs có `PAYMENT_WEBHOOK_SUCCESS` và `ESCROW_FUNDED`.

Business rules:

- Payment amount PayOS phải khớp payment amount.
- Payment `FAILED`, `CANCELLED`, `EXPIRED` không được start project.
- Provider transaction id unique theo provider.
- Pending checkout hết hạn chuyển payment `EXPIRED`.
- Offer payment expiry background job idempotent.
- Webhook duplicate không double-start project.

### Bước 5: Student Submit Sketch, SME Review

UI:

- `/projects/{projectId}/execution`

API:

```text
POST /api/v1/files/submissions
POST /api/v1/projects/{projectId}/submissions
GET  /api/v1/projects/{projectId}/workspace
GET  /api/v1/projects/{projectId}/submissions
GET  /api/v1/files/{fileId}/download
POST /api/v1/projects/{projectId}/submissions/{submissionId}/approve
POST /api/v1/projects/{projectId}/submissions/{submissionId}/revision-requests
POST /api/v1/projects/{projectId}/submissions/{submissionId}/invalid-file-reports
```

Kỳ vọng:

- Student selected mới submit được.
- Sketch submission tạo status `SUBMITTED`, project `SKETCH_REVIEW`.
- Notification `NEW_SUBMISSION` tạo cho SME.
- SME approve Sketch chuyển submission `APPROVED`, project về `IN_PROGRESS`.
- Notification `REVIEW_ACTION` tạo cho Student.
- Student chỉ submit Final sau Sketch approved hoặc auto-approved.

Business rules:

- Chỉ nhận file `jpg/png/pdf`, tối đa 20 MB, signature phải khớp extension.
- File upload thành công nhưng orphan sẽ được cleanup background job.
- SME không owner không review/download được.
- Revision request tăng `current_revision_round`.
- Khi `current_revision_round >= maxRevisionRounds` thì project chuyển `ADMIN_REVIEW`.
- Invalid file report không tính là revision round, lưu reason/description/reupload due date.

### Bước 6: Student Submit Final, Completion, Escrow Release

API:

```text
POST /api/v1/projects/{projectId}/submissions
POST /api/v1/projects/{projectId}/submissions/{submissionId}/approve
POST /api/v1/projects/{projectId}/escrow/release
GET  /api/v1/wallets/me
GET  /api/v1/wallets/me/transactions
```

Kỳ vọng:

- Final submission chuyển project `FINAL_REVIEW`.
- Final submission chưa làm tăng số dư ví Student.
- `reviewDueAt = min(5 ngày làm việc từ lúc nộp, totalDeadlineAt)`.
- SME approve Final:
  - submission `APPROVED`.
  - project `COMPLETED`.
  - `completed_at` set.
  - `rating_due_at = completed_at + 7 ngày`.
  - escrow chuyển `RELEASE_PENDING`, sau đó `RELEASED`.
- Disbursement tạo đúng một record.
- Student wallet auto-create nếu chưa có.
- Wallet available balance tăng đúng net amount.
- Wallet transaction `DISBURSEMENT_CREDIT`.
- Notification `ESCROW_RELEASED` tạo cho Student.
- Audit logs có `ESCROW_RELEASED`, `WALLET_BALANCE_CHANGED`.
- Nếu đến `totalDeadlineAt` và có Final đang chờ review, hệ thống auto-approve rồi giải ngân.
- Nếu đến `totalDeadlineAt` mà chưa có Final hợp lệ, project chuyển `ADMIN_REVIEW` và không giải ngân.

Business rules:

- Platform fee dùng fee rate đã đóng băng trên escrow lúc funding.
- Basic fee Outcome 1 là `10%`, Pro `7%`, Premium `5%`.
- `netAmount = grossAmount - platformFeeAmount`.
- Retry release không double-credit wallet.
- Wallet balance không âm, có DB constraint và service validation.

### Bước 7: Student Abandon/Refund Và Withdrawal

Student abandon before any submission:

```text
POST /api/v1/projects/{projectId}/abandon
GET  /api/v1/admin/refunds
POST /api/v1/admin/refunds/{refundId}/mark-completed
```

Kỳ vọng:

- Student chỉ abandon project `IN_PROGRESS` trước mọi submission.
- Reason bắt buộc.
- Project chuyển `STUDENT_ABANDONED`.
- Escrow chuyển `REFUND_PENDING`.
- Tạo refund `PENDING` cho Admin manual processing.
- Admin mark completed chuyển escrow `REFUNDED`.
- Current accepted deviation: refund dùng `/admin/refunds`, không trộn vào withdrawal list với `isRefund=true`.

Withdrawal:

```text
POST /api/v1/payment-methods
GET  /api/v1/payment-methods/me
POST /api/v1/withdrawal-requests
GET  /api/v1/withdrawal-requests/me
GET  /api/v1/admin/withdrawal-requests
POST /api/v1/admin/withdrawal-requests/{withdrawalRequestId}/process
```

Kỳ vọng:

- Student tạo bank account payment method với bank name, holder name, account number.
- Student API chỉ thấy masked account number.
- Admin withdrawal API thấy full protected account number để chuyển khoản thủ công.
- Withdrawal minimum `50,000 VND`.
- Withdrawal fixed fee `5,000 VND`.
- `netAmount = amount - 5,000`.
- Pending withdrawal khóa tiền: available giảm, locked tăng.
- Chỉ có một withdrawal `PENDING` hoặc `PROCESSING` tại một thời điểm.
- Complete tạo `WITHDRAWAL_DEBIT`.
- Complete bắt buộc `bankTransactionReference` và `transferredAt`.
- Student nhận notification `WITHDRAWAL_COMPLETED`; click notification mở đúng withdrawal trên `/student/wallet`.
- Khi có withdrawal `PENDING` hoặc `PROCESSING`, trang ví tự refresh tối đa mỗi 30 giây và refresh khi tab được focus lại.
- Failed tạo `WITHDRAWAL_FAILED_REVERSAL`, trả tiền về available.
- Audit log `WITHDRAWAL_PROCESSED`.

Business rules:

- Wallet phải `ACTIVE`.
- Student `can_withdraw = true`.
- Không đủ available balance bị chặn.
- Non-Admin không process withdrawal.
- Automatic bank payout không thuộc Outcome 1.

### Bước 8: Rating, Notifications, Audit, Demo Readiness

Rating:

```text
POST /api/v1/projects/{projectId}/ratings
GET  /api/v1/ratings/me
```

Kỳ vọng:

- Chỉ rating sau project `COMPLETED`.
- Student rating SME.
- SME rating Student.
- One rating per rater, rated user, project.
- Rating value integer `1..5`.
- Comment tối đa 500 ký tự.
- Rating trong 7 ngày sau completion.
- Expired rating window trả `410 Gone`.
- Average rating profile được cập nhật.

Notifications:

```text
GET  /api/v1/notifications
GET  /api/v1/notifications/unread-count
POST /api/v1/notifications/{notificationId}/read
POST /api/v1/notifications/read-all
```

Kỳ vọng:

- Có notifications core:
  - `NEW_OFFER` to Student.
  - `PAYMENT_SUCCESS` to Student.
  - `NEW_SUBMISSION` to SME.
  - `REVIEW_ACTION` to Student.
  - `ESCROW_RELEASED` to Student.
- List newest-first.
- Unread count đúng.
- Mark read và read-all đúng.
- Notification creation non-blocking: nếu notification fail thì không rollback business transaction.

Audit:

```sql
select action, entity_type, entity_id, before_json, after_json, created_at
from audit_logs
order by created_at desc;
```

Kỳ vọng có logs:

- `PROJECT_STATUS_CHANGED`.
- `PAYMENT_WEBHOOK_SUCCESS`.
- `PAYMENT_WEBHOOK_FAILED`.
- `ESCROW_FUNDED`.
- `ESCROW_RELEASED`.
- `ESCROW_REFUNDED`.
- `WALLET_BALANCE_CHANGED`.
- `WITHDRAWAL_PROCESSED`.
- Auto-approval/Admin review decisions có machine-readable reason.

## 5. Business Rule Regression Matrix

| ID | Nhóm | Test | Kỳ vọng |
| --- | --- | --- | --- |
| BR-AUTH-01 | Auth | Login trước email verification | Bị chặn. |
| BR-AUTH-02 | Auth | Register public role `ADMIN` | Bị chặn. |
| BR-AUTH-03 | Auth | Google self-registration role `ADMIN` | Bị chặn. |
| BR-AUTH-04 | Account status | Suspended/banned/deleted user gọi business API | Bị chặn. |
| BR-FILE-01 | File | Upload `.exe` verification/submission | Bị chặn. |
| BR-FILE-02 | File | File giả đuôi `.pdf` nhưng signature sai | Bị chặn. |
| BR-FILE-03 | File | Submission file lớn hơn 20 MB | Bị chặn. |
| BR-SUB-01 | Subscription | Basic publish project thứ 3 đang `OPEN` | Bị chặn. |
| BR-SUB-02 | Subscription | Basic publish budget `> 5,000,000` | Bị chặn. |
| BR-SUB-03 | Subscription | Pro publish project thứ 11 đang `OPEN` | Bị chặn. |
| BR-PROJ-01 | Project | Budget `0` hoặc âm | Bị chặn. |
| BR-PROJ-02 | Project | Sketch deadline sau Final | Bị chặn. |
| BR-PROJ-03 | Project | Final deadline sau Total | Bị chặn. |
| BR-PROJ-04 | Project | SME cancel funded/in-progress project | Bị chặn trong Outcome 1. |
| BR-APP-01 | Application | Student chưa verified apply | Bị chặn. |
| BR-APP-02 | Application | Apply duplicate same project | Bị chặn. |
| BR-OFFER-01 | Offer | SME tạo active offer duplicate same student/project | Bị chặn. |
| BR-OFFER-02 | Offer | Offer `WAITING_ACCEPTANCE` quá 24 giờ | `EXPIRED`, project release nếu không còn active offer. |
| BR-OFFER-03 | Offer | Accepted offer quá 24 giờ chưa paid | `EXPIRED`, payment/escrow pending được xử lý an toàn. |
| BR-OFFER-04 | Offer | Hạn Sketch còn dưới 48 giờ khi SME tạo offer | `409 Conflict`, yêu cầu SME điều chỉnh deadline. |
| BR-OFFER-05 | Offer | SME sửa deadline sau khi Student accept | Bị chặn. |
| BR-PAY-01 | Payment | SME tạo payment khi offer chưa accepted | Bị chặn. |
| BR-PAY-02 | Payment | Client tự mở success URL | Không đổi payment/escrow/project. |
| BR-PAY-03 | Payment | Webhook invalid signature | Bị chặn, không xử lý business. |
| BR-PAY-04 | Payment | PayOS amount mismatch | Bị chặn. |
| BR-PAY-05 | Payment | Success webhook sau payment inactive | Không start project. |
| BR-SUBMIT-01 | Submission | Student submit Sketch khi escrow chưa funded | Bị chặn. |
| BR-SUBMIT-02 | Submission | Student không selected submit | Bị chặn. |
| BR-SUBMIT-03 | Submission | Student submit Final trước Sketch approved | Bị chặn. |
| BR-SUBMIT-04 | Submission | Student gửi bản nộp sau `totalDeadlineAt` | Bị chặn và chờ Admin review. |
| BR-REVIEW-01 | Review | SME không owner approve/request revision | Bị chặn. |
| BR-REVIEW-02 | Review | Revision round đạt `maxRevisionRounds` | Project `ADMIN_REVIEW`. |
| BR-REVIEW-03 | Review | Admin force complete/cancel khi không `ADMIN_REVIEW` | Bị chặn. |
| BR-REVIEW-04 | Review | Total deadline đến khi Final đang chờ review | Auto-approve Final, complete và giải ngân. |
| BR-REVIEW-05 | Review | Total deadline đến nhưng chưa có Final hợp lệ | Project `ADMIN_REVIEW`, không tự giải ngân. |
| BR-ABANDON-01 | Abandon | Student abandon sau submission bất kỳ | Bị chặn. |
| BR-ABANDON-02 | Abandon | Student abandon không có reason | Bị chặn. |
| BR-REFUND-01 | Refund | Non-Admin process refund | Bị chặn. |
| BR-WALLET-01 | Wallet | Release escrow retry | Không double-credit. |
| BR-WD-01 | Withdrawal | Amount dưới `50,000` | Bị chặn. |
| BR-WD-02 | Withdrawal | Fee display/calculation | Fee `5,000`, net `amount - 5,000`. |
| BR-WD-03 | Withdrawal | Wallet không `ACTIVE` | Bị chặn. |
| BR-WD-04 | Withdrawal | `can_withdraw = false` | Bị chặn. |
| BR-WD-05 | Withdrawal | Tạo withdrawal thứ hai khi có pending/processing | Bị chặn. |
| BR-WD-06 | Withdrawal | Admin complete nhưng thiếu mã giao dịch hoặc thời gian chuyển | Bị chặn. |
| BR-WD-07 | Withdrawal | Admin complete hợp lệ | Student nhận notification và UI cập nhật trong tối đa 30 giây. |
| BR-RATE-01 | Rating | Rating trước completed | Bị chặn. |
| BR-RATE-02 | Rating | Rating duplicate | Bị chặn. |
| BR-RATE-03 | Rating | Rating value ngoài `1..5` | Bị chặn. |
| BR-RATE-04 | Rating | Rating sau 7 ngày | `410 Gone`. |
| BR-NOTIF-01 | Notification | Mark read notification của user khác | Bị chặn. |

## 6. SQL Checkpoints Sau E2E

```sql
select email, role, status, email_verified_at
from users
order by created_at;

select sp.id, u.email, sp.verification_status, sp.can_withdraw
from student_profiles sp
join users u on u.id = sp.user_id;

select sm.id, u.email, sm.subscription_plan_id, sm.active_open_project_count
from sme_profiles sm
join users u on u.id = sm.user_id;

select code, platform_fee_rate, max_active_open_projects, max_project_budget
from subscription_plans
order by code;

select title, status, selected_student_profile_id, current_revision_round,
       max_revision_rounds, completed_at, rating_due_at, cancelled_at
from projects
order by created_at desc;

select project_id, student_profile_id, status, proposed_price, submitted_at
from project_applications
order by submitted_at desc;

select project_id, student_profile_id, status, offered_amount, expires_at,
       payment_due_at, accepted_at, rejected_at, expired_at
from project_offers
order by created_at desc;

select provider, provider_order_code, provider_transaction_id, status,
       amount, paid_at, expires_at
from payments
order by created_at desc;

select project_id, status, amount, currency, platform_fee_rate,
       platform_fee_amount, funded_at, released_at, refunded_at
from escrows
order by created_at desc;

select project_id, submission_type, milestone_type, revision_round,
       status, submitted_at, review_due_at, approved_at, auto_approved_at
from project_submissions
order by submitted_at desc;

select action, invalid_file_reason, revision_round, due_at, reupload_due_at, created_at
from review_actions
order by created_at desc;

select escrow_id, gross_amount, platform_fee_amount, net_amount, status, completed_at
from disbursements
order by created_at desc;

select owner_user_id, available_balance, pending_balance, locked_balance, currency, status
from wallets
order by created_at desc;

select type, amount, balance_after, reference_type, reference_id, created_at
from wallet_transactions
order by created_at desc;

select amount, fee_amount, net_amount, status, failure_reason,
       requested_at, processing_started_at, processed_at
from withdrawal_requests
order by requested_at desc;

select project_id, rater_user_id, rated_user_id, rating_value, is_public, created_at
from ratings
order by created_at desc;

select recipient_user_id, type, status, reference_type, reference_id, created_at, read_at
from notifications
order by created_at desc;

select action, entity_type, entity_id, before_json, after_json, created_at
from audit_logs
order by created_at desc;
```

## 7. API Response Time Và UI Smoke

### 7.1. API Response Time

Chạy 3 lần cho mỗi endpoint thường dùng, ghi nhận thời gian trung bình trong staging/demo:

```powershell
Measure-Command { Invoke-RestMethod http://localhost:8080/health }
```

Endpoints cần đo bằng token phù hợp:

- `GET /api/v1/auth/me`
- `GET /api/v1/projects`
- `GET /api/v1/projects/{projectId}/workspace`
- `GET /api/v1/notifications/unread-count`
- `GET /api/v1/wallets/me`

Kỳ vọng:

- Ordinary demo actions dưới 2 giây trong môi trường demo/staging.
- Không đo PayOS external checkout vào tiêu chí này.

### 7.2. Desktop/Mobile UI Smoke

Desktop:

- 1366 x 768.
- Routes:
  - `/login`
  - `/register`
  - `/student/projects`
  - `/student/offers`
  - `/student/my-projects`
  - `/student/wallet`
  - `/student/ratings`
  - `/sme/projects`
  - `/sme/offers`
  - `/sme/ratings`
  - `/projects/{projectId}/execution`
  - `/admin/verifications`
  - `/admin/withdrawals`

Mobile:

- 390 x 844.
- Kiểm tra drawer menu, header notification bell, tables scroll ngang, buttons không overflow.

Kỳ vọng:

- Không blank page.
- Không text/button tràn khỏi container.
- Notification dropdown không vượt viewport.
- Rating form/table usable.
- Wallet fee hiển thị `5,000 VND`, net amount đúng.

## 8. Biên Bản Test Outcome 1

| Mục | Giá trị |
| --- | --- |
| Ngày test | |
| Tester | |
| Branch/commit | |
| Environment | Local Docker / Staging / Demo |
| Frontend URL | |
| API URL | |
| Payment provider | Mock / PayOS |
| Admin email | |
| SME email | |
| Student email | |
| Project ID | |
| Offer ID | |
| Payment ID | |
| PayOS order code | |
| Webhook status | |
| Final project status | |
| Final escrow status | |
| Gross amount | |
| Platform fee rate | |
| Platform fee amount | |
| Net wallet credit | |
| Withdrawal amount | |
| Withdrawal fee | |
| Withdrawal net amount | |
| Rating Student -> SME pass | |
| Rating SME -> Student pass | |
| Notifications checked | |
| Audit logs checked | |
| Desktop/mobile UI checked | |
| Ordinary API response < 2s | |
| Blockers | |

Không ghi PayOS client id, API key, checksum key, JWT signing key, SMTP password hoặc bank account number raw vào biên bản.

## 9. Known Skip Notes

- PayOS live cần credentials thật và public HTTPS webhook callback. Nếu không có, dùng `PAYMENT_PROVIDER=Mock` cho smoke local.
- SMTP thật cần provider SMTP hợp lệ. Local có thể dùng include-code-in-response theo cấu hình development nếu đang bật.
- Google login cần `GOOGLE_AUTH_CLIENT_ID` và frontend rebuild.
- Refund flow Outcome 1 dùng Admin manual refund qua `/admin/refunds`; không test PayOS refund API.
- Demo seed SME/Student có thể tắt. Khi chỉ seed Admin, tester cần tự đăng ký SME/Student và verify Student trước khi chạy core flow.
