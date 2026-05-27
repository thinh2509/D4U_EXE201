# D4U Phase 1 - Hướng Dẫn UX/UI Và API Cho Frontend

Tài liệu này mô tả các màn hình, trạng thái giao diện, luồng người dùng và API cần call cho Phase 1 của D4U.

Phase 1 tập trung vào:

- Đăng ký, đăng nhập, refresh token, logout.
- Phân quyền theo role: `STUDENT`, `SME`, `ADMIN`.
- Student tạo profile và gửi xác thực sinh viên.
- SME tạo profile doanh nghiệp.
- Admin xem, duyệt, từ chối yêu cầu xác thực Student.

## 1. Thông Tin Chung

Base URL local khi chạy Docker:

```text
http://localhost:8080
```

Swagger:

```text
http://localhost:8080/swagger
```

Header cho API cần đăng nhập:

```text
Authorization: Bearer <accessToken>
```

Role hiện có:

- `STUDENT`
- `SME`
- `ADMIN`

Account status:

- `PENDING`
- `ACTIVE`
- `SUSPENDED`
- `BANNED`
- `DELETED`

Frontend cần chặn hoặc hiển thị cảnh báo nếu user bị `SUSPENDED`, `BANNED`, `DELETED`.

## 2. UX/UI Tổng Quan Cần Có

Frontend Phase 1 nên có các nhóm màn hình sau:

| Nhóm | Màn hình | Dành cho |
| --- | --- | --- |
| Auth | Register | Guest |
| Auth | Login | Guest |
| Auth | Logout handling | Authenticated user |
| Auth | Session expired / refresh token failed | Authenticated user |
| Student | Student dashboard/onboarding | Student |
| Student | Student profile form | Student |
| Student | Student verification form | Student |
| Student | Verification status view | Student |
| SME | SME dashboard/onboarding | SME |
| SME | SME profile form | SME |
| Admin | Admin verification list | Admin |
| Admin | Admin verification detail | Admin |
| Admin | Approve/reject confirmation | Admin |
| Shared | Unauthorized / forbidden page | All roles |
| Shared | Loading, empty, error states | All roles |

## 3. Luồng Điều Hướng Theo Role

Sau khi login thành công, frontend đọc `response.user.role`.

Nếu role là `STUDENT`:

```text
Login thành công
-> GET /api/v1/students/me
-> Nếu 404: chuyển đến màn Student Profile Form
-> Nếu có profile: kiểm tra verificationStatus
-> Nếu chưa PENDING/APPROVED: hiển thị form gửi xác thực
-> Nếu PENDING: hiển thị trạng thái đang chờ Admin duyệt
-> Nếu APPROVED: hiển thị trạng thái đã xác thực
-> Nếu REJECTED: hiển thị trạng thái bị từ chối và cho gửi lại
```

Nếu role là `SME`:

```text
Login thành công
-> GET /api/v1/smes/me
-> Nếu 404: chuyển đến màn SME Profile Form
-> Nếu có profile: vào SME dashboard Phase 1
```

Nếu role là `ADMIN`:

```text
Login thành công
-> Chuyển đến Admin Verification List
-> GET /api/v1/admin/student-verifications?status=PENDING
```

## 4. Auth UX/UI

### 4.1. Register Screen

Mục tiêu:

- Cho Guest tạo tài khoản Student hoặc SME.
- Không cho tự đăng ký Admin.

UI cần có:

- Email input.
- Username input.
- Password input.
- Full name input.
- Role selector:
  - Student Designer
  - SME
- Submit button.
- Link sang Login.

Validation phía frontend nên có:

- Email bắt buộc, đúng format email, tối đa 255 ký tự.
- Username bắt buộc, 3-100 ký tự, chỉ gồm chữ, số, dấu `.`, `_`, `-`.
- Password bắt buộc, 8-128 ký tự, có ít nhất 1 chữ và 1 số.
- Full name bắt buộc, tối đa 255 ký tự.
- Role chỉ được là `STUDENT` hoặc `SME`.

API:

```http
POST /api/v1/auth/register
```

Body Student:

