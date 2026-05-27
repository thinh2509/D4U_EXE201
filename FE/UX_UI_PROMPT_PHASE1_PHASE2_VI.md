# Prompt Thiết Kế UX/UI D4U - Phase 1 Và Phase 2

Bạn là Senior Frontend Engineer kiêm Product UI/UX Designer.

Hãy làm việc trong frontend React project:

```text
FE
```

## 1. Mục Tiêu

Thiết kế và triển khai giao diện tiếng Việt cho D4U MVP dựa trên backend đã hoàn thành ở Phase 1 và Phase 2.

D4U là nền tảng marketplace kết nối:

- Student Designer: sinh viên thiết kế nhận dự án.
- SME: doanh nghiệp nhỏ/vừa đăng dự án thiết kế.
- Admin: người vận hành hệ thống, duyệt xác thực sinh viên.

Frontend cần giúp người dùng hoàn thành luồng thực tế, không làm landing page marketing.

## 2. Tech Stack Frontend

Sử dụng stack hiện có:

- React
- Vite
- React Router
- Ant Design
- Axios
- CSS thường hoặc CSS module nếu cần

Backend API gọi qua:

```text
/api/v1
```

Vite proxy trỏ về:

```text
http://localhost:8080
```

## 3. Ngôn Ngữ Giao Diện

Toàn bộ UI hiển thị bằng tiếng Việt.

Ví dụ:

- Đăng nhập
- Đăng ký
- Hồ sơ sinh viên
- Xác thực sinh viên
- Hồ sơ doanh nghiệp
- Dự án của tôi
- Tạo dự án
- Công khai dự án
- Hủy dự án
- Danh sách ứng tuyển
- Gửi ứng tuyển
- Tạo đề nghị
- Chấp nhận đề nghị
- Từ chối đề nghị

## 4. Phong Cách UX/UI

Thiết kế theo hướng SaaS marketplace hiện đại, rõ ràng, đáng tin cậy.

Yêu cầu:

- Giao diện sạch, chuyên nghiệp, dễ dùng.
- Không dùng hero landing page.
- Không dùng quá nhiều màu tím; tím chỉ là màu nhấn chính.
- Ưu tiên layout dashboard thực dụng.
- Form phải dễ scan, chia section rõ ràng.
- Table phải dễ đọc và có trạng thái empty/loading/error.
- Card chỉ dùng cho item hoặc cụm thông tin thật sự cần đóng khung.
- Không lồng card trong card.
- Responsive tốt trên mobile và desktop.
- Button/action phải rõ ý nghĩa.
- Có icon cho navigation và action quan trọng.
- Có trạng thái loading, disabled, success, error, empty, forbidden.

## 5. Phase 1 Scope - Foundation

Chỉ triển khai các chức năng sau.

### 5.1. Auth

Màn hình:

- `/login`
- `/register`
- `/forbidden`

Register cho phép chọn role:

- Sinh viên thiết kế
- Doanh nghiệp

Không cho tự đăng ký Admin.

Register fields:

- Email
- Username
- Họ và tên
- Mật khẩu
- Vai trò

Login fields:

- Email
- Mật khẩu

Sau login điều hướng theo role:

- `STUDENT` -> `/student/profile`
- `SME` -> `/sme/profile`
- `ADMIN` -> `/admin/student-verifications`

API:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET /api/v1/auth/me
```

Token:

- Lưu `accessToken` và `refreshToken`.
- Tự gắn `Authorization: Bearer <accessToken>`.
- Khi `401`, thử refresh token.
- Nếu refresh thất bại, logout và chuyển về `/login`.

### 5.2. Student Profile

Routes:

```text
/student/profile
/student/verification
```

Student profile fields:

- Trường học
- Chuyên ngành
- Năm bắt đầu học
- Giới thiệu bản thân

API:

```text
GET /api/v1/students/me/profile
PUT /api/v1/students/me/profile
```

UX:

- Nếu chưa có profile, hiển thị onboarding và form rỗng.
- Nếu đã có profile, prefill dữ liệu.
- Nút lưu có loading.
- Hiển thị thông báo thành công/thất bại.

### 5.3. Student Verification

Student gửi metadata giấy tờ xác thực sinh viên.

Chỉ chấp nhận:

- jpg
- png
- pdf

UI có file picker, nhưng Phase 1 backend chỉ nhận metadata, không upload binary file thật.

Frontend lấy metadata từ file:

- `fileName`
- `fileExtension`
- `fileSizeBytes`
- `storageKey` mock
- `documentType`

API:

```text
POST /api/v1/students/me/verification
```

UX:

- Nếu chưa có Student profile, yêu cầu tạo profile trước.
- Nếu trạng thái `PENDING`, hiển thị đang chờ Admin duyệt.
- Nếu `APPROVED`, hiển thị đã xác thực.
- Nếu `REJECTED`, hiển thị lý do và cho gửi lại.

### 5.4. SME Profile

Route:

```text
/sme/profile
```

SME profile fields:

- Tên doanh nghiệp
- Người đại diện
- Số điện thoại
- Lĩnh vực kinh doanh
- Logo optional

API:

```text
GET /api/v1/smes/me/profile
PUT /api/v1/smes/me/profile
```

UX:

- Nếu chưa có profile, hiển thị onboarding và form rỗng.
- Nếu đã có profile, prefill dữ liệu.
- Lưu thành công thì refresh profile.

### 5.5. Admin Student Verification

Routes:

```text
/admin/student-verifications
/admin/student-verifications/:id
```

List page:

- Table danh sách yêu cầu xác thực.
- Có filter status nếu backend hỗ trợ query.
- Có action xem chi tiết.

Detail page hiển thị:

- Thông tin user sinh viên.
- Thông tin profile.
- Metadata giấy tờ xác thực.
- Trạng thái hiện tại.
- Lý do từ chối nếu có.

Admin actions:

- Approve
- Reject

API:

```text
GET /api/v1/admin/student-verifications
GET /api/v1/admin/student-verifications/{id}
POST /api/v1/admin/student-verifications/{id}/approve
POST /api/v1/admin/student-verifications/{id}/reject
```

Reject modal:

- Bắt buộc nhập lý do.
- Sau khi reject thành công, refresh dữ liệu.

## 6. Phase 2 Scope - Marketplace

Phase 2 đã hoàn thành backend gồm:

- AI Project Brief Assistant.
- SME tạo/cập nhật/publish/hủy project.
- Student xem danh sách project mở và xem chi tiết.
- Student gửi application.
- SME xem applications của project.
- SME tạo offer từ application hoặc private offer.
- Student accept/reject offer.

Không triển khai Phase 3:

- Không escrow payment thật.
- Không QR chuyển khoản.
- Không milestone execution.
- Không submission/revision.
- Không wallet/withdrawal.
- Không dispute/rating.

### 6.1. SME Project Management

Routes đề xuất:

```text
/sme/projects
/sme/projects/new
/sme/projects/:id
/sme/projects/:id/edit
/sme/projects/:id/applications
```

Project fields:

- Tiêu đề
- Mô tả/brief
- Mục đích sử dụng
- Hạng mục thiết kế
- Loại project: OPEN hoặc PRIVATE
- Ngân sách
- Deadline
- Số lần revision
- Yêu cầu bảo mật
- Cho phép đưa vào portfolio hay không
- Deliverables
- Attachments metadata nếu API hỗ trợ

API:

```text
POST /api/v1/projects
PUT /api/v1/projects/{projectId}
POST /api/v1/projects/{projectId}/publish
POST /api/v1/projects/{projectId}/cancel
DELETE /api/v1/projects/{projectId}
GET /api/v1/projects/{projectId}
```

UX:

- SME có dashboard "Dự án của tôi".
- Phân tab/filter theo trạng thái: Draft, Open, Private Invited, Cancelled.
- Draft project có action sửa, publish, hủy/xóa.
- Open project có action xem applications, hủy nếu còn được phép.
- Publish phải hiển thị lỗi rõ nếu vượt giới hạn subscription.
- Basic plan giới hạn tối đa 2 project OPEN cùng lúc và budget tối đa 5.000.000 VND.

### 6.2. AI Project Brief Assistant

Route hoặc component trong form tạo project:

```text
/sme/projects/new
```

API:

```text
POST /api/v1/ai/project-brief-assistant
```

UX:

- SME nhập ý tưởng thô.
- Bấm "Gợi ý bằng AI".
- Hiển thị loading rõ ràng.
- AI trả về gợi ý title, brief, usage purpose, deliverables, design category hint, deadline notes.
- Frontend chỉ dùng AI để prefill form.
- SME phải tự review/chỉnh sửa trước khi lưu hoặc publish.
- Không để AI tự publish, tự chọn student, tự định giá cuối cùng.
- Không hiển thị như chatbot dài; đây là form helper cho MVP.

### 6.3. Student Marketplace

Routes đề xuất:

```text
/student/projects
/student/projects/:id
/student/applications
/student/offers
```

API:

```text
GET /api/v1/projects
GET /api/v1/projects/{projectId}
POST /api/v1/projects/{projectId}/applications
POST /api/v1/offers/{offerId}/accept
POST /api/v1/offers/{offerId}/reject
```

UX:

- Student chỉ nên thấy project OPEN có thể ứng tuyển.
- Danh sách project có filter/search cơ bản:
  - Từ khóa
  - Category
  - Budget
  - Deadline
- Project card hiển thị:
  - Tiêu đề
  - SME/company nếu API trả
  - Category
  - Budget
  - Deadline
  - Trạng thái
- Detail page hiển thị đầy đủ brief, usage purpose, deliverables, budget, deadline, revision limit, confidentiality.
- Form application gồm:
  - Giá đề xuất
  - Cover letter
  - Thời gian dự kiến hoàn thành
- Student chỉ được apply một lần cho một project.
- Nếu apply thành công, disable action apply và hiển thị trạng thái đã ứng tuyển nếu API trả được.

### 6.4. SME Applications And Offers

Route:

```text
/sme/projects/:id/applications
```

API:

```text
GET /api/v1/projects/{projectId}/applications
POST /api/v1/projects/{projectId}/offers
```

UX:

- SME xem danh sách applications cho project của mình.
- Mỗi application hiển thị:
  - Student
  - Proposed price
  - Cover letter
  - Estimated duration
  - Submitted date
- SME có action "Tạo đề nghị".
- Offer form cho phép xác nhận giá, deadline/notes nếu API hỗ trợ.
- Offer sau khi tạo có trạng thái `PENDING_PAYMENT`.
- Vì Phase 3 payment chưa làm, UI cần ghi rõ "Đề nghị đang chờ thanh toán escrow ở Phase 3" nếu cần.

### 6.5. Student Offers

Routes:

```text
/student/offers
```

API:

```text
POST /api/v1/offers/{offerId}/accept
POST /api/v1/offers/{offerId}/reject
```

UX:

- Hiển thị danh sách offer nếu API hiện có endpoint list; nếu backend chưa có list offers, không tự bịa API.
- Nếu chỉ có accept/reject endpoint, chỉ triển khai action ở nơi backend trả offer.
- Accept/reject cần confirmation modal.
- Sau khi accept/reject, refresh dữ liệu.

## 7. Cấu Trúc Frontend Đề Xuất

```text
src/
  app/
    routes.jsx
  services/
    apiClient.js
    authApi.js
    profileApi.js
    projectApi.js
    adminApi.js
    aiApi.js
  contexts/
    AuthContext.jsx
  components/
    AppLayout.jsx
    PageHeader.jsx
    StatusBadge.jsx
    EmptyState.jsx
    LoadingState.jsx
    ErrorState.jsx
    ConfirmAction.jsx
  pages/
    auth/
      LoginPage.jsx
      RegisterPage.jsx
    student/
      StudentProfilePage.jsx
      StudentVerificationPage.jsx
      ProjectListPage.jsx
      ProjectDetailPage.jsx
      StudentOffersPage.jsx
    sme/
      SmeProfilePage.jsx
      SmeProjectListPage.jsx
      SmeProjectFormPage.jsx
      SmeProjectDetailPage.jsx
      SmeProjectApplicationsPage.jsx
    admin/
      VerificationListPage.jsx
      VerificationDetailPage.jsx
    shared/
      ForbiddenPage.jsx
      NotFoundPage.jsx
