# D4U Core Interaction E2E Test Guide

Tài liệu này kiểm thử luồng core theo tương tác thực tế giữa SME và Student. Không test theo kiểu một role hoàn thành toàn bộ thao tác rồi mới đổi sang role còn lại. Mỗi bước đều có người thực hiện, phản hồi cần quan sát và trạng thái hệ thống cần xác nhận trước khi bàn giao cho bên tiếp theo.

## 1. Phạm Vi

Luồng Done cần xác nhận:

```text
SME đăng project
-> Student apply
-> SME tạo offer
-> Student accept
-> SME thanh toán PayOS thật
-> Student nộp Sketch
-> SME review Sketch
-> Student nộp Final
-> SME review Final
-> escrow release
-> ví Student nhận net amount
```

Trong tranche hiện tại:

- Withdrawal chỉ smoke thủ công.
- Admin xử lý `ADMIN_REVIEW` qua Swagger.
- Không test refund split rules, rating, portfolio, package purchase, AI Matching hoặc automatic payout.

## 2. Chuẩn Bị

### 2.1. Chạy hệ thống

```powershell
cd D:\Codex
docker compose up -d --build
docker compose ps
```

Kỳ vọng:

- `d4u-postgres`: `healthy`.
- `d4u-api`: running.
- `d4u-frontend`: running.
- `GET http://localhost:8080/health`: HTTP `200`.
- `GET http://localhost:8080/swagger`: HTTP `200`.
- `GET http://localhost:3000`: HTTP `200`.

### 2.2. PayOS live

Xem [PAYOS_LIVE_SMOKE_RUNBOOK_VI.md](PAYOS_LIVE_SMOKE_RUNBOOK_VI.md).

Với named tunnel, dùng hostname ổn định:

```text
https://d4u-demo.<domain>
```

Với Quick Tunnel chỉ dùng tạm khi smoke:

```text
https://<random>.trycloudflare.com
```

Với named tunnel hoặc môi trường deploy, dùng public origin cho return URL:

```env
PAYMENT_PROVIDER=PayOS
PAYMENT_RETURN_URL=https://<public-origin>/payment/success
PAYMENT_CANCEL_URL=https://<public-origin>/payment/cancel
PAYMENT_PAYOS_CLIENT_ID=<secret>
PAYMENT_PAYOS_API_KEY=<secret>
PAYMENT_PAYOS_CHECKSUM_KEY=<secret>
```

Webhook phải được confirm với PayOS:

```text
https://<public-origin>/api/v1/payments/payos/webhook
```

Với Quick Tunnel để smoke local trên cùng máy, webhook vẫn dùng HTTPS public nhưng return/cancel URL nên quay về localhost để giữ session SME:

```env
PAYMENT_RETURN_URL=http://localhost:3000/payment/success
PAYMENT_CANCEL_URL=http://localhost:3000/payment/cancel
```

### 2.3. Tài khoản

Chuẩn bị ba phiên trình duyệt hoặc ba profile riêng:

| Phiên | Role | Mục đích |
| --- | --- | --- |
| A | SME | Tạo project, tạo offer, thanh toán, review |
| B | Student | Apply, accept offer, upload và nộp bài |
| C | Admin | Duyệt verification và xử lý `ADMIN_REVIEW` khi cần |

Không dùng cùng một browser profile cho SME và Student vì token đăng nhập sẽ ghi đè nhau.

### 2.4. Dữ liệu project mẫu

| Trường | Giá trị smoke |
| --- | --- |
| Project type | `OPEN` |
| Budget | `10000 VND` hoặc giá trị nhỏ hợp lệ |
| Revision | Không giới hạn số lần chỉnh sửa |
| Sketch deadline | Trong tương lai |
| Final deadline | Sau Sketch deadline |
| Total deadline | Sau Final deadline |

## 3. Luồng Tương Tác Chính

### 3.0. Kịch Bản Thao Tác Chi Tiết Từng Bước

Phần này là đường chạy chính để tester thực hiện lần đầu. Dùng hai cửa sổ trình duyệt song song:

- Cửa sổ A: đăng nhập SME.
- Cửa sổ B: đăng nhập Student.
- Thay `<public-origin>` bằng URL tunnel HTTPS đang chạy nếu test PayOS thật.
- Ghi lại `projectId`, `offerId` và `paymentId` khi chúng xuất hiện để đối chiếu DB.

#### Chặng 1: SME Đăng Project, Student Apply

**Bước 1 - SME mở form tạo project**

1. Tại cửa sổ A, đăng nhập tài khoản SME.
2. Mở `<public-origin>/sme/projects/new`.
3. Kiểm tra tiêu đề trang là `Tạo dự án`.
4. Không bắt buộc dùng AI Brief Assistant. Nếu muốn kiểm tra AI mock, nhập `Ý tưởng thô` tối thiểu 20 ký tự và bấm `Gợi ý bằng AI`.

Kết quả cần thấy: form `Thông tin dự án` hiển thị đầy đủ.

