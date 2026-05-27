# Prompt Stitch - D4U Phase 1 UX/UI

Copy toàn bộ prompt bên dưới và đưa vào Stitch.withgoogle để sinh giao diện UX/UI cho Phase 1.

```text
Thiết kế UX/UI cho ứng dụng web D4U - Design For You.

D4U là nền tảng marketplace kết nối Student Designer và SME. Phase 1 chỉ tập trung vào nền tảng tài khoản, hồ sơ và xác thực sinh viên. Không thiết kế marketplace, project, payment, AI, offer, wallet hoặc dispute trong Phase 1.

Ngôn ngữ giao diện: tiếng Việt.

Phong cách thương hiệu:
- Giao diện hiện đại, công nghệ, đáng tin cậy, chuyên nghiệp.
- Màu sắc lấy cảm hứng từ logo D4U.
- Logo có nền trắng, biểu tượng xanh teal đậm, cyan sáng và chữ xám đen.
- Thiết kế giao diện nền sáng, sạch và dễ đọc.
- Không dùng nền tối làm background chính toàn trang.
- Có thể dùng màu đen/dark navy của logo cho logo area, sidebar nhỏ, top bar hoặc text nhấn, nhưng tổng thể app phải là light theme.
- Dùng cyan sáng làm màu nhấn cho CTA, trạng thái active, icon quan trọng và link chính.
- Dùng teal đậm cho secondary accent, badge hoặc illustration nhỏ.
- Dùng charcoal/dark gray cho heading và text chính.
- Không dùng palette tím, cam, beige hoặc gradient sặc sỡ.
- Giao diện cần sạch, rõ ràng, không giống landing page marketing.

Gợi ý màu light theme:
- Background chính: #F6FAFD hoặc #F8FBFE
- Surface/card: #FFFFFF
- Surface phụ: #EEF6FA
- Primary cyan: #12AEEA
- Primary cyan hover: #0B9BD3
- Deep teal: #075D78
- Muted teal: #0A6F8E
- Charcoal text: #1D2428
- Secondary text: #667985
- Muted text: #8EA0AA
- Border: #D7E5EC
- Sidebar/topbar optional dark: #071014
- Success: #16A34A
- Warning: #F59E0B
- Error: #DC2626

Yêu cầu tổng thể:
- Thiết kế dạng SaaS dashboard/app, không phải landing page.
- First screen là Login hoặc Register, không tạo hero marketing.
- Layout phải responsive cho desktop và mobile.
- Form rõ ràng, dễ scan, có label, helper text và validation state.
- Button chính dùng cyan, hover đậm hơn, disabled rõ ràng.
- Sidebar hoặc top navigation ưu tiên nền sáng/trắng; nếu dùng nền tối thì chỉ dùng vừa phải để tạo nhận diện thương hiệu.
- Card/panel nền trắng, border nhẹ, shadow rất nhẹ, radius khoảng 8px.
- Không lồng card trong card.
- Không dùng background blob/orb/decorative gradient.
- Typography hiện đại, dễ đọc, không quá nghệ thuật.
- Ưu tiên trải nghiệm làm việc thật: nhanh, rõ, ít nhiễu.

Đối tượng người dùng:
1. Guest
   - Đăng ký tài khoản Student hoặc SME.
   - Đăng nhập bằng email/password.

2. Student Designer
   - Tạo/cập nhật hồ sơ sinh viên.
   - Gửi thông tin xác thực sinh viên.
   - Theo dõi trạng thái xác thực.

3. SME
   - Tạo/cập nhật hồ sơ doanh nghiệp.

4. Admin
   - Xem danh sách yêu cầu xác thực sinh viên.
   - Xem chi tiết yêu cầu xác thực.
   - Duyệt hoặc từ chối yêu cầu xác thực.

Các màn hình cần thiết kế:

1. Login Page
Route: /login
Mục tiêu:
- Người dùng đăng nhập bằng email và mật khẩu.

Thành phần UI:
- Logo D4U ở đầu form.
- Tiêu đề: "Đăng nhập D4U"
- Mô tả ngắn: "Quản lý hồ sơ, xác thực và bắt đầu làm việc cùng D4U."
- Field Email.
- Field Mật khẩu.
- Button chính: "Đăng nhập"
- Link: "Chưa có tài khoản? Đăng ký"
- Error state khi sai email/mật khẩu.
- Loading state khi đang đăng nhập.

Visual:
- Nền sáng, sạch, có thể dùng một dải màu rất nhẹ xanh nhạt ở khu vực phụ.
- Form nằm trong panel trắng nổi nhẹ.
- CTA cyan.
- Logo hoặc mark D4U có thể nằm trong khung nhỏ nền dark navy để giữ cảm giác giống logo.

2. Register Page
Route: /register
Mục tiêu:
- Guest tạo tài khoản Student hoặc SME.
- Không cho tự đăng ký Admin.

Thành phần UI:
- Logo D4U.
- Tiêu đề: "Tạo tài khoản D4U"
- Role selector dạng segmented control:
  - "Sinh viên thiết kế"
  - "Doanh nghiệp"
- Field Email.
- Field Username.
- Field Họ và tên.
- Field Mật khẩu.
- Password requirement hint:
  - Ít nhất 8 ký tự.
  - Có chữ và số.
- Button chính: "Tạo tài khoản"
- Link: "Đã có tài khoản? Đăng nhập"
- Validation state rõ ràng.

3. Student Layout
Routes:
- /student/profile
- /student/verification

Layout:
- Dashboard layout nền sáng.
- Sidebar hoặc top nav trắng, border nhẹ.
- Logo D4U.
- Menu:
  - Hồ sơ sinh viên
  - Xác thực sinh viên
- Khu vực user menu có tên user và nút đăng xuất.
- Active menu dùng cyan/teal.

4. Student Profile Page
Route: /student/profile
Mục tiêu:
- Student tạo hoặc cập nhật hồ sơ.

Field:
- Trường học
- Chuyên ngành
- Năm bắt đầu học
- Giới thiệu bản thân

Thành phần UI:
- Page title: "Hồ sơ sinh viên"
- Status summary card:
  - Trạng thái hồ sơ: Chưa tạo / Đã cập nhật
  - Trạng thái xác thực: Chưa gửi / Đang chờ duyệt / Đã duyệt / Bị từ chối
- Form profile.
- Button: "Lưu hồ sơ"
- Empty/onboarding state nếu chưa có hồ sơ:
  - "Hoàn thiện hồ sơ để có thể gửi xác thực sinh viên."

5. Student Verification Page
Route: /student/verification
Mục tiêu:
- Student gửi metadata giấy tờ xác thực sinh viên.
- Phase 1 chỉ cần UI chọn file và lấy metadata, chưa upload file thật.

Rule:
- Chỉ chấp nhận file: jpg, png, pdf.

Field/UI:
- Document type: "Thẻ sinh viên" hoặc "Giấy xác nhận sinh viên"
- File picker/dropzone.
- Hiển thị file metadata:
  - Tên file
  - Định dạng
  - Dung lượng
- Button: "Gửi xác thực"

Status UI:
- NOT_SUBMITTED: "Chưa gửi xác thực"
- PENDING: "Đang chờ Admin duyệt"
- APPROVED: "Đã xác thực sinh viên"
- REJECTED: "Xác thực bị từ chối"

Nếu rejected:
- Hiển thị lý do từ chối.
- Cho phép gửi lại.

6. SME Layout
Route:
- /sme/profile

Layout:
- Dashboard layout nền sáng.
- Menu:
  - Hồ sơ doanh nghiệp
- User menu và đăng xuất.
- Active menu dùng cyan/teal.

7. SME Profile Page
Route: /sme/profile
Mục tiêu:
- SME tạo hoặc cập nhật hồ sơ doanh nghiệp.

Field:
- Tên doanh nghiệp
- Người đại diện
- Số điện thoại
- Lĩnh vực kinh doanh
- Logo optional

Thành phần UI:
- Page title: "Hồ sơ doanh nghiệp"
- Onboarding panel nếu chưa có profile:
  - "Hoàn thiện hồ sơ doanh nghiệp để bắt đầu sử dụng D4U."
- Form profile.
- Button: "Lưu hồ sơ"
- Success/error state.

8. Admin Layout
Routes:
- /admin/student-verifications
- /admin/student-verifications/:id

Layout:
- Dashboard layout nền sáng.
- Sidebar hoặc top nav trắng, border nhẹ.
- Menu:
  - Xác thực sinh viên
- Header có tên admin và đăng xuất.

9. Admin Verification List Page
Route: /admin/student-verifications
Mục tiêu:
- Admin xem các yêu cầu xác thực sinh viên.

Thành phần UI:
- Page title: "Yêu cầu xác thực sinh viên"
- Filter status:
  - Tất cả
  - Đang chờ duyệt
  - Đã duyệt
  - Bị từ chối
- Search theo tên/email nếu phù hợp.
- Table columns:
  - Sinh viên
  - Email
  - Trường học
  - Chuyên ngành
  - Loại giấy tờ
  - Trạng thái
  - Ngày gửi
  - Hành động: "Xem chi tiết"
- Empty state: "Chưa có yêu cầu xác thực nào."
- Loading skeleton/table loading.

10. Admin Verification Detail Page
Route: /admin/student-verifications/:id
Mục tiêu:
- Admin xem chi tiết và quyết định duyệt/từ chối.

Thành phần UI:
- Back button: "Quay lại danh sách"
- Page title: "Chi tiết xác thực"
- Section thông tin tài khoản:
  - Họ tên
  - Email
  - Username
- Section hồ sơ sinh viên:
  - Trường học
  - Chuyên ngành
  - Năm bắt đầu học
  - Bio
- Section giấy tờ xác thực:
  - Loại giấy tờ
  - Tên file
  - Định dạng
  - Dung lượng
  - Storage key hoặc mock file reference
- Status badge.
- Button "Duyệt" màu success/cyan.
- Button "Từ chối" màu danger.

Approve flow:
- Khi bấm Duyệt, mở confirmation modal.
- Modal title: "Duyệt xác thực sinh viên?"
- Button confirm: "Duyệt xác thực"

Reject flow:
- Khi bấm Từ chối, mở modal có textarea.
- Field: "Lý do từ chối"
- Bắt buộc nhập lý do.
- Button confirm: "Từ chối xác thực"

11. Forbidden Page
Route: /forbidden
Mục tiêu:
- Hiển thị khi user truy cập sai role.

UI:
- Icon cảnh báo.
- Title: "Bạn không có quyền truy cập"
- Mô tả: "Tài khoản của bạn không được phép truy cập khu vực này."
- Button: "Quay về trang phù hợp"

Route behavior cần thể hiện trong prototype:
- Guest chỉ thấy login/register.
- Student chỉ thấy student pages.
- SME chỉ thấy SME profile.
- Admin chỉ thấy admin verification pages.

Trạng thái cần có trong design:
- Loading
- Empty
- Error
- Success toast
- Field validation
- Disabled button
- Confirmation modal
- Forbidden
- Session expired redirect về login

Không thiết kế trong Phase 1:
- Không có marketplace/project list.
- Không có AI assistant.
- Không có tạo project.
- Không có application/offer.
- Không có thanh toán/escrow/QR.
- Không có milestone/submission.
- Không có wallet/withdrawal.
- Không có dispute/rating.

Yêu cầu output:
- Tạo UI prototype đầy đủ các màn hình Phase 1.
- Giao diện phải nhất quán với màu logo D4U nhưng dùng nền sáng làm chủ đạo.
- Dùng tiếng Việt cho toàn bộ text.
- Ưu tiên dashboard app thực tế, không làm landing page.
- Thiết kế đủ desktop và mobile responsive.
```
