# D4U Completed Feature Test Guide Local

Tài liệu này dùng để test lại toàn bộ feature web D4U đã hoàn thành hiện tại sau khi reset database. Nội dung tập trung vào Phase 1 và Phase 2 core, bao gồm UI flow, API flow, expected result và SQL kiểm tra database.

> Đây là tài liệu local để hỗ trợ test thủ công. Không cần push Git nếu không có yêu cầu riêng.

## 1. Phạm Vi Test

### 1.1. In Scope

Phase 1:

- Register Student/SME bằng email/password.
- Gửi OTP xác minh email tài khoản sau đăng ký.
- Verify email tài khoản trước khi login.
- Login email/password.
- Login Google cho Student/SME.
- Refresh session, logout, lấy thông tin user hiện tại.
- Student tạo/cập nhật profile.
- Student gửi xác thực bằng document upload với file `jpg`, `png`, `pdf`.
- Student xác thực bằng EDU email.
- Admin xem danh sách verification, xem detail, approve/reject.
- SME tạo/cập nhật profile.
- Role redirect và forbidden page.

Phase 2:

- SME dùng AI Project Brief Assistant.
- SME tạo draft project.
- SME sửa draft project.
- SME publish project.
- Kiểm tra Basic plan limit: tối đa 2 project `OPEN` cùng lúc và budget tối đa `5,000,000 VND`.
- Student xem danh sách project đang mở.
- Student xem detail project.
- Student apply project.
- SME xem applications của project.
- SME tạo offer.
- Student reject offer. Student accept offer chỉ test được khi offer ở trạng thái hợp lệ theo backend hiện tại.

### 1.2. Out Of Scope

Không viết test pass/fail cho các feature backend chưa hoàn thành:

- Sketch/Final execution after escrow funding.
- Sketch/Final submissions.
- Wallet/withdrawal.
- Portfolio Builder backend.
- Ratings.
- Paid packages.
- AI Matching paid entitlement.
- Notifications/audit logs nâng cao.

Một số màn frontend shell có thể đã có route UI, nhưng nếu backend chưa có API thì chỉ kiểm tra màn hiển thị trạng thái "API chưa sẵn sàng", không xem là feature hoàn thành.

## 2. Chuẩn Bị Môi Trường

### 2.1. Reset Database Và Chạy Docker

Nếu muốn test lại từ đầu với database sạch:

```powershell
cd D:\Codex
docker compose down -v
docker compose up -d --build
docker compose ps
```

Kỳ vọng:

- `d4u-postgres` có trạng thái healthy.
- `d4u-api` đang chạy.
- `d4u-frontend` đang chạy.

### 2.2. URL Sử Dụng

| Mục | URL |
| --- | --- |
| Frontend Docker | `http://localhost:3000` |
| Login | `http://localhost:3000/login` |
| Register | `http://localhost:3000/register` |
| Verify email | `http://localhost:3000/verify-email` |
| Swagger/API | `http://localhost:8080/swagger` |
| API base trực tiếp | `http://localhost:8080/api/v1` |
| API base qua frontend proxy | `/api/v1` |

### 2.3. PostgreSQL Connection

Dùng pgAdmin/DBeaver:

| Field | Value |
| --- | --- |
| Host | `localhost` |
| Port | `5433` |
| Database | `d4u_mvp` |
| Username | `postgres` |
| Password | Giá trị `POSTGRES_PASSWORD` trong `.env` |

Nếu dùng terminal:

```powershell
docker exec d4u-postgres psql -U postgres -d d4u_mvp -c "select count(*) from users;"
```

### 2.4. Cấu Hình Bắt Buộc Trong `.env`

Cần có các nhóm biến sau:

```env
POSTGRES_DB=d4u_mvp
POSTGRES_USER=postgres
POSTGRES_PASSWORD=...

ADMIN_EMAIL=...
ADMIN_PASSWORD=...
ADMIN_USERNAME=...
ADMIN_FULL_NAME=...

EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USERNAME=...
EMAIL_PASSWORD=...
EMAIL_FROM_EMAIL=...
EMAIL_FROM_NAME=D4U
EMAIL_USE_SSL=true

GOOGLE_AUTH_CLIENT_ID=...
```

Lưu ý:

- `EMAIL_PASSWORD` phải là Gmail App Password, không dùng mật khẩu Gmail thường.
- Nếu thay đổi `.env`, chạy lại API container:

```powershell
docker compose up -d --force-recreate api
```

Nếu thay đổi `GOOGLE_AUTH_CLIENT_ID`, cần rebuild frontend vì Vite bake env vào static bundle:

```powershell
docker compose build frontend
docker compose up -d frontend
```

### 2.5. Kiểm Tra Seed Sau Khi Reset

```sql
select count(*) as users_count from users;
select count(*) as categories_count from design_categories;
select count(*) as plans_count from subscription_plans;

select email, username, role, status, email_verified_at
from users
order by created_at desc;

select code, name, max_active_open_projects, max_project_budget
from subscription_plans
order by monthly_price;
```

Kỳ vọng:

- Có admin bootstrap nếu `.env` có `ADMIN_EMAIL` và `ADMIN_PASSWORD`.
- Có seed `design_categories`.
- Có seed `subscription_plans`.
- Các bảng user test/project/application/offer cũ đã bị xóa nếu đã chạy `docker compose down -v`.

## 3. Test Data Đề Xuất

Nên dùng email thật để nhận OTP:

| Role | Email mẫu | Ghi chú |
| --- | --- | --- |
| Student | `student.d4u.test+001@gmail.com` | Cần truy cập được hộp thư |
| SME | `sme.d4u.test+001@gmail.com` | Cần truy cập được hộp thư |
| Admin | Lấy từ `.env` | Admin bootstrap |

Gợi ý:

- Mỗi lần reset database, dùng email mới hoặc Gmail plus alias để tránh nhầm OTP cũ.
- Với Google login, email Google phải nằm trong OAuth test users nếu app đang ở Testing mode.

## 4. API Quick Reference

### 4.1. Auth

| Method | Endpoint | Role | Mục đích |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Public | Đăng ký Student/SME |
| `POST` | `/api/v1/auth/login` | Public | Login email/password |
| `POST` | `/api/v1/auth/google` | Public | Login bằng Google ID token |
| `POST` | `/api/v1/auth/refresh` | Public | Refresh access token |
| `POST` | `/api/v1/auth/logout` | Public | Logout/revoke refresh token |
| `POST` | `/api/v1/auth/email-verification/request` | Public | Gửi lại OTP xác minh email |
| `POST` | `/api/v1/auth/email-verification/confirm` | Public | Confirm OTP xác minh email |
| `GET` | `/api/v1/auth/me` | Authenticated | Lấy user hiện tại |

### 4.2. Profile Và Verification

| Method | Endpoint | Role | Mục đích |
| --- | --- | --- | --- |
| `GET` | `/api/v1/students/me` | Student | Lấy student profile |
| `PUT` | `/api/v1/students/me` | Student | Tạo/cập nhật student profile |
| `POST` | `/api/v1/students/me/verification` | Student | Upload document xác thực |
| `POST` | `/api/v1/students/me/edu-verification/request` | Student | Gửi mã xác thực EDU email |
| `POST` | `/api/v1/students/me/edu-verification/confirm` | Student | Confirm mã EDU email |
| `GET` | `/api/v1/smes/me` | SME | Lấy SME profile |
| `PUT` | `/api/v1/smes/me` | SME | Tạo/cập nhật SME profile |
| `GET` | `/api/v1/admin/student-verifications` | Admin | List verification |
| `GET` | `/api/v1/admin/student-verifications/{id}` | Admin | Detail verification |
| `GET` | `/api/v1/admin/student-verifications/{id}/document` | Admin | Xem/tải document |
| `POST` | `/api/v1/admin/student-verifications/{id}/approve` | Admin | Approve verification |
| `POST` | `/api/v1/admin/student-verifications/{id}/reject` | Admin | Reject verification |

### 4.3. Project, Application, Offer, AI

| Method | Endpoint | Role | Mục đích |
| --- | --- | --- | --- |
| `GET` | `/api/v1/design-categories` | Authenticated | Lấy danh mục thiết kế |
| `POST` | `/api/v1/ai/project-brief-assistant` | SME | Gợi ý brief bằng AI assistant |
| `GET` | `/api/v1/projects` | Authenticated | List open projects |
| `GET` | `/api/v1/projects/mine` | SME | List project của SME |
| `GET` | `/api/v1/projects/{id}` | Authenticated | Detail project |
| `POST` | `/api/v1/projects` | SME | Tạo draft project |
| `PUT` | `/api/v1/projects/{id}` | SME | Sửa draft project |
| `POST` | `/api/v1/projects/{id}/publish` | SME | Publish project |
| `POST` | `/api/v1/projects/{id}/cancel` | SME | Cancel project |
| `DELETE` | `/api/v1/projects/{id}` | SME | Delete/cancel project |
| `POST` | `/api/v1/projects/{id}/applications` | Student | Apply project |
| `GET` | `/api/v1/projects/{id}/applications` | SME | Xem applications |
| `POST` | `/api/v1/projects/{id}/offers` | SME | Tạo offer |
| `POST` | `/api/v1/offers/{id}/accept` | Student | Accept offer |
| `POST` | `/api/v1/offers/{id}/reject` | Student | Reject offer |

## 5. Phase 1 Test Cases

### TC-01 Register Student Bằng Email/Password

**Mục tiêu**

Đăng ký tài khoản Student mới và tạo OTP xác minh email.

**Role**

Public.

**Điều kiện trước**

- Database sạch.
- SMTP Gmail đã cấu hình đúng.
- Email test nhận được mail.

**Các bước trên UI**

1. Mở `http://localhost:3000/register`.
2. Chọn vai trò `Sinh viên thiết kế`.
3. Nhập email, username, họ tên, mật khẩu.
4. Click `Tạo tài khoản`.

**API liên quan**

- `POST /api/v1/auth/register`
- Backend tự gửi OTP qua SMTP.

**Expected result**

- UI chuyển sang `/verify-email`.
- Có email OTP gửi đến email đã đăng ký.
- User được tạo với role `STUDENT`.
- `email_verified_at` còn `null`.
- Login trước khi verify bị chặn.

**SQL kiểm tra**

```sql
select email, username, role, status, email_verified_at, created_at
from users
where email = 'student.d4u.test+001@gmail.com';

select u.email, v.status, v.requested_at, v.expires_at, v.confirmed_at
from user_email_verifications v
join users u on u.id = v.user_id
where u.email = 'student.d4u.test+001@gmail.com'
order by v.requested_at desc;
```

**Lỗi thường gặp**

- Không nhận OTP: kiểm tra Gmail App Password và log API.
- Register lỗi duplicate email/username: dùng email hoặc username khác.

### TC-02 Verify Email Student Và Login

**Mục tiêu**

Xác minh email tài khoản và login thành công.

**Role**

Public.

**Điều kiện trước**

- TC-01 đã thành công.
- Có OTP trong email.

**Các bước trên UI**

1. Ở `/verify-email`, kiểm tra email đã được điền đúng.
2. Nhập OTP.
3. Click xác minh.
4. Sau khi thành công, quay về `/login`.
5. Login bằng email/password vừa đăng ký.

**API liên quan**

- `POST /api/v1/auth/email-verification/confirm`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

**Expected result**

- OTP đúng thì xác minh thành công.
- `email_verified_at` được set.
- Login trả JWT access token và refresh token.
- User được redirect đến `/student/dashboard` hoặc route Student phù hợp.