**Bước 2 - SME nhập dữ liệu project**

Nhập dữ liệu mẫu:

| Trường UI | Giá trị mẫu |
| --- | --- |
| Danh mục thiết kế | Chọn một category đang có |
| Tiêu đề | `Smoke Test PayOS - <ngày giờ>` |
| Brief | `Thiết kế bộ nhận diện tối giản cho chiến dịch thử nghiệm D4U.` |
| Mục đích sử dụng | `Kiểm thử luồng core` |
| Loại dự án | `OPEN` |
| Ngân sách | `10000` |
| Deadline sketch | Một ngày trong tương lai |
| Deadline final | Sau deadline sketch |
| Deadline tổng | Sau deadline final |

Sau đó bấm `Tạo draft`.

Kết quả cần thấy:

- Trình duyệt chuyển sang project detail.
- Badge trạng thái là `DRAFT`.
- Ghi lại `projectId` từ URL `/sme/projects/{projectId}`.

**Bước 3 - SME publish project**

1. Tại project detail, kiểm tra brief, budget và deadline.
2. Bấm `Publish`.
3. Chờ thông báo publish thành công.

Kết quả cần thấy: project chuyển sang `OPEN`.

**Bước 4 - Student tìm project**

1. Chuyển sang cửa sổ B và đăng nhập Student đã được verify.
2. Mở `<public-origin>/student/projects`.
3. Bấm `Làm mới`.
4. Tìm project theo tiêu đề vừa nhập.
5. Bấm mở project.

Kết quả cần thấy: trang detail hiển thị đúng brief, budget và deadline SME đã cấu hình.

**Bước 5 - Student gửi ứng tuyển**

1. Kiểm tra sidebar hiển thị budget, Sketch deadline, Final deadline và Total deadline.
2. Bấm `Gửi ứng tuyển` để test quick apply theo điều khoản project.

Kết quả cần thấy:

- UI báo gửi thành công.
- Application lưu `proposed_price` bằng budget project.
- Application lưu ghi chú xác nhận theo điều khoản công bố và không yêu cầu số ngày dự kiến.
- Nút apply chuyển thành `Đã ứng tuyển` hoặc bị disable.
- Không gửi lại application thứ hai cho cùng project.

Để test nhánh custom proposal trên một project khác:

1. Tại sidebar project detail, bấm `Đề xuất khác`.
2. Nhập `Giá đề xuất mới` và `Giải pháp đề xuất` tối thiểu 20 ký tự.
3. Bấm `Tiếp tục`, kiểm tra modal xác nhận cuối rồi bấm `Gửi ứng tuyển`.

Kết quả cần thấy: application lưu đúng giá và giải pháp Student vừa nhập.

**Bước 6 - SME nhận application**

1. Quay lại cửa sổ A.
2. Tại project detail, bấm `Xem ứng tuyển`.
3. Nếu danh sách chưa cập nhật, bấm `Làm mới`.
4. Tìm application vừa gửi.

Kết quả cần thấy: SME đọc được Student, giá application và giải pháp hoặc ghi chú xác nhận theo điều khoản project.

#### Chặng 2: SME Gửi Offer, Student Accept

**Bước 7 - SME gửi offer**

1. Trong danh sách ứng tuyển, bấm `Chọn và gửi offer` tại application của Student.
2. Kiểm tra modal chỉ đọc hiển thị Student, giá offer, giải pháp hoặc ghi chú xác nhận và hạn phản hồi cố định 48 giờ.
3. Bấm `Gửi offer`.

Kết quả cần thấy:

- UI báo gửi offer thành công.
- SME không nhập lại giá hoặc deadline.
- Backend lấy giá offer từ application đã chọn.
- Offer có trạng thái `WAITING_ACCEPTANCE`.
- Project chuyển sang `OFFER_SELECTED`.

**Bước 8 - Student nhận và accept offer**

1. Quay lại cửa sổ B.
2. Mở `<public-origin>/student/offers`.
3. Bấm `Làm mới`.
4. Tìm offer đúng project và đúng số tiền.
5. Bấm `Chấp nhận`.

Kết quả cần thấy:

- UI báo đã chấp nhận offer và nhắc SME cần thanh toán escrow.
- Offer chuyển sang `ACCEPTED`.
- Student chưa được nộp Sketch cho tới khi PayOS webhook xác nhận thanh toán.

#### Chặng 3: SME Thanh Toán PayOS Thật

**Bước 9 - SME mở workspace**

1. Quay lại cửa sổ A.
2. Mở `<public-origin>/sme/offers`.
3. Bấm `Làm mới`.
4. Tại offer vừa được accept, kiểm tra có hai nút:
   - `Workspace & escrow`: mở trang điều phối project.
   - `Thanh toán PayOS`: mở checkout PayOS trực tiếp từ danh sách offer.
5. Bấm `Workspace & escrow`.

Kết quả cần thấy:

- URL là `/projects/{projectId}/execution`.
- Card `Việc cần làm tiếp theo` hiển thị `Thanh toán escrow qua PayOS`.
- Cột trạng thái hiển thị offer `ACCEPTED`.

Lưu ý:

- Nút PayOS không nằm tại trang project detail `/sme/projects/{projectId}`.
- Nếu đang ở project detail, bấm `Workspace & escrow` trong card `Thao tác`.
- Nếu không thấy nút `Workspace`, bấm `Làm mới` và kiểm tra Student đã bấm `Chấp nhận` offer.
- Nếu muốn bỏ qua workspace, mở `/sme/offers` và bấm `Thanh toán PayOS`.

**Bước 10 - SME tạo checkout PayOS**

1. Trong workspace, tại card `Việc cần làm tiếp theo`, bấm `Mở thanh toán PayOS`.
2. Chờ tab checkout PayOS mở ra.
3. Ghi lại `paymentId` nếu xuất hiện trong return URL hoặc kiểm tra bằng Swagger.
4. Không đóng workspace gốc; giữ tab này để quan sát trạng thái.

Kết quả cần thấy:

- PayOS hiển thị QR hoặc thông tin chuyển khoản.
- Backend tạo payment `PENDING`.
- Escrow được tạo với trạng thái `PENDING_PAYMENT`.
- Offer chuyển sang `PENDING_PAYMENT`.

**Bước 11 - SME chuyển khoản thật giá trị nhỏ**

1. Dùng ứng dụng ngân hàng quét QR PayOS.
2. Kiểm tra số tiền là `10000 VND`.
3. Xác nhận chuyển khoản.
4. Chờ PayOS chuyển trình duyệt về `/payment/success?paymentId=...`.

Kết quả cần thấy:

- Return page hiển thị trạng thái `Đang đối soát với PayOS`, tiến độ, lần kiểm tra gần nhất và hạn checkout.
- Trang chỉ poll backend; không tự đánh dấu thành công từ query string.
- Backend ưu tiên webhook và có thể reconcile trực tiếp với PayOS qua `GET /v2/payment-requests/{orderCode}` khi payment còn `PENDING`.
- Sau khi webhook hoặc reconcile trusted từ PayOS xác nhận `PAID`, trang chuyển về workspace.

**Bước 12 - Xác nhận project đã bắt đầu**

Tại workspace SME:

1. Bấm `Làm mới`.
2. Kiểm tra:

| Thành phần | Giá trị kỳ vọng |
| --- | --- |
| Project | `IN_PROGRESS` |
| Offer | `ACTIVE` |
| Payment | `SUCCESS` |
| Escrow | `FUNDED` |

Tại cửa sổ B:

1. Mở `<public-origin>/student/my-projects`.
2. Bấm `Làm mới`.
3. Tại project vừa thanh toán, bấm `Workspace`.

Kết quả cần thấy: Student thấy next action `Nộp Sketch`.

#### Chặng 4: Student Nộp Sketch, SME Phản Hồi

**Bước 13 - Student upload Sketch**

1. Tại workspace Student, nhập mô tả: `Sketch vòng đầu cho bộ nhận diện`.
2. Bấm `Upload file`.
3. Chọn một file `.jpg`, `.png` hoặc `.pdf` nhỏ hơn hoặc bằng 20 MB.
4. Chờ tên file xuất hiện dưới nút upload.
5. Bấm `Nộp bài`.

Kết quả cần thấy:

- Submission mới có milestone `SKETCH`.
- Submission có status `SUBMITTED`.
- Project chuyển sang `SKETCH_REVIEW`.

**Bước 14 - SME kiểm tra Sketch**

1. Quay lại workspace SME.
2. Bấm `Làm mới`.
3. Kiểm tra next action là `Duyệt Sketch`.
4. Trong bảng `Submission`, bấm tên file để download.
5. Mở file và kiểm tra nội dung.

Kết quả cần thấy: SME download được file Student vừa nộp.

**Bước 15A - Nhánh duyệt nhanh**

Nếu muốn đi thẳng tới Final:

1. SME bấm `Duyệt`.
2. Student quay lại workspace và bấm `Làm mới`.

Kết quả cần thấy:

- Sketch chuyển sang `APPROVED`.
- Student thấy next action `Nộp Final`.

**Bước 15B - Nhánh yêu cầu chỉnh sửa**

Nếu muốn test vòng revision trước:

1. SME bấm `Yêu cầu chỉnh sửa`.
2. Nhập `Nội dung cần sửa`: `Điều chỉnh màu chủ đạo và tăng khoảng cách logo.`
3. Chọn `Hạn nộp lại` trong tương lai.
4. Xác nhận modal.
5. Student bấm `Làm mới`.

Kết quả cần thấy:

- Project chuyển sang `REVISION_REQUESTED`.
- Student thấy feedback trong `Lịch sử review`.
- Student thấy next action `Nộp bản chỉnh sửa`.

**Bước 16 - Student nộp revision**