```json
{
  "email": "student1@example.com",
  "username": "student1",
  "password": "Pass12345",
  "fullName": "Student One",
  "role": "STUDENT"
}
```

Body SME:

```json
{
  "email": "sme1@example.com",
  "username": "sme1",
  "password": "Pass12345",
  "fullName": "SME One",
  "role": "SME"
}
```

Response thành công:

```json
{
  "id": "guid",
  "email": "student1@example.com",
  "username": "student1",
  "fullName": "Student One",
  "role": "STUDENT",
  "status": "PENDING",
  "createdAt": "2026-05-19T00:00:00Z"
}
```

UX sau khi register:

- Có thể chuyển user sang màn Login.
- Hoặc hiển thị thông báo: "Đăng ký thành công, vui lòng đăng nhập."

Hiện tại API register không trả token, nên frontend cần gọi login sau register.

### 4.2. Login Screen

UI cần có:

- Email input.
- Password input.
- Submit button.
- Link sang Register.
- Error message khi sai email/password.

API:

```http
POST /api/v1/auth/login
```

Body:

```json
{
  "email": "student1@example.com",
  "password": "Pass12345"
}
```

Response thành công:

```json
{
  "accessToken": "jwt",
  "accessTokenExpiresAt": "2026-05-19T00:00:00Z",
  "refreshToken": "refresh-token",
  "refreshTokenExpiresAt": "2026-06-02T00:00:00Z",
  "user": {
    "id": "guid",
    "email": "student1@example.com",
    "username": "student1",
    "fullName": "Student One",
    "role": "STUDENT",
    "status": "PENDING",
    "createdAt": "2026-05-19T00:00:00Z"
  }
}
```

Frontend cần lưu:

- `accessToken`
- `refreshToken`
- `user`

Khuyến nghị UX:

- Trong MVP có thể lưu token ở localStorage hoặc sessionStorage.
- Khi production hơn, nên cân nhắc HttpOnly cookie.

### 4.3. Refresh Token

Khi API trả `401 Unauthorized` do access token hết hạn, frontend thử gọi refresh token.

API:

```http
POST /api/v1/auth/refresh
```

Body:

```json
{
  "refreshToken": "<refreshToken>"
}
```

Nếu refresh thành công:

- Cập nhật token mới.
- Retry request cũ.

Nếu refresh thất bại:

- Xóa token local.
- Chuyển về Login.
- Hiển thị: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại."

### 4.4. Logout

API:

```http
POST /api/v1/auth/logout
```

Body:

```json
{
  "refreshToken": "<refreshToken>"
}
```

UX:

- Gọi logout.
- Dù API thành công hay thất bại, frontend vẫn nên xóa token local.
- Chuyển về Login.

### 4.5. Current User

API:

```http
GET /api/v1/auth/me
```

UX:

- Dùng khi app reload để lấy lại thông tin user.
- Nếu `401`, chuyển về Login.

## 5. Student UX/UI

### 5.1. Student Dashboard Phase 1

Màn này nên hiển thị:

- Thông tin account cơ bản.
- Trạng thái profile:
  - Chưa tạo profile.
  - Đã tạo profile.
- Trạng thái xác thực:
  - Chưa gửi xác thực.
  - Đang chờ duyệt.
  - Đã xác thực.
  - Bị từ chối.

CTA chính:

- "Cập nhật hồ sơ sinh viên"
- "Gửi xác thực sinh viên"
- "Gửi lại xác thực" nếu bị reject.

### 5.2. Get Student Profile

API:

```http
GET /api/v1/students/me
```

Response nếu chưa có profile:

```text
404 Not Found
```

Response nếu có profile:

```json
{
  "id": "guid",
  "userId": "guid",
  "school": "FPT University",
  "major": "Graphic Design",
  "studyStartYear": 2022,
  "bio": "Student designer",
  "onboardingStatus": "COMPLETED",
  "verificationStatus": "PENDING",
  "averageRating": 0,
  "completedProjectsCount": 0,
  "canWithdraw": false,
  "createdAt": "2026-05-19T00:00:00Z",
  "updatedAt": "2026-05-19T00:00:00Z"
}
```