**SQL kiểm tra**

```sql
select email, role, status, email_verified_at, last_login_at
from users
where email = 'student.d4u.test+001@gmail.com';

select status, confirmed_at
from user_email_verifications
where email = 'student.d4u.test+001@gmail.com'
order by requested_at desc;
```

**Lỗi thường gặp**

- OTP hết hạn: dùng nút gửi lại mã.
- OTP sai: kiểm tra mã mới nhất trong email.

### TC-03 Register SME Và Verify Email

**Mục tiêu**

Đăng ký SME bằng email/password, verify email và login.

**Role**

Public.

**Điều kiện trước**

- SMTP hoạt động.
- Email SME test nhận được mail.

**Các bước trên UI**

1. Mở `/register`.
2. Chọn vai trò `Doanh nghiệp`.
3. Nhập email, username, họ tên, mật khẩu.
4. Submit form.
5. Mở email lấy OTP.
6. Verify OTP ở `/verify-email`.
7. Login bằng email/password.

**API liên quan**

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/email-verification/confirm`
- `POST /api/v1/auth/login`

**Expected result**

- User role `SME`.
- `email_verified_at` được set sau khi confirm.
- Login thành công và redirect đến `/sme/dashboard`.

**SQL kiểm tra**

```sql
select email, username, role, status, email_verified_at, last_login_at
from users
where email = 'sme.d4u.test+001@gmail.com';
```

### TC-04 Login Bị Chặn Khi Chưa Verify Email

**Mục tiêu**

Đảm bảo tài khoản email/password chưa xác minh không thể login.

**Role**

Public.

**Điều kiện trước**

- Có một user mới đăng ký nhưng chưa confirm OTP.

**Các bước trên UI**

1. Mở `/login`.
2. Nhập email/password của user chưa verify.
3. Click `Đăng nhập`.

**API liên quan**

- `POST /api/v1/auth/login`

**Expected result**

- Login thất bại.
- UI hiển thị thông báo email chưa xác minh và có CTA sang `/verify-email`.
- Không tạo session hợp lệ.

**SQL kiểm tra**

```sql
select email, email_verified_at, last_login_at
from users
where email = 'student.d4u.test+001@gmail.com';
```

### TC-05 Gửi Lại OTP Xác Minh Email

**Mục tiêu**

Kiểm tra user có thể gửi lại OTP khi mã cũ hết hạn hoặc thất lạc.

**Role**

Public.

**Điều kiện trước**

- User đã register nhưng chưa verify.

**Các bước trên UI**

1. Mở `/verify-email`.
2. Nhập email.
3. Click `Gửi lại mã`.
4. Kiểm tra email nhận OTP mới.

**API liên quan**

- `POST /api/v1/auth/email-verification/request`

**Expected result**

- Có OTP mới được gửi.
- Record verification mới hoặc pending code mới được lưu.
- Code cũ không nên dùng để verify nếu backend đã thay thế pending code.

**SQL kiểm tra**

```sql
select email, status, requested_at, expires_at, confirmed_at
from user_email_verifications
where email = 'student.d4u.test+001@gmail.com'
order by requested_at desc;
```

### TC-06 Login Google Cho Student/SME

**Mục tiêu**

Kiểm tra Google login tạo/link user local và xem email Google là đã xác minh.

**Role**

Public.

**Điều kiện trước**

- `GOOGLE_AUTH_CLIENT_ID` đã cấu hình trong `.env`.
- Frontend đã rebuild sau khi cấu hình Google Client ID.
- Google OAuth Authorized JavaScript origins có:
  - `http://localhost:3000`
  - `http://127.0.0.1:3000`
- Nếu app ở Testing mode, Gmail test đã nằm trong Test users.

**Các bước trên UI**

1. Mở `/login`.
2. Chọn vai trò khi dùng Google: `Sinh viên` hoặc `Doanh nghiệp`.
3. Click `Tiếp tục với Google`.
4. Chọn tài khoản Google.

**API liên quan**

- `POST /api/v1/auth/google`

**Expected result**

- Google login thành công.
- Nếu email chưa có trong DB, backend tạo user mới.
- Nếu email đã có, backend link/login user hiện có nếu business rule cho phép.
- `email_verified_at` được set vì Google token đã validate email.
- Redirect theo role.

**SQL kiểm tra**

```sql
select email, username, role, status, email_verified_at, last_login_at
from users
where email = 'google-account@example.com';

select provider, provider_user_id, user_id, created_at
from user_external_logins
order by created_at desc;
```

**Lỗi thường gặp**

- `origin_mismatch`: thiếu origin trong Google Console.
- `Google token does not contain required subject or email claims`: frontend gửi sai credential hoặc backend nhận token không đúng.
- Button không click được: kiểm tra `VITE_GOOGLE_CLIENT_ID`/`GOOGLE_AUTH_CLIENT_ID` đã được bake vào frontend chưa.

### TC-07 Student Tạo/Cập Nhật Profile

**Mục tiêu**

Student tạo hoặc cập nhật thông tin hồ sơ.

**Role**

Student.

**Điều kiện trước**

- Student đã verify email và login.

**Các bước trên UI**

1. Mở `/student/profile`.
2. Nhập trường học, ngành học, năm bắt đầu học, bio.
3. Click lưu.
4. Refresh lại trang.

**API liên quan**

- `GET /api/v1/students/me`
- `PUT /api/v1/students/me`

**Expected result**

- Profile được lưu.
- Refresh vẫn hiển thị dữ liệu mới.
- `onboarding_status` và `verification_status` phản ánh trạng thái hiện tại.

**SQL kiểm tra**

```sql
select sp.school, sp.major, sp.study_start_year, sp.bio,
       sp.onboarding_status, sp.verification_status, sp.created_at, sp.updated_at
from student_profiles sp
join users u on u.id = sp.user_id
where u.email = 'student.d4u.test+001@gmail.com';
```