Chỉ chạy nếu đã chọn bước 15B:

1. Student nhập mô tả: `Đã chỉnh màu và khoảng cách logo`.
2. Bấm `Upload file`, chọn file mới.
3. Bấm `Nộp bài`.
4. SME bấm `Làm mới`, download file revision và bấm `Duyệt`.
5. Student bấm `Làm mới`.

Kết quả cần thấy:

- Revision round tăng để lưu lịch sử.
- Sketch cuối cùng được approve.
- Student thấy next action `Nộp Final`.

#### Chặng 5: Student Nộp Final, Hệ Thống Release Escrow

**Bước 17 - Student nộp Final**

1. Trong workspace Student, nhập mô tả: `Final artwork và file bàn giao`.
2. Bấm `Upload file`.
3. Chọn file Final hợp lệ.
4. Bấm `Nộp bài`.

Kết quả cần thấy:

- Submission mới có milestone `FINAL`.
- Project chuyển sang `FINAL_REVIEW`.

**Bước 18 - SME approve Final**

1. Quay lại workspace SME.
2. Bấm `Làm mới`.
3. Download file Final và kiểm tra.
4. Bấm `Duyệt`.

Kết quả cần thấy ngay:

- Final chuyển sang `APPROVED`.
- Project chuyển sang `COMPLETED`.
- Hệ thống thử release escrow ngay trong luồng hoàn tất.

**Bước 19 - Kiểm tra escrow release**

1. Tại workspace SME hoặc Student, bấm `Làm mới`.
2. Kiểm tra escrow.
3. Nếu vẫn là `RELEASE_PENDING`, chờ tối đa khoảng một phút để hosted worker retry rồi bấm `Làm mới` lại.

Kết quả cần thấy:

- Escrow chuyển sang `RELEASED`.
- Chỉ có một disbursement.
- Chỉ có một wallet transaction `DISBURSEMENT_CREDIT`.

**Bước 20 - Student kiểm tra ví**

1. Tại cửa sổ B, mở `<public-origin>/student/wallet`.
2. Bấm `Làm mới`.
3. Kiểm tra card `Có thể rút`.
4. Kiểm tra bảng `Ledger`.

Kết quả cần thấy:

- Available balance tăng đúng `netAmount`.
- Ledger có transaction `DISBURSEMENT_CREDIT`.
- `netAmount = grossAmount - platformFeeAmount`.
- Có thể mở rộng dòng ledger để xem gross amount, platform fee và net amount.

#### Chặng 6: Withdrawal Manual Smoke

Chỉ chạy khi ví Student có ít nhất `50000 VND`.

**Bước 21 - Student lưu tài khoản nhận tiền**

1. Trong `/student/wallet`, tại card `Phương thức nhận tiền`, nhập:

| Trường UI | Giá trị mẫu |
| --- | --- |
| Ngân hàng | `Vietcombank` |
| Mã ngân hàng | `VCB` |
| Chủ tài khoản | `NGUYEN VAN A` |
| Số tài khoản | `1234567890` |

2. Bấm `Lưu tài khoản`.

Kết quả cần thấy: Student chỉ thấy ngân hàng, chủ tài khoản và số tài khoản đã mask.

**Bước 22 - Student tạo withdrawal**

1. Tại card `Tạo yêu cầu rút tiền`, chọn tài khoản nhận có đầy đủ ngân hàng.
2. Nhập số tiền tối thiểu `50000`.
3. Gửi yêu cầu.

Kết quả cần thấy:

- Withdrawal có status `PENDING`.
- Available balance giảm.
- Locked balance tăng cùng amount.
- Fee rút tiền là `0 VND`, `netAmount = amount`.
- Không thể tạo withdrawal thứ hai khi request hiện tại còn `PENDING` hoặc `PROCESSING`.

**Bước 23 - Admin xử lý thủ công**

1. Tại cửa sổ C, đăng nhập Admin.
2. Mở `<public-origin>/admin/withdrawals`.
3. Tìm withdrawal vừa tạo.
4. Bấm `Nhận xử lý`, kiểm tra withdrawal chuyển sang `PROCESSING`.
5. Chuyển khoản ngoài hệ thống tới đúng ngân hàng, chủ tài khoản, số tài khoản đầy đủ và nội dung chuyển khoản hiển thị trên hàng withdrawal.
6. Bấm `Đã chuyển khoản`, nhập mã giao dịch ngân hàng và thời gian chuyển.

Kết quả cần thấy:

- Withdrawal chuyển `PENDING -> PROCESSING -> COMPLETED`.
- Admin có đủ `Ngân hàng`, `Chủ TK`, `Số TK`, `Số tiền chuyển` và `Nội dung CK`.
- Locked balance giảm.
- Ledger có `WITHDRAWAL_DEBIT`.

#### Chặng 7: Ghi Biên Bản

**Bước 24 - Lưu checkpoint**