Frontend behavior:

- Nếu `404`, hiển thị form tạo profile.
- Nếu `200`, hiển thị profile và verification status.

### 5.3. Student Profile Form

UI cần có:

- School input.
- Major input.
- Study start year input/select.
- Bio textarea.
- Save button.

Validation phía frontend:

- School bắt buộc, tối đa 255 ký tự.
- Major bắt buộc, tối đa 255 ký tự.
- Study start year từ 1900 đến năm hiện tại + 1.
- Bio tối đa 1000 ký tự.

API:

```http
PUT /api/v1/students/me
```

Body:

```json
{
  "school": "FPT University",
  "major": "Graphic Design",
  "studyStartYear": 2022,
  "bio": "Student designer"
}
```

UX sau khi save:

- Hiển thị toast: "Cập nhật hồ sơ thành công."
- Refresh profile.
- Cho phép gửi xác thực nếu chưa approved/pending.

### 5.4. Student Verification Form

Lưu ý quan trọng:

Phase 1 backend chỉ nhận metadata file, chưa xử lý upload binary file trực tiếp. Frontend có thể làm UI chọn file để lấy thông tin metadata, nhưng file thật cần được upload qua cơ chế storage riêng ở phase sau hoặc mock local trong MVP.

UI cần có:

- File picker.
- Chỉ cho chọn:
  - `.jpg`
  - `.png`
  - `.pdf`
- Hiển thị tên file, MIME type, size.
- Submit button.
- Warning nếu file sai định dạng hoặc quá lớn.

Validation:

- Extension chỉ được `jpg`, `png`, `pdf`.
- File size từ 1 byte đến 20MB.
- Original filename bắt buộc, tối đa 255 ký tự.
- MIME type bắt buộc, tối đa 100 ký tự.

API:

```http
POST /api/v1/students/me/verification
```

Body ví dụ PDF:

```json
{
  "storageProvider": "local",
  "bucket": "verification",
  "storageKey": "students/student1/card.pdf",
  "originalFilename": "student-card.pdf",
  "mimeType": "application/pdf",
  "fileExtension": "pdf",
  "fileSizeBytes": 12345,
  "checksum": "abc123"
}
```

Body ví dụ PNG:

```json
{
  "storageProvider": "local",
  "bucket": "verification",
  "storageKey": "students/student1/card.png",
  "originalFilename": "student-card.png",
  "mimeType": "image/png",
  "fileExtension": "png",
  "fileSizeBytes": 12345,
  "checksum": "abc123"
}
```

Response:

```json
{
  "id": "guid",
  "studentProfileId": "guid",
  "documentFileId": "guid",
  "status": "PENDING",
  "reviewedByAdminId": null,
  "rejectionReason": null,
  "submittedAt": "2026-05-19T00:00:00Z",
  "reviewedAt": null
}
```

UX sau khi submit:

- Hiển thị trạng thái "Đang chờ Admin duyệt".
- Disable nút gửi lại khi đang có verification `PENDING`.
- Nếu backend trả lỗi pending duplicate, hiển thị: "Bạn đã có yêu cầu xác thực đang chờ duyệt."

## 6. SME UX/UI

### 6.1. SME Dashboard Phase 1

Màn này nên hiển thị:

- Thông tin account SME.
- Trạng thái profile:
  - Chưa tạo profile.
  - Đã tạo profile.
- CTA: "Cập nhật hồ sơ doanh nghiệp."

Phase 2 mới bắt đầu phần tạo project.

### 6.2. Get SME Profile

API:

```http
GET /api/v1/smes/me
```

Nếu chưa có profile:

```text
404 Not Found
```

Nếu có profile:

```json
{
  "id": "guid",
  "userId": "guid",
  "companyName": "ABC Company",
  "representativeName": "Nguyen Van A",
  "phoneNumber": "0909123456",
  "businessField": "Food and Beverage",
  "logoFileId": null,
  "onboardingStatus": "COMPLETED",
  "averageRating": 0,
  "completedProjectsCount": 0,
  "activeOpenProjectCount": 0,
  "createdAt": "2026-05-19T00:00:00Z",
  "updatedAt": "2026-05-19T00:00:00Z"
}
```