### TC-08 Student Upload Document Verification

**Mục tiêu**

Student gửi giấy tờ xác thực bằng file `jpg`, `png`, hoặc `pdf`.

**Role**

Student.

**Điều kiện trước**

- Student đã login.
- Student đã có profile.
- Chuẩn bị file hợp lệ: `.jpg`, `.png`, hoặc `.pdf`.

**Các bước trên UI**

1. Mở `/student/verification`.
2. Chọn tab xác thực bằng giấy tờ.
3. Chọn file hợp lệ.
4. Click gửi xác thực.

**API liên quan**

- `POST /api/v1/students/me/verification`
- Request là `multipart/form-data`.

**Expected result**

- Upload thành công.
- Verification mới có status `PENDING` hoặc `UNDER_REVIEW` theo UI mapping.
- Admin thấy request trong danh sách verification.
- File được lưu trong Docker upload volume.

**SQL kiểm tra**

```sql
select sv.id, sv.status, sv.submitted_at, sv.reviewed_at, sv.rejection_reason,
       fm.original_filename, fm.mime_type, fm.file_extension, fm.file_size_bytes, fm.storage_key
from student_verifications sv
join student_profiles sp on sp.id = sv.student_profile_id
join users u on u.id = sp.user_id
join files fm on fm.id = sv.document_file_id
where u.email = 'student.d4u.test+001@gmail.com'
order by sv.submitted_at desc;
```

**Lỗi thường gặp**

- File extension không hợp lệ: chỉ dùng `jpg`, `png`, `pdf`.
- `413 Request Entity Too Large`: file quá lớn hoặc Nginx limit chưa đúng. Dùng file nhỏ hơn để test nhanh.
- Chưa có student profile: tạo profile trước.

### TC-09 Student EDU Email Verification

**Mục tiêu**

Student yêu cầu và xác nhận mã xác thực email EDU.

**Role**

Student.

**Điều kiện trước**

- Student đã login.
- Student đã có profile.

**Các bước trên UI**

1. Mở `/student/verification`.
2. Chọn tab xác thực bằng email EDU.
3. Nhập email trường học.
4. Click gửi mã.
5. Kiểm tra web chỉ hiển thị thông báo đã gửi mã, không hiển thị mã OTP trên trang.
6. Mở hộp thư email EDU để lấy mã xác minh.
7. Nhập mã xác minh.
8. Click xác nhận.

**API liên quan**

- `POST /api/v1/students/me/edu-verification/request`
- `POST /api/v1/students/me/edu-verification/confirm`

**Expected result**

- Request EDU email verification được tạo.
- OTP được gửi qua SMTP đến email EDU.
- Frontend không hiển thị `debugVerificationCode` hoặc mã local development.
- Confirm đúng mã thì record chuyển sang confirmed/verified.
- Trạng thái student verification/profile được cập nhật theo business rule hiện tại.

**SQL kiểm tra**

```sql
select sev.email, sev.status, sev.requested_at, sev.expires_at, sev.confirmed_at
from student_email_verifications sev
join student_profiles sp on sp.id = sev.student_profile_id
join users u on u.id = sp.user_id
where u.email = 'student.d4u.test+001@gmail.com'
order by sev.requested_at desc;

select sp.verification_status, sp.can_withdraw
from student_profiles sp
join users u on u.id = sp.user_id
where u.email = 'student.d4u.test+001@gmail.com';
```

**Lỗi thường gặp**

- Email không đúng domain EDU theo rule backend.
- Mã hết hạn.

### TC-10 Admin Review Student Verification

**Mục tiêu**

Admin xem danh sách verification, xem detail, preview document, approve hoặc reject.

**Role**

Admin.

**Điều kiện trước**

- Có student đã upload verification document.
- Admin bootstrap tồn tại trong DB.

**Các bước trên UI**

1. Login bằng admin từ `.env`.
2. Mở `/admin/verifications`.
3. Lọc status nếu cần.
4. Click vào một request.
5. Kiểm tra thông tin student và preview/tải file document.
6. Chọn `Approve` hoặc `Reject`.
7. Nếu reject, nhập lý do reject.

**API liên quan**

- `GET /api/v1/admin/student-verifications`
- `GET /api/v1/admin/student-verifications/{id}`
- `GET /api/v1/admin/student-verifications/{id}/document`
- `POST /api/v1/admin/student-verifications/{id}/approve`
- `POST /api/v1/admin/student-verifications/{id}/reject`

**Expected result**

- Admin thấy request mới.
- Detail hiển thị đúng thông tin student và file.
- Approve chuyển verification sang `APPROVED`/profile sang verified theo business rule.
- Reject lưu lý do từ chối.

**SQL kiểm tra**

```sql
select sv.id, sv.status, sv.reviewed_by_admin_id, sv.rejection_reason,
       sv.submitted_at, sv.reviewed_at,
       u.email as student_email
from student_verifications sv
join student_profiles sp on sp.id = sv.student_profile_id
join users u on u.id = sp.user_id
order by sv.submitted_at desc;

select u.email, sp.verification_status, sp.can_withdraw
from student_profiles sp
join users u on u.id = sp.user_id
where u.email = 'student.d4u.test+001@gmail.com';
```

### TC-11 SME Tạo/Cập Nhật Profile

**Mục tiêu**

SME tạo hoặc cập nhật company profile.

**Role**

SME.

**Điều kiện trước**

- SME đã verify email và login.

**Các bước trên UI**

1. Mở `/sme/profile`.
2. Nhập company name, representative name, phone number, business field.
3. Click lưu.
4. Refresh lại trang.

**API liên quan**

- `GET /api/v1/smes/me`
- `PUT /api/v1/smes/me`