1. Ghi lại project ID, offer ID, payment ID và PayOS order code.
2. Chạy SQL tại mục 5.
3. Điền biên bản tại mục 6.
4. Không ghi Client ID, API Key hoặc Checksum Key vào tài liệu hoặc screenshot.

### TC-CORE-01: SME Đăng Project, Student Nhìn Thấy Project

| Bước | Actor | Hành động | Phản hồi cần quan sát | Trạng thái kỳ vọng |
| --- | --- | --- | --- | --- |
| 1 | SME | Đăng nhập và mở `/sme/projects/new`. | Form tạo project hiển thị. | SME session hợp lệ. |
| 2 | SME | Tạo draft project. | Project detail hiển thị trạng thái draft. | Project `DRAFT`. |
| 3 | SME | Publish project. | SME thấy trạng thái đã mở. | Project `OPEN`. |
| 4 | Student | Refresh `/student/projects`. | Project mới xuất hiện trong marketplace. | Student đọc được project `OPEN`. |
| 5 | Student | Mở project detail. | Brief, budget và deadline đúng dữ liệu SME nhập. | Chưa có application. |

API hỗ trợ:

```text
POST /api/v1/projects
POST /api/v1/projects/{projectId}/publish
GET  /api/v1/projects
GET  /api/v1/projects/{projectId}
```

### TC-CORE-02: Student Apply, SME Nhận Application

| Bước | Actor | Hành động | Phản hồi cần quan sát | Trạng thái kỳ vọng |
| --- | --- | --- | --- | --- |
| 1 | Student | Tại project detail, gửi application. | UI báo gửi thành công. | Application `SUBMITTED`. |
| 2 | SME | Refresh `/sme/projects/{projectId}/applications`. | Application của Student xuất hiện. | SME đọc được cover letter và proposed price. |
| 3 | Student | Gửi application lần hai cho cùng project. | API/UI từ chối duplicate apply. | Chỉ có một application. |

API hỗ trợ:

```text
POST /api/v1/projects/{projectId}/applications
GET  /api/v1/projects/{projectId}/applications
```

### TC-CORE-03: SME Gửi Offer, Student Accept

| Bước | Actor | Hành động | Phản hồi cần quan sát | Trạng thái kỳ vọng |
| --- | --- | --- | --- | --- |
| 1 | SME | Chọn application và tạo offer. | UI báo tạo offer thành công. | Offer `WAITING_ACCEPTANCE`; project `OFFER_SELECTED`. |
| 2 | Student | Refresh `/student/offers`. | Offer mới xuất hiện với amount và deadline. | Student thấy đúng offer. |
| 3 | Student | Accept offer. | UI báo chấp nhận thành công. | Offer `ACCEPTED`. |
| 4 | SME | Refresh `/sme/offers`. | Nút thanh toán hoặc workspace khả dụng. | SME có thể bắt đầu PayOS checkout. |

API hỗ trợ:

```text
POST /api/v1/projects/{projectId}/offers
POST /api/v1/offers/{offerId}/accept
POST /api/v1/offers/{offerId}/reject
```

### TC-CORE-04: SME Thanh Toán PayOS Thật, Student Được Bắt Đầu

| Bước | Actor | Hành động | Phản hồi cần quan sát | Trạng thái kỳ vọng |
| --- | --- | --- | --- | --- |
| 1 | SME | Mở `/projects/{projectId}/execution`. | Workspace hiển thị next action `PAY_ESCROW`. | Offer `ACCEPTED`. |
| 2 | SME | Chọn `Mở thanh toán PayOS`. | Checkout PayOS hoặc QR mở ra. | Payment `PENDING`; escrow `PENDING_PAYMENT`; offer `PENDING_PAYMENT`. |
| 3 | SME | Quét QR và chuyển khoản thật giá trị nhỏ. | PayOS chuyển về `/payment/success?paymentId=...`. | Return page chỉ poll backend mỗi 2 giây. |
| 4 | System | PayOS gọi webhook public HTTPS. | Webhook trả HTTP `2xx`. | Signature hợp lệ. |
| 5 | System | Backend xử lý webhook. | Return page chuyển về workspace sau khi backend xác nhận. | Payment `SUCCESS`; escrow `FUNDED`; offer `ACTIVE`; project `IN_PROGRESS`. |
| 6 | Student | Refresh `/student/my-projects`, mở workspace. | Next action là `SUBMIT_SKETCH`. | Student bắt đầu thực hiện project. |

Điểm kiểm soát quan trọng:

- Không sửa payment thành `SUCCESS` chỉ vì trình duyệt quay về return URL.
- Webhook gửi lại không tạo cập nhật trùng.
- Payment `FAILED`, `CANCELLED` hoặc `EXPIRED` không được bắt đầu project.

API hỗ trợ:

```text
POST /api/v1/offers/{offerId}/payment
GET  /api/v1/payments/{paymentId}
POST /api/v1/payments/payos/webhook
GET  /api/v1/projects/{projectId}/workspace
```

### TC-CORE-05: Student Nộp Sketch, SME Approve