### 6.3. SME Profile Form

UI cần có:

- Company name input.
- Representative name input.
- Phone number input.
- Business field input/select.
- Logo picker optional.
- Save button.

Validation:

- Company name bắt buộc, tối đa 255 ký tự.
- Representative name bắt buộc, tối đa 255 ký tự.
- Phone number bắt buộc, tối đa 50 ký tự, chỉ gồm số và ký tự điện thoại hợp lệ.
- Business field bắt buộc, tối đa 255 ký tự.
- Logo file id có thể null.

API:

```http
PUT /api/v1/smes/me
```

Body:

```json
{
  "companyName": "ABC Company",
  "representativeName": "Nguyen Van A",
  "phoneNumber": "0909123456",
  "businessField": "Food and Beverage",
  "logoFileId": null
}
```

UX sau khi save:

- Hiển thị toast: "Cập nhật hồ sơ doanh nghiệp thành công."
- Refresh SME profile.

## 7. Admin UX/UI

### 7.1. Admin Verification List

Mục tiêu:

- Cho Admin xem các yêu cầu xác thực sinh viên.
- Ưu tiên filter `PENDING`.

UI cần có:

- Table/list.
- Filter status:
  - All
  - Pending
  - Approved
  - Rejected
- Search client-side theo email/full name nếu cần.
- Empty state khi không có request.
- Loading state.
- Error state.

Columns gợi ý:

- Student full name.
- Student email.
- School.
- Major.
- File name.
- Status.
- Submitted at.
- Action: View detail.

API:

```http
GET /api/v1/admin/student-verifications?status=PENDING
```

Response:

```json
[
  {
    "id": "guid",
    "status": "PENDING",
    "submittedAt": "2026-05-19T00:00:00Z",
    "reviewedAt": null,
    "studentProfileId": "guid",
    "studentUserId": "guid",
    "studentEmail": "student1@example.com",
    "studentFullName": "Student One",
    "school": "FPT University",
    "major": "Graphic Design",
    "originalFilename": "student-card.pdf",
    "mimeType": "application/pdf",
    "fileSizeBytes": 12345
  }
]
```

### 7.2. Admin Verification Detail

UI cần có:

- Student information section.
- Profile information section.
- Verification document metadata section.
- Status badge.
- Approve button.
- Reject button.
- Rejection reason textarea in reject modal.

API:

```http
GET /api/v1/admin/student-verifications/{verificationId}
```

Response:

```json
{
  "id": "guid",
  "status": "PENDING",
  "rejectionReason": null,
  "submittedAt": "2026-05-19T00:00:00Z",
  "reviewedAt": null,
  "reviewedByAdminId": null,
  "studentProfileId": "guid",
  "studentUserId": "guid",
  "studentEmail": "student1@example.com",
  "studentUsername": "student1",
  "studentFullName": "Student One",
  "school": "FPT University",
  "major": "Graphic Design",
  "studyStartYear": 2022,
  "bio": "Student designer",
  "verificationStatus": "PENDING",
  "canWithdraw": false,
  "documentFileId": "guid",
  "storageProvider": "local",
  "bucket": "verification",
  "storageKey": "students/student1/card.pdf",
  "originalFilename": "student-card.pdf",
  "mimeType": "application/pdf",
  "fileExtension": "pdf",
  "fileSizeBytes": 12345,
  "checksum": "abc123"
}
```

UX lưu ý:

- Nếu status không phải `PENDING`, có thể disable approve/reject.
- Với Phase 1, chưa có API download file thật. Frontend chỉ hiển thị metadata hoặc link mock theo `storageKey` nếu team có cơ chế storage riêng.

### 7.3. Approve Verification

UX:

- Khi Admin bấm Approve, mở confirmation modal.
- Text gợi ý: "Bạn chắc chắn muốn duyệt xác thực cho sinh viên này?"
- Sau khi approve thành công, refresh detail/list.

API:

```http
POST /api/v1/admin/student-verifications/{verificationId}/approve
```

Response:

```json
{
  "id": "guid",
  "studentProfileId": "guid",
  "documentFileId": "guid",
  "status": "APPROVED",
  "reviewedByAdminId": "guid",
  "rejectionReason": null,
  "submittedAt": "2026-05-19T00:00:00Z",
  "reviewedAt": "2026-05-19T00:00:00Z"
}
```

### 7.4. Reject Verification

UX:

- Khi Admin bấm Reject, mở modal nhập lý do.
- Rejection reason bắt buộc, tối đa 1000 ký tự.
- Sau khi reject thành công, refresh detail/list.

API:

```http
POST /api/v1/admin/student-verifications/{verificationId}/reject
```

Body:

```json
{
  "rejectionReason": "Ảnh thẻ sinh viên bị mờ, vui lòng gửi lại tài liệu rõ hơn."
}
```

Response:

```json
{
  "id": "guid",
  "studentProfileId": "guid",
  "documentFileId": "guid",
  "status": "REJECTED",
  "reviewedByAdminId": "guid",
  "rejectionReason": "Ảnh thẻ sinh viên bị mờ, vui lòng gửi lại tài liệu rõ hơn.",
  "submittedAt": "2026-05-19T00:00:00Z",
  "reviewedAt": "2026-05-19T00:00:00Z"
}
```

## 8. Error Handling UX

Frontend nên xử lý các status phổ biến:

| HTTP status | Ý nghĩa | UX gợi ý |
| --- | --- | --- |
| 400 | Dữ liệu không hợp lệ hoặc business rule fail | Hiển thị lỗi dưới field hoặc toast |
| 401 | Chưa đăng nhập/token hết hạn | Thử refresh token, nếu fail chuyển Login |
| 403 | Sai role/không có quyền | Hiển thị Forbidden page |
| 404 | Resource chưa tồn tại | Với profile: hiển thị form tạo mới |
| 500 | Lỗi server | Hiển thị thông báo lỗi chung |

Các business error cần map rõ:

- Email đã tồn tại.
- Username đã tồn tại.
- Sai email hoặc password.
- Student chưa tạo profile nhưng gửi verification.
- Student đã có verification pending.
- File extension không thuộc `jpg`, `png`, `pdf`.
- SME gọi API Student hoặc Student gọi API SME.
- Non-admin gọi API Admin.

## 9. Component Gợi Ý

Shared components:

- `AuthLayout`
- `TextInput`
- `PasswordInput`
- `RoleSelector`
- `StatusBadge`
- `ErrorAlert`
- `LoadingState`
- `EmptyState`
- `ConfirmDialog`
- `Textarea`
- `FileMetadataPicker`

Student components:

- `StudentOnboardingPage`
- `StudentProfileForm`
- `StudentVerificationForm`
- `VerificationStatusCard`

SME components:

- `SmeOnboardingPage`
- `SmeProfileForm`

Admin components:

- `AdminVerificationListPage`
- `AdminVerificationTable`
- `AdminVerificationDetailPage`
- `RejectVerificationDialog`

## 10. Frontend Route Gợi Ý

```text
/login
/register
/student/onboarding
/student/profile
/student/verification
/sme/onboarding
/sme/profile
/admin/student-verifications
/admin/student-verifications/:id
/forbidden
```

Route guard:

- Guest routes: `/login`, `/register`.
- Student routes: chỉ `STUDENT`.
- SME routes: chỉ `SME`.
- Admin routes: chỉ `ADMIN`.

## 11. Phase 1 Done Definition Cho Frontend

Frontend Phase 1 được xem là xong khi:

- Guest có thể register Student/SME.
- User có thể login/logout.
- App giữ session bằng access token/refresh token.
- App điều hướng đúng theo role sau login.
- Student có thể tạo profile.
- Student có thể gửi verification metadata với `jpg`, `png`, `pdf`.
- Student thấy trạng thái verification.
- SME có thể tạo profile.
- Admin có thể xem danh sách verification pending.
- Admin có thể xem chi tiết verification.
- Admin có thể approve/reject verification.
- UI xử lý đúng loading, empty, error, unauthorized, forbidden states.