**Expected result**

- SME profile được lưu.
- Refresh vẫn thấy dữ liệu.
- Active open project count ban đầu là 0.

**SQL kiểm tra**

```sql
select sme.company_name, sme.representative_name, sme.phone_number,
       sme.business_field, sme.onboarding_status, sme.active_open_project_count
from sme_profiles sme
join users u on u.id = sme.user_id
where u.email = 'sme.d4u.test+001@gmail.com';
```

### TC-12 Logout, Session Và Forbidden

**Mục tiêu**

Kiểm tra session, logout và phân quyền route.

**Role**

Student, SME, Admin.

**Điều kiện trước**

- Có ít nhất một tài khoản Student, SME, Admin.

**Các bước trên UI**

1. Login Student.
2. Truy cập `/sme/projects`.
3. Truy cập `/admin/verifications`.
4. Logout.
5. Mở lại `/student/profile`.

**API liên quan**

- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

**Expected result**

- Student không truy cập được SME/Admin route.
- UI chuyển sang forbidden hoặc redirect phù hợp.
- Sau logout, route protected yêu cầu login lại.

## 6. Phase 2 Test Cases

### TC-13 SME Dùng AI Project Brief Assistant

**Mục tiêu**

SME nhập ý tưởng thô và nhận gợi ý brief để prefill project form.

**Role**

SME.

**Điều kiện trước**

- SME đã login.
- SME đã có profile.

**Các bước trên UI**

1. Mở `/sme/projects/new` hoặc `/sme/ai-brief`.
2. Nhập raw idea, business field, target audience, preferred style, budget, deadline.
3. Click tạo gợi ý.
4. Review kết quả AI.
5. Apply gợi ý vào form nếu UI hỗ trợ.

**API liên quan**

- `POST /api/v1/ai/project-brief-assistant`

**Expected result**

- API trả suggested title, brief, usage purpose, deliverables, category hint, deadline notes, warnings.
- UI chỉ prefill/gợi ý, không auto publish.
- SME vẫn phải tự review và submit project.

**Lỗi thường gặp**

- Ý tưởng quá ngắn: backend validation có thể reject.
- AI provider chưa cấu hình thật: kiểm tra response provider và log API.

### TC-14 SME Tạo Draft Project

**Mục tiêu**

SME tạo project ở trạng thái draft.

**Role**

SME.

**Điều kiện trước**

- SME đã login.
- SME đã có profile.
- Có seed design categories.

**Các bước trên UI**

1. Mở `/sme/projects/new`.
2. Chọn design category.
3. Nhập title, brief, usage purpose.
4. Chọn project type.
5. Nhập budget amount, currency `VND`.
6. Chọn total deadline, sketch deadline, final deadline.
7. Nhập max revision rounds.
8. Chọn confidentiality và portfolio permission.
9. Click lưu draft.

**API liên quan**

- `GET /api/v1/design-categories`
- `POST /api/v1/projects`

**Expected result**

- Project được tạo với status `DRAFT`.
- Project xuất hiện trong `/sme/projects`.
- Chưa xuất hiện trong danh sách open projects của Student.

**SQL kiểm tra**

```sql
select p.id, p.title, p.status, p.budget_amount, p.currency,
       p.published_at, p.created_at, p.updated_at,
       dc.name as category_name
from projects p
join design_categories dc on dc.id = p.design_category_id
order by p.created_at desc;
```

### TC-15 SME Sửa Draft Project

**Mục tiêu**

SME cập nhật project draft trước khi publish.

**Role**

SME.

**Điều kiện trước**

- Có project status `DRAFT` thuộc SME.

**Các bước trên UI**

1. Mở `/sme/projects`.
2. Chọn draft project.
3. Click edit.
4. Cập nhật title/brief/budget/deadline.
5. Lưu.

**API liên quan**

- `GET /api/v1/projects/mine`
- `GET /api/v1/projects/{id}`
- `PUT /api/v1/projects/{id}`

**Expected result**

- Project cập nhật thành công.
- `updated_at` thay đổi.
- Status vẫn là `DRAFT`.

**SQL kiểm tra**

```sql
select title, brief, status, budget_amount, updated_at
from projects
where id = 'PROJECT_ID';
```

### TC-16 SME Publish Project

**Mục tiêu**

SME publish draft project thành project open.

**Role**

SME.

**Điều kiện trước**

- Có project status `DRAFT`.
- Budget không vượt limit plan hiện tại.
- SME chưa vượt số project `OPEN` tối đa.

**Các bước trên UI**

1. Mở detail hoặc list project của SME.
2. Click publish.
3. Xác nhận nếu có modal confirm.

**API liên quan**

- `POST /api/v1/projects/{id}/publish`

**Expected result**

- Status chuyển sang `OPEN`.
- `published_at` được set.
- Có status history mới.
- Student thấy project ở `/student/projects`.

**SQL kiểm tra**

```sql
select id, title, status, published_at
from projects
where id = 'PROJECT_ID';

select project_id, from_status, to_status, created_at, change_reason
from project_status_histories
where project_id = 'PROJECT_ID'
order by created_at desc;
```

### TC-17 Kiểm Tra Basic Plan Limit

**Mục tiêu**

Đảm bảo Basic plan giới hạn publish project.

**Role**

SME.

**Điều kiện trước**

- SME dùng Basic subscription mặc định.
- Có thể tạo nhiều draft project.

**Các bước trên UI**

1. Tạo và publish project 1 với budget <= `5,000,000 VND`.
2. Tạo và publish project 2 với budget <= `5,000,000 VND`.
3. Tạo draft project 3 với budget <= `5,000,000 VND`.
4. Publish project 3.
5. Tạo draft project khác với budget > `5,000,000 VND`.
6. Publish project budget vượt limit.

**API liên quan**

- `POST /api/v1/projects`
- `POST /api/v1/projects/{id}/publish`