| Bước | Actor | Hành động | Phản hồi cần quan sát | Trạng thái kỳ vọng |
| --- | --- | --- | --- | --- |
| 1 | Student | Trong workspace, upload file Sketch jpg/png/pdf tối đa 20 MB. | File upload thành công và hiện trong danh sách. | File metadata được lưu. |
| 2 | Student | Nộp Sketch. | Timeline chuyển sang chờ SME review. | Submission `SKETCH`, status `SUBMITTED`; project `SKETCH_REVIEW`. |
| 3 | SME | Refresh cùng workspace. | Next action `REVIEW_SKETCH`; SME download được file. | SME đọc đúng submission. |
| 4 | SME | Approve Sketch. | Timeline mở bước Final cho Student. | Sketch `APPROVED`; project `IN_PROGRESS`. |
| 5 | Student | Refresh workspace. | Next action `SUBMIT_FINAL`. | Student có thể nộp Final. |

API hỗ trợ:

```text
POST /api/v1/files/submissions
POST /api/v1/projects/{projectId}/submissions
GET  /api/v1/files/{fileId}/download
POST /api/v1/projects/{projectId}/submissions/{submissionId}/approve
```

### TC-CORE-06: SME Yêu Cầu Revision, Student Nộp Lại

Chạy case này trên Sketch hoặc Final trước khi approve.

| Bước | Actor | Hành động | Phản hồi cần quan sát | Trạng thái kỳ vọng |
| --- | --- | --- | --- | --- |
| 1 | SME | Tại submission đang chờ review, chọn yêu cầu chỉnh sửa. | SME nhập nội dung và hạn nộp lại. | Submission `REVISION_REQUESTED`; project `REVISION_REQUESTED`. |
| 2 | Student | Refresh workspace. | Feedback và deadline xuất hiện; next action `SUBMIT_REVISION`. | Student thấy đúng yêu cầu. |
| 3 | Student | Upload file mới và nộp revision. | Timeline quay lại chờ SME review. | Revision round tăng; project trở lại review milestone tương ứng. |
| 4 | SME | Refresh workspace và approve revision. | Milestone được duyệt. | Revision round được lưu để audit. |

SME có thể tiếp tục yêu cầu revision khi cần. Hệ thống lưu revision round để audit nhưng không giới hạn số lần chỉnh sửa.

### TC-CORE-07: SME Báo File Lỗi, Student Upload Lại

| Bước | Actor | Hành động | Phản hồi cần quan sát | Trạng thái kỳ vọng |
| --- | --- | --- | --- | --- |
| 1 | SME | Chọn `Báo file lỗi`, lý do ví dụ `CANNOT_OPEN`, và hạn upload lại. | Review history ghi nhận lý do. | Submission `INVALID_REPORTED`. |
| 2 | Student | Refresh workspace. | Student thấy invalid-file reason và deadline upload lại. | Không mất lịch sử submission cũ. |
| 3 | Student | Upload file hợp lệ và nộp lại. | SME nhận submission mới để review. | Luồng quay lại milestone review. |

### TC-CORE-08: Student Nộp Final, SME Approve, Ví Được Credit

| Bước | Actor | Hành động | Phản hồi cần quan sát | Trạng thái kỳ vọng |
| --- | --- | --- | --- | --- |
| 1 | Student | Upload và nộp Final sau khi Sketch approved. | Timeline chuyển sang chờ Final review. | Submission `FINAL`, status `SUBMITTED`; project `FINAL_REVIEW`. |
| 2 | SME | Refresh workspace, download Final và approve. | Workspace hiển thị hoàn thành. | Final `APPROVED`; project `COMPLETED`; escrow `RELEASE_PENDING`. |
| 3 | System | Hosted worker xử lý escrow release. | Không cần thao tác thủ công. | Escrow `RELEASED`; một disbursement `COMPLETED`. |
| 4 | Student | Refresh `/student/wallet`. | Available balance tăng đúng net amount. | Một transaction `DISBURSEMENT_CREDIT`. |
| 5 | Admin hoặc Swagger | Gọi retry release nếu cần. | Không credit lần hai. | Balance không đổi; không có disbursement trùng. |

Net amount:

```text
netAmount = grossAmount - platformFeeAmount
```

### TC-CORE-09: Withdrawal Manual Smoke

| Bước | Actor | Hành động | Phản hồi cần quan sát | Trạng thái kỳ vọng |
| --- | --- | --- | --- | --- |
| 1 | Student | Tạo payment method ngân hàng. | Chỉ thấy account number đã mask. | Không lưu account number dạng rõ. |
| 2 | Student | Tạo withdrawal tối thiểu `50000 VND`. | Request xuất hiện trong lịch sử. | Available giảm; locked tăng; withdrawal `PENDING`. |
| 3 | Admin | Mở `/admin/withdrawals`, complete request sau chuyển khoản ngoài hệ thống. | Locked balance giảm. | Transaction `WITHDRAWAL_DEBIT`. |
| 4 | Student | Tạo request khác; Admin chọn fail. | Tiền locked quay lại available. | Transaction `WITHDRAWAL_FAILED_REVERSAL`. |