```

## 8. Route Guard

Rules:

- Guest route: `/login`, `/register`.
- Protected route: yêu cầu login.
- Student route: chỉ role `STUDENT`.
- SME route: chỉ role `SME`.
- Admin route: chỉ role `ADMIN`.
- Sai role chuyển đến `/forbidden`.
- Chưa login chuyển đến `/login`.
- Login rồi vào `/login` hoặc `/register` thì redirect theo role.

## 9. Trạng Thái Cần Thiết Kế

Mỗi màn hình cần có:

- Loading state.
- Empty state.
- Error state.
- Success feedback.
- Form validation.
- Unauthorized/session expired handling.
- Forbidden page.
- Confirmation modal cho action nguy hiểm.

Action nguy hiểm:

- Publish project.
- Cancel/delete project.
- Reject student verification.
- Accept/reject offer.

## 10. Done Definition

Frontend Phase 1 + Phase 2 được xem là xong khi:

- User có thể register/login/logout.
- Token refresh hoạt động.
- Điều hướng theo role đúng.
- Student tạo profile và gửi verification metadata.
- Student thấy trạng thái verification.
- SME tạo profile.
- Admin duyệt/từ chối verification.
- SME dùng AI helper để prefill project form.
- SME tạo draft project.
- SME sửa project.
- SME publish project.
- SME hủy/xóa project theo rule backend.
- Student xem danh sách project OPEN.
- Student xem project detail.
- Student gửi application.
- SME xem applications.
- SME tạo offer.
- Student accept/reject offer nếu có dữ liệu offer từ backend.
- App build thành công bằng `npm run build`.

## 11. Lưu Ý Quan Trọng

- Không hardcode backend URL trong Axios. Dùng `baseURL: "/api/v1"`.
- Không tự bịa API ngoài backend đã có.
- Không triển khai Phase 3.
- Không tích hợp payment thật.
- Không dùng social login.
- Không dùng AI để tự động quyết định business rule.
- Tất cả text UI dùng tiếng Việt.
- Nếu API trả lỗi validation, hiển thị lỗi gần field hoặc bằng message rõ ràng.