**Expected result**

- Project 1 và 2 publish thành công.
- Project 3 bị chặn vì vượt `max_active_open_projects = 2`.
- Project budget > `5,000,000 VND` bị chặn.
- Draft project vẫn có thể tạo, limit chỉ kiểm tra khi publish.

**SQL kiểm tra**

```sql
select sp.code, sp.name, sp.max_active_open_projects, sp.max_project_budget
from subscription_plans sp
order by sp.monthly_price;

select u.email, count(*) as open_project_count
from projects p
join sme_profiles sme on sme.id = p.sme_profile_id
join users u on u.id = sme.user_id
where u.email = 'sme.d4u.test+001@gmail.com'
  and p.status = 'OPEN'
group by u.email;

select title, status, budget_amount, published_at
from projects
order by created_at desc;
```

**Lỗi thường gặp**

- Nếu project cũ còn `OPEN`, limit có thể bị chặn sớm. Reset DB hoặc cancel project cũ.

### TC-18 Student Xem Danh Sách Open Projects

**Mục tiêu**

Student xem marketplace chỉ gồm project `OPEN`.

**Role**

Student.

**Điều kiện trước**

- Có ít nhất một project `OPEN`.
- Student đã login.

**Các bước trên UI**

1. Mở `/student/projects`.
2. Tìm project vừa publish.
3. Dùng search/filter nếu UI có.

**API liên quan**

- `GET /api/v1/projects`

**Expected result**

- Chỉ hiển thị project `OPEN`.
- Không hiển thị draft/cancelled project.
- Card hiển thị title, category, budget, deadline, brief preview.

**SQL kiểm tra**

```sql
select title, status, budget_amount, published_at
from projects
order by created_at desc;
```

### TC-19 Student Xem Detail Project

**Mục tiêu**

Student xem chi tiết project trước khi apply.

**Role**

Student.

**Điều kiện trước**

- Có project `OPEN`.

**Các bước trên UI**

1. Mở `/student/projects`.
2. Click project card.
3. Kiểm tra detail.

**API liên quan**

- `GET /api/v1/projects/{id}`

**Expected result**

- Detail hiển thị đúng title, brief, usage purpose, category, budget, deadline, revision, confidentiality, portfolio permission.
- Có CTA apply nếu Student đủ điều kiện.

### TC-20 Student Apply Project

**Mục tiêu**

Student gửi application cho project `OPEN`.

**Role**

Student.

**Điều kiện trước**

- Student đã login.
- Student đã có profile.
- Project đang `OPEN`.
- Student chưa apply project đó trước đó.

**Các bước trên UI**

1. Mở project detail.
2. Click apply.
3. Nhập proposed price.
4. Nhập estimated duration days.
5. Nhập cover letter.
6. Submit.

**API liên quan**

- `POST /api/v1/projects/{id}/applications`

**Expected result**

- Application được tạo.
- Student không thể apply trùng cùng một project.
- SME thấy application ở màn applications của project.

**SQL kiểm tra**

```sql
select pa.id, pa.project_id, pa.student_profile_id, pa.proposed_price,
       pa.estimated_duration_days, pa.status, pa.submitted_at
from project_applications pa
join projects p on p.id = pa.project_id
where p.id = 'PROJECT_ID'
order by pa.submitted_at desc;
```

**Lỗi thường gặp**

- Apply bị chặn nếu project không `OPEN`.
- Apply bị chặn nếu Student chưa có profile hoặc đã apply rồi.

### TC-21 SME Xem Applications

**Mục tiêu**

SME xem danh sách application của project mình sở hữu.

**Role**

SME.

**Điều kiện trước**

- Có project thuộc SME.
- Có Student đã apply project.

**Các bước trên UI**

1. Login SME.
2. Mở `/sme/projects`.
3. Chọn project.
4. Mở `/sme/projects/{projectId}/applications`.
5. Kiểm tra danh sách application.

**API liên quan**

- `GET /api/v1/projects/{id}/applications`

**Expected result**

- SME thấy applications của project mình.
- SME không xem được applications của project không thuộc mình.
- Mỗi application hiển thị student, proposed price, duration, cover letter, status.

### TC-22 SME Tạo Offer Từ Application

**Mục tiêu**

SME chọn Student và tạo offer.

**Role**

SME.

**Điều kiện trước**

- Có application cho project của SME.

**Các bước trên UI**

1. Mở applications của project.
2. Chọn một application.
3. Click tạo offer.
4. Nhập offered amount.
5. Nhập expires at nếu cần.
6. Submit.

**API liên quan**

- `POST /api/v1/projects/{id}/offers`

**Expected result**

- Offer được tạo.
- Offer có status ban đầu `WAITING_ACCEPTANCE`.
- SME chưa có link PayOS ở bước này; cần chờ Student accept offer.
- Application liên quan được tham chiếu trong offer nếu tạo từ application.

**SQL kiểm tra**

```sql
select po.id, po.project_id, po.student_profile_id, po.application_id,
       po.status, po.offered_amount, po.expires_at,
       po.accepted_at, po.rejected_at, po.created_at
from project_offers po
where po.project_id = 'PROJECT_ID'
order by po.created_at desc;
```

### TC-23 Student Reject Offer

**Mục tiêu**

Student từ chối offer được gửi cho mình.

**Role**

Student.

**Điều kiện trước**

- Có offer cho Student.
- Student login đúng tài khoản nhận offer.

**Các bước trên UI**

1. Mở route offer nếu frontend có hiển thị offer hiện tại.
2. Chọn reject offer.
3. Xác nhận.

**API liên quan**

- `POST /api/v1/offers/{id}/reject`

**Expected result**

- Offer chuyển sang `REJECTED`.
- `rejected_at` được set.

**SQL kiểm tra**