## 4. Negative Cases Tại Điểm Bàn Giao

| ID | Bối cảnh | Thao tác | Kỳ vọng |
| --- | --- | --- | --- |
| NEG-01 | Student chưa verify | Student apply project | Bị chặn. |
| NEG-02 | Student đã apply | Student apply lại cùng project | Bị chặn duplicate. |
| NEG-03 | Student chưa accept offer | SME tạo PayOS payment | Bị chặn. |
| NEG-04 | Browser mở return URL thủ công | Client giả lập payment success | Backend không đổi trạng thái. |
| NEG-05 | Sketch chưa approved | Student nộp Final | Bị chặn. |
| NEG-06 | Upload file `.zip` hoặc file lớn hơn 20 MB | Student upload submission | Bị chặn. |
| NEG-07 | SME không sở hữu project | SME mở workspace hoặc download file | Bị chặn. |
| NEG-08 | Student không được chọn | Student mở workspace project khác | Bị chặn. |
| NEG-09 | Release escrow chạy lại | Worker hoặc Admin retry | Không double credit. |
| NEG-10 | Withdrawal dưới `50000 VND` | Student tạo request | Bị chặn. |

## 5. SQL Checkpoints

Chạy sau các điểm bàn giao chính:

```sql
select id, status, selected_student_profile_id
from projects
where id = '<project-id>';

select id, project_id, student_profile_id, status, offered_amount, payment_due_at
from project_offers
where project_id = '<project-id>'
order by created_at;

select id, escrow_id, status, provider, amount, paid_at
from payments
where escrow_id in (select id from escrows where project_id = '<project-id>')
order by created_at;

select id, project_id, status, amount, funded_at, released_at
from escrows
where project_id = '<project-id>';

select id, project_id, submission_type, milestone_type, revision_round, status, review_due_at
from project_submissions
where project_id = '<project-id>'
order by submitted_at;

select action, comment, requested_changes, invalid_file_reason, due_at, reupload_due_at
from review_actions
where project_id = '<project-id>'
order by created_at;

select escrow_id, gross_amount, platform_fee_amount, net_amount, status
from disbursements
where escrow_id in (select id from escrows where project_id = '<project-id>');

select user_id, available_balance, locked_balance, status
from wallets
where user_id = '<student-user-id>';

select type, amount, balance_after, reference_type, reference_id
from wallet_transactions
where wallet_id = '<wallet-id>'
order by created_at;
```

## 6. Biên Bản Smoke Test

Ghi lại tối thiểu:

| Mục | Giá trị |
| --- | --- |
| Thời gian test | |
| Branch và commit | |
| Public origin | |
| Project ID | |
| Offer ID | |
| Payment ID | |
| PayOS order code | |
| Webhook HTTP status | |
| Project status cuối | |
| Escrow status cuối | |
| Gross amount | |
| Platform fee | |
| Net wallet credit | |
| Retry release có double credit không | |
| Người test SME | |
| Người test Student | |

Không ghi Client ID, API Key hoặc Checksum Key vào biên bản.

## 7. Bổ Sung Kiểm Tra Workspace Nộp Bài

Áp dụng cho route chung `/projects/{projectId}/execution`. Student và SME mở cùng URL nhưng thấy giao diện theo vai trò của mình. Workspace tự poll backend mỗi 5 giây; nút `Làm mới` vẫn dùng được khi cần kiểm tra ngay. Countdown deadline tự cập nhật mỗi phút và hiển thị theo giờ Việt Nam.

### 7.0. Kiểm Tra Bố Cục Và Deadline

1. Mở workspace bằng SME rồi mở lại cùng URL bằng Student.
2. Kiểm tra progress bar có thứ tự `Offer -> Escrow -> Sketch -> Revision -> Final -> Hoàn thành`.
3. Kiểm tra sidebar `Mốc thời gian` hiển thị đầy đủ Sketch, Final và Toàn dự án.
4. Khi có submission chờ review, kiểm tra deadline nổi bật chuyển thành `Hạn SME duyệt bài`.
5. Khi SME yêu cầu chỉnh sửa hoặc báo file lỗi, kiểm tra deadline nổi bật chuyển thành `Hạn Student nộp lại`.

Kết quả cần thấy:

- Mỗi deadline hiển thị cả ngày, giờ và countdown `Còn ...` hoặc `Quá hạn ...`.
- Student và SME thấy cùng dữ liệu deadline nhưng khối action phù hợp với vai trò.
- Dòng thời gian tương tác gộp hiển thị offer, escrow, submission, feedback, approval và release theo thứ tự mới nhất trước.

### 7.1. Student Chọn File Và Xác Nhận Nộp

1. Student mở workspace khi next action là `Nộp Sketch`, `Nộp bản chỉnh sửa` hoặc `Nộp Final`.
2. Bấm `Chọn file`, chọn nhiều file `.jpg`, `.png` hoặc `.pdf`, mỗi file tối đa 20 MB.
3. Kiểm tra draft list hiển thị tên, định dạng, dung lượng và nút xóa từng file.
4. Xóa một file khỏi draft list. File bị xóa không được upload.
5. Bấm `Xác nhận nộp bài`.
6. Kiểm tra modal xác nhận hiển thị đúng milestone, mô tả và danh sách file còn lại.
7. Bấm `Xác nhận nộp`.

Kết quả cần thấy:

- File chỉ được upload sau bước xác nhận.
- Nếu một file upload lỗi, quá trình dừng và thông báo ghi rõ tên file lỗi.
- Sau khi thành công, draft list được xóa và Student thấy trạng thái chờ SME duyệt cùng review deadline.
- File `.zip`, file lớn hơn 20 MB hoặc file giả đuôi có nội dung không khớp định dạng bị chặn.
- File upload thành công nhưng không được gắn vào submission sẽ được worker dọn sau 24 giờ.

### 7.2. SME Xử Lý Bản Mới Nhất

1. SME giữ workspace đang mở sau khi Student nộp bài.
2. Chờ tối đa 5 giây hoặc bấm `Làm mới`.
3. Tại panel `Bản đang chờ duyệt`, kiểm tra milestone, vòng audit, mô tả, thời gian nộp, hạn duyệt, countdown và file download.
4. Download file bằng nút trong panel.
5. Chọn một trong ba action: `Duyệt`, `Yêu cầu chỉnh sửa`, `Báo file lỗi`.

Kết quả cần thấy:

- Panel luôn hiển thị submission `SUBMITTED` hoặc `VALID` mới nhất.
- `Dòng thời gian tương tác` gộp bài nộp và phản hồi, sắp xếp mới nhất trước.
- Polling không xóa draft file hoặc nội dung mô tả Student đang nhập.

### 7.3. Nhánh Báo File Lỗi Và Upload Lại

1. SME bấm `Báo file lỗi`, chọn `CANNOT_OPEN`, nhập mô tả và hạn upload lại.
2. Student chờ tối đa 5 giây hoặc bấm `Làm mới`.
3. Kiểm tra Student thấy next action `Nộp bản chỉnh sửa`, lý do file lỗi và deadline trong `Dòng thời gian tương tác`.
4. Student chọn file mới và xác nhận nộp lại.
5. SME chờ tối đa 5 giây, kiểm tra panel đang chờ duyệt hiển thị bản mới nhất rồi download và duyệt.

Kết quả backend cần thấy:

- Submission cũ giữ status `INVALID_REPORTED`.
- Project chuyển sang `REVISION_REQUESTED`.
- Submission mới có type `REVISION`, giữ cùng milestone Sketch hoặc Final.
- Báo file lỗi kỹ thuật không tăng `current_revision_round`.
- `review_actions` giữ action `REPORT_INVALID_FILE` để audit.

## 8. Regression Sau Core Stabilization

### 8.1. Offer Hết Hạn Trả Application Về Hàng Chờ

1. Tạo offer từ một application và để offer `WAITING_ACCEPTANCE`.
2. Đặt `expires_at` của offer về quá khứ hoặc chờ worker chạy.
3. Kiểm tra offer chuyển `EXPIRED`.
4. Kiểm tra application liên kết trở về `SUBMITTED`, không bị kẹt ở `SELECTED`.
5. Kiểm tra project trở về `OPEN` hoặc `PRIVATE_INVITED` nếu không còn offer active.

### 8.2. Checkout PayOS Hết Hạn Nhưng Offer Vẫn Còn Thời Gian

1. Tạo checkout PayOS nhưng không thanh toán.
2. Đặt `payments.expires_at` về quá khứ hoặc chờ quá 15 phút.
3. Kiểm tra payment chuyển `EXPIRED`, offer chuyển `PAYMENT_FAILED`.
4. Kiểm tra SME vẫn tạo được checkout mới nếu `payment_due_at` 72 giờ chưa hết hạn.
5. Tạo checkout retry mới, giữ một checkout cũ quá hạn và kiểm tra worker không kéo offer mới khỏi `PENDING_PAYMENT`.

### 8.3. Upload Submission Được Harden

1. Upload file `.pdf` thật, tối đa đúng 20 MB: backend chấp nhận.
2. Đổi tên file text hoặc file thực thi thành `.pdf`: backend từ chối vì signature không khớp.
3. Upload file hợp lệ nhưng không submit: worker dọn metadata và file local sau 24 giờ.

### 8.4. Return Page Không Spinner Vô Tận

1. Mở `/payment/success?paymentId=<payment-id>` khi webhook chưa tới.
2. Sau tối đa 60 giây, kiểm tra trạng thái chờ đổi thành cảnh báo.
3. Kiểm tra có nút `Kiểm tra lại` và lối tắt về workspace hoặc danh sách offer.