```sql
select id, status, accepted_at, rejected_at, revoked_at
from project_offers
where id = 'OFFER_ID';
```

### TC-24 Student Accept Offer

**Mục tiêu**

Kiểm tra Student accept offer trước khi SME thanh toán escrow.

**Role**

Student.

**Điều kiện trước**

- Có offer cho Student.
- Offer phải ở trạng thái `WAITING_ACCEPTANCE`.

**Các bước trên UI**

1. Mở offer của Student.
2. Click accept.
3. Xác nhận.

**API liên quan**

- `POST /api/v1/offers/{id}/accept`

**Expected result**

- Offer chuyển sang `ACCEPTED` và `accepted_at` được set.
- Project vẫn chưa chuyển `IN_PROGRESS`; SME cần thanh toán escrow qua PayOS.

**SQL kiểm tra**

```sql
select id, status, accepted_at, rejected_at, expires_at
from project_offers
where id = 'OFFER_ID';
```

### TC-25 SME Thanh Toán Escrow Sau Khi Student Accept

**Mục tiêu**

SME chỉ tạo PayOS payment link sau khi Student đã accept offer.

**Role**

SME.

**Điều kiện trước**

- Offer đang ở trạng thái `ACCEPTED`.
- Project thuộc SME đang đăng nhập.

**Các bước trên UI**

1. Mở `/sme/offers`.
2. Chọn offer đã được Student chấp nhận.
3. Click mở thanh toán.
4. Thanh toán bằng PayOS/VietQR.
5. Chờ PayOS webhook xác nhận.

**API liên quan**

- `POST /api/v1/offers/{id}/payment`
- `POST /api/v1/payments/payos/webhook`

**Expected result**

- Trước khi Student accept, SME không mở được payment.
- Sau khi Student accept, SME nhận được PayOS checkout link/QR.
- Webhook success set `payments.status = SUCCESS`.
- Escrow chuyển `FUNDED`.
- Project chuyển `IN_PROGRESS`.

**SQL kiểm tra**

```sql
select po.status as offer_status, p.status as project_status,
       e.status as escrow_status, pay.status as payment_status
from project_offers po
join projects p on p.id = po.project_id
left join escrows e on e.project_id = p.id and e.student_profile_id = po.student_profile_id
left join payments pay on pay.escrow_id = e.id
where po.id = 'OFFER_ID'
order by pay.created_at desc;
```

## 7. UI Shell Chưa Có API Hoàn Chỉnh

Các route sau có thể tồn tại ở frontend để chuẩn bị full MVP shell, nhưng không xem là completed backend feature nếu API chưa sẵn sàng:

Student:

- `/student/applications`
- `/student/offers`
- `/student/my-projects`
- `/student/portfolio`
- `/student/wallet`
- `/student/ratings`

SME:

- `/sme/applications`
- `/sme/offers`
- `/sme/ai-matching`
- `/sme/billing`
- `/sme/ratings`

Admin:

- `/admin/portfolio`
- `/admin/withdrawals`
- `/admin/users`
- `/admin/audit-logs`

Shared:

- `/projects/{id}/execution`
- `/projects/{id}/submissions`
- `/projects/{id}/rating`

Expected result cho các route này:

- Không crash.
- Không hiển thị mock business data.
- Nếu API chưa có, hiển thị empty/backend-gap state rõ ràng.

## 8. Database Checkpoint Tổng Hợp

### 8.1. Users

```sql
select id, email, username, full_name, role, status,
       email_verified_at, last_login_at, created_at
from users
order by created_at desc;
```

### 8.2. Account Email Verification

```sql
select id, user_id, email, status, requested_at, expires_at, confirmed_at
from user_email_verifications
order by requested_at desc;
```

### 8.3. Student Profiles

```sql
select u.email, sp.id, sp.school, sp.major, sp.study_start_year,
       sp.onboarding_status, sp.verification_status,
       sp.average_rating, sp.completed_projects_count, sp.can_withdraw,
       sp.created_at, sp.updated_at
from student_profiles sp
join users u on u.id = sp.user_id
order by sp.created_at desc;
```

### 8.4. SME Profiles

```sql
select u.email, sme.id, sme.company_name, sme.representative_name,
       sme.phone_number, sme.business_field, sme.onboarding_status,
       sme.average_rating, sme.completed_projects_count,
       sme.active_open_project_count, sme.created_at, sme.updated_at
from sme_profiles sme
join users u on u.id = sme.user_id
order by sme.created_at desc;
```

### 8.5. Student Document Verification

```sql
select u.email, sv.id, sv.status, sv.submitted_at, sv.reviewed_at,
       sv.reviewed_by_admin_id, sv.rejection_reason,
       fm.original_filename, fm.mime_type, fm.file_extension, fm.file_size_bytes, fm.storage_key
from student_verifications sv
join student_profiles sp on sp.id = sv.student_profile_id
join users u on u.id = sp.user_id
join files fm on fm.id = sv.document_file_id
order by sv.submitted_at desc;
```

### 8.6. Student EDU Email Verification

```sql
select u.email as account_email, sev.email as edu_email,
       sev.status, sev.requested_at, sev.expires_at, sev.confirmed_at
from student_email_verifications sev
join student_profiles sp on sp.id = sev.student_profile_id
join users u on u.id = sp.user_id
order by sev.requested_at desc;
```

### 8.7. Design Categories

```sql
select id, name, description, is_active
from design_categories
order by name;
```

### 8.8. Subscription Plans

```sql
select id, code, name, monthly_price,
       platform_fee_rate, max_active_open_projects,
       max_project_budget, is_active
from subscription_plans
order by monthly_price;
```

### 8.9. SME Subscriptions

```sql
select u.email, sp.code as plan_code, ss.status,
       ss.started_at, ss.current_period_end, ss.cancelled_at
from sme_subscriptions ss
join sme_profiles sme on sme.id = ss.sme_profile_id
join users u on u.id = sme.user_id
join subscription_plans sp on sp.id = ss.subscription_plan_id
order by ss.started_at desc;
```

### 8.10. Projects

```sql
select p.id, u.email as sme_email, p.title, p.status,
       dc.name as category_name,
       p.project_type, p.budget_amount, p.currency,
       p.total_deadline_at, p.sketch_deadline_at, p.final_deadline_at,
       p.max_revision_rounds, p.is_confidential, p.allow_student_portfolio,
       p.published_at, p.created_at, p.updated_at
from projects p
join sme_profiles sme on sme.id = p.sme_profile_id
join users u on u.id = sme.user_id
join design_categories dc on dc.id = p.design_category_id
order by p.created_at desc;
```

### 8.11. Project Applications

```sql
select pa.id, p.title, u.email as student_email,
       pa.proposed_price, pa.estimated_duration_days,
       pa.status, pa.submitted_at, pa.updated_at
from project_applications pa
join projects p on p.id = pa.project_id
join student_profiles sp on sp.id = pa.student_profile_id
join users u on u.id = sp.user_id
order by pa.submitted_at desc;
```

### 8.12. Project Offers

```sql
select po.id, p.title, u.email as student_email,
       po.application_id, po.status, po.offered_amount,
       po.expires_at, po.accepted_at, po.rejected_at, po.revoked_at,
       po.created_at
from project_offers po
join projects p on p.id = po.project_id
join student_profiles sp on sp.id = po.student_profile_id
join users u on u.id = sp.user_id
order by po.created_at desc;
```

### 8.13. Project Status Histories

```sql
select p.title, h.from_status, h.to_status, h.change_reason,
       h.changed_by_user_id, h.created_at
from project_status_histories h
join projects p on p.id = h.project_id
order by h.created_at desc;
```

## 9. Troubleshooting

### 9.1. pgAdmin/DBeaver Không Thấy Data

Kiểm tra đúng connection:

- Host phải là `localhost`.
- Port phải là `5433`, không phải `5432` nếu compose map PostgreSQL ra `5433`.
- Database phải là `d4u_mvp`.
- Schema thường là `public`.
- Sau khi mở table, bấm refresh/reload data.

Kiểm tra nhanh bằng terminal:

```powershell
docker exec d4u-postgres psql -U postgres -d d4u_mvp -c "select email, role from users;"
```

### 9.2. Register Thành Công Nhưng Không Nhận OTP

Kiểm tra:

- `.env` có đủ `EMAIL_SMTP_HOST`, `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `EMAIL_FROM_EMAIL`.
- `EMAIL_PASSWORD` là Gmail App Password.
- API container đã recreate sau khi sửa `.env`.

Lệnh xem log:

```powershell
docker compose logs -f api
```

### 9.3. Google Login Báo `origin_mismatch`

Trong Google Cloud Console, thêm Authorized JavaScript origins:

```text
http://localhost:3000
http://127.0.0.1:3000
```

Sau khi sửa Google Client ID trong `.env`, rebuild frontend:

```powershell
docker compose build frontend
docker compose up -d frontend
```

### 9.4. Upload Verification Báo `413 Request Entity Too Large`

Nguyên nhân thường là file quá lớn hoặc Nginx giới hạn body size.

Cách test nhanh:

- Dùng file `.jpg`, `.png`, `.pdf` nhỏ hơn 5MB.
- Nếu vẫn lỗi, kiểm tra config Nginx frontend và logs:

```powershell
docker compose logs -f frontend
```

### 9.5. Bị `401 Unauthorized`

Kiểm tra:

- Đã login chưa.
- Access token còn hạn không.
- Frontend có refresh token không.
- API request có gửi `Authorization: Bearer ...` không.

### 9.6. Bị `403 Forbidden`

Kiểm tra:

- Đúng role chưa.
- Student không thể gọi SME/Admin API.
- SME không thể gọi Admin API.
- Admin không đi theo Student/SME route nghiệp vụ.

## 10. Checklist Kết Thúc Test

Phase 1:

- [ ] Student register email/password thành công.
- [ ] Student nhận OTP và verify email thành công.
- [ ] Student login thành công sau verify.
- [ ] Student chưa verify email bị chặn login.
- [ ] SME register, verify email, login thành công.
- [ ] Google login Student/SME hoạt động hoặc được ghi chú skip do Google Console chưa cấu hình.
- [ ] Student profile lưu được.
- [ ] Student document verification upload được file `jpg/png/pdf`.
- [ ] File extension khác bị chặn.
- [ ] Student EDU email verification request/confirm hoạt động.
- [ ] Admin xem list/detail document verification.
- [ ] Admin approve/reject verification hoạt động.
- [ ] SME profile lưu được.
- [ ] Logout và role forbidden hoạt động.

Phase 2:

- [ ] SME dùng AI Project Brief Assistant được.
- [ ] SME tạo draft project được.
- [ ] SME sửa draft project được.
- [ ] SME publish project được.
- [ ] Basic plan chặn project thứ 3 đang `OPEN`.
- [ ] Basic plan chặn budget > `5,000,000 VND`.
- [ ] Student xem open project list được.
- [ ] Student xem project detail được.
- [ ] Student apply project được.
- [ ] Student không apply trùng cùng một project.
- [ ] SME xem applications được.
- [ ] SME tạo offer được.
- [ ] Student reject offer được.
- [ ] Student accept offer được khi offer `WAITING_ACCEPTANCE`.
- [ ] SME thanh toán escrow được sau khi offer `ACCEPTED`.

Backend-gap/UI shell:

- [ ] Các route shell chưa có API không crash.
- [ ] Không hiển thị mock business data gây hiểu nhầm là feature đã hoàn thành.
- [ ] Có empty/backend-gap state rõ ràng.
