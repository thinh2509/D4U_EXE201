# Kịch Bản Demo D4U Cho Giảng Viên

## 1. Mục tiêu của buổi demo

Mục tiêu của buổi demo không chỉ là “chạy được hệ thống”, mà là cho giảng viên thấy rõ:

- D4U giải quyết bài toán gì.
- 3 vai trò `SME - Student - Admin` phối hợp với nhau như thế nào.
- Luồng nghiệp vụ cốt lõi của marketplace có khép kín hay không.
- Phần AI và thanh toán được gắn vào bài toán thật như thế nào.
- Hệ thống đã được làm đến mức nào về UX/UI, tính nhất quán và khả năng mở rộng.

## 2. Cách mở đầu buổi demo

Phần mở đầu nên ngắn, rõ và có cấu trúc:

> D4U là marketplace kết nối SME cần thuê thiết kế với Student Designer.  
> Điểm khác biệt của hệ thống là không chỉ đăng tin và ứng tuyển, mà còn quản lý được toàn bộ vòng đời dự án: tạo brief, ứng tuyển, đề nghị hợp tác, escrow qua PayOS, milestone Sketch/Final, review, giải ngân, portfolio và AI hỗ trợ ra quyết định.

Sau đó nói tiếp:

> Trong buổi demo này em sẽ đi theo đúng hành trình thực tế của sản phẩm:  
> SME đăng dự án, Student tham gia, SME chọn người phù hợp, hệ thống xử lý thanh toán và theo dõi tiến độ, sau cùng hai bên hoàn tất dự án và đánh giá lẫn nhau.

## 3. Chuẩn bị trước khi demo

Trước khi bắt đầu, nên kiểm tra nhanh các điều kiện sau:

### 3.1. Hệ thống đang chạy

- Frontend: `http://localhost:3000`
- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger`

### 3.2. Tài khoản demo nên chuẩn bị sẵn

Theo seed local hiện tại:

- SME demo: `sme.demo@d4u.local`
- Student demo: `student.demo@d4u.local`
- Mật khẩu seed local: `Admin12345`

Nếu có tài khoản Admin riêng theo môi trường, nên đăng nhập thử trước buổi demo để tránh mất thời gian.

### 3.3. Dữ liệu nên có sẵn

Nên chuẩn bị ít nhất:

- 1 SME đã hoàn thiện profile.
- 1 Student đã hoàn thiện profile, skills và portfolio public.
- 1 dự án đang mở.
- 1 ứng tuyển hoặc 1 đề nghị hợp tác mẫu.
- 1 purchase AI đã thành công hoặc 1 trạng thái pending để minh họa billing.
- Nếu demo full flow thanh toán thật, cần kiểm tra PayOS return URL trước.

### 3.4. Nguyên tắc demo

- Không click lan man.
- Mỗi màn hình chỉ nói 1 ý chính.
- Luôn giải thích “vì sao màn hình này tồn tại”, không chỉ “màn hình này có gì”.

## 4. Thứ tự demo khuyến nghị

Thứ tự tốt nhất là:

1. Landing page
2. SME flow
3. Student flow
4. AI features
5. Thanh toán và entitlement
6. Admin flow
7. Kết luận kiến trúc và giá trị MVP

Lý do:

- Giảng viên sẽ hiểu bài toán trước.
- Sau đó thấy nghiệp vụ chính chạy xuyên suốt.
- Cuối cùng mới đi vào AI, billing và quản trị để tăng độ thuyết phục.

## 5. Kịch bản trình bày step by step

## Bước 1. Giới thiệu landing page và bài toán sản phẩm

### Màn hình cần mở

- Trang chủ `/`

### Cách trình bày

Nói theo hướng:

> Đây là landing page giới thiệu rõ định vị của D4U: marketplace thuê Student Designer cho SME.  
> Ngay từ đầu hệ thống nhấn vào 3 điểm: minh bạch, an toàn và hiệu quả.  
> SME có thể đăng brief thật, Student có cơ hội làm dự án thật, còn thanh toán được giữ theo mô hình escrow để hạn chế rủi ro cho cả hai bên.

### Điểm nên highlight

- Layout chia rõ Header, Hero, trust cards, hai vai trò, quy trình 6 bước, bảo chứng và CTA.
- Nội dung thể hiện đúng core value của sản phẩm chứ không chỉ làm landing cho đẹp.
- Đây là public entry giúp người xem hiểu ngay sản phẩm dành cho ai và hoạt động ra sao.

### Câu chốt nên nói

> Sau khi hiểu định vị sản phẩm, em sẽ đi vào luồng sử dụng thật của SME và Student trong hệ thống.

## Bước 2. Demo góc nhìn SME: đây là người thuê thiết kế

### Màn hình cần mở

- Đăng nhập SME
- `/sme/dashboard`

### Cách trình bày

> Đây là dashboard của SME. Mục tiêu của dashboard không phải chỉ để điều hướng, mà là để SME thấy ngay mình đã sẵn sàng vận hành chưa, hôm nay cần xử lý gì và dự án đang ở bước nào.

### Điểm nên highlight

- Readiness/onboarding của SME.
- Khối ưu tiên hành động tiếp theo.
- Metrics theo logic vận hành: dự án, ứng tuyển, offer, trạng thái hồ sơ.
- Workflow 4 bước rõ ràng thay vì một dashboard rời rạc.

### Ý nghĩa nghiệp vụ

> Với SME, hệ thống đóng vai trò như một control center để quản lý pipeline tuyển Student Designer, chứ không chỉ là nơi đăng tin.

## Bước 3. SME tạo dự án mới

### Màn hình cần mở

- `/sme/projects/new`

### Cách trình bày

> SME bắt đầu bằng việc tạo dự án thiết kế. Ở đây hệ thống yêu cầu brief đủ rõ để Student có thể hiểu đúng đầu bài, từ đó giảm tình trạng ứng tuyển mơ hồ.

### Điểm nên highlight

- Tên dự án, category, budget, deadline, brief.
- Phân biệt dự án mở và các trạng thái vận hành.
- Form đã được tối ưu để phục vụ nghiệp vụ thật chứ không phải form mẫu chung chung.

### Nếu muốn ghi điểm thêm

Nói:

> Phần brief càng rõ thì cả AI Matching lẫn AI Proposal càng có dữ liệu chất lượng hơn, nên việc thiết kế form đầu vào rất quan trọng.

## Bước 4. SME xem danh sách “Dự án của tôi”

### Màn hình cần mở

- `/sme/projects`

### Cách trình bày

> Sau khi tạo xong, dự án được đưa vào khu vực quản lý trung tâm của SME. Tại đây em cho giảng viên thấy danh sách dự án không còn là bảng dữ liệu thô, mà là card quản lý có hierarchy rõ: trạng thái, loại dự án, nội dung brief rút gọn, ngân sách, hạn hoàn thành và hành động tiếp theo.

### Điểm nên highlight

- Card SME đã được refine để ngắn gọn, chuyên nghiệp và dễ scan.
- Brief được clamp, tránh card quá cao.
- Action row rõ ràng để đi vào chi tiết hoặc xử lý tiếp.

## Bước 5. SME xem ứng tuyển và đề nghị hợp tác

### Màn hình cần mở

- `/sme/applications`
- `/sme/offers`

### Cách trình bày

> Khi dự án đã mở, Student có thể ứng tuyển. SME cũng có thể chủ động gửi đề nghị hợp tác. Điểm quan trọng là D4U hỗ trợ cả hai chiều, nên hệ thống không bị phụ thuộc vào một kiểu matching duy nhất.

### Điểm nên highlight

- Ứng tuyển là chiều Student chủ động.
- Offer là chiều SME chủ động.
- Điều này làm marketplace linh hoạt hơn với cả hai nhóm người dùng.

## Bước 6. Demo AI Matching của SME

### Màn hình cần mở

- Trang AI Matching của SME cho một dự án

### Cách trình bày

> Đây là tính năng AI trả phí của SME. Thay vì SME phải lọc thủ công toàn bộ danh sách Student, hệ thống tạo ra danh sách gợi ý có xếp hạng, lý do gợi ý và cảnh báo thiếu dữ liệu nếu có.

### Giải thích AI hoạt động dựa trên gì

Nên nói rất rõ:

> AI Matching không chọn ngẫu nhiên. Nó dựa trên dữ liệu thật đang có trong hệ thống như:

- brief dự án
- danh mục thiết kế
- kỹ năng yêu cầu
- ngân sách và bối cảnh dự án
- hồ sơ Student
- kỹ năng Student đã khai báo
- portfolio public
- phần giới thiệu cá nhân
- tín hiệu xác thực hồ sơ

> Từ các dữ liệu đó, hệ thống tạo điểm phù hợp và giải thích vì sao một Student được gợi ý.

### Điểm nên highlight

- Có “lý do gợi ý”, không phải black box hoàn toàn.
- Có cảnh báo thiếu dữ liệu, ví dụ Student chưa có bio hoặc portfolio công khai.
- SME có thể đi tiếp sang xem hồ sơ hoặc gửi đề nghị.

### Câu nói chuyên nghiệp nên dùng

> Bọn em không dùng AI như một lớp trang trí. AI ở đây phục vụ quyết định tuyển chọn và luôn bám vào dữ liệu hồ sơ có thật trong hệ thống.

## Bước 7. Chuyển sang góc nhìn Student

### Màn hình cần mở

- Đăng xuất SME
- Đăng nhập Student
- `/student/dashboard`

### Cách trình bày

> Sau khi xem phía thuê thiết kế, em chuyển sang phía Student Designer. Đây là người đi tìm cơ hội làm dự án thật để xây portfolio, kỹ năng và thu nhập.

### Điểm nên highlight

- Dashboard Student như một workspace hành động.
- Các khu vực quan trọng: profile, portfolio, dự án đang mở, ứng tuyển, billing.
- Header, sidebar và visual đã được đồng bộ hơn với SME.

## Bước 8. Demo hồ sơ và portfolio của Student

### Màn hình cần mở

- `/student/profile`
- `/student/portfolio`

### Cách trình bày

> Một điểm em tối ưu khá mạnh là portfolio. Thay vì bắt Student điền quá nhiều field phức tạp, giờ portfolio đi theo hướng link-first: chỉ cần tiêu đề và URL dự án là đã tạo được item, còn mô tả, category, skills là thông tin bổ sung.

### Điểm nên highlight

- Student tạo portfolio rất nhanh.
- SME có thể bấm vào link để xem ngay.
- Portfolio public vẫn đủ dữ liệu để AI và SME tham khảo.

### Cách giải thích giá trị

> Điều này giảm ma sát nhập liệu cho Student, nhưng vẫn giữ được ngữ cảnh cần thiết cho matching và proposal.

## Bước 9. Demo danh sách dự án mở phía Student

### Màn hình cần mở

- `/student/projects/open`

### Cách trình bày

> Student có thể duyệt các dự án đang mở và đánh giá nhanh xem dự án nào phù hợp. Danh sách này đã được đồng bộ visual tốt hơn với phía SME để toàn hệ thống có cùng ngôn ngữ thiết kế.

### Điểm nên highlight

- Card gọn, đều, dễ so sánh.
- Thấy được title, trạng thái, category, ngân sách, deadline.
- Mỗi card dẫn đến trang chi tiết để ra quyết định ứng tuyển.

## Bước 10. Demo Student ứng tuyển và AI Proposal Writer

### Màn hình cần mở

- Chi tiết dự án phía Student
- Khu vực ứng tuyển / viết proposal

### Cách trình bày

> Đây là AI trả phí dành cho Student. Thay vì viết proposal từ đầu, Student có thể dùng AI Proposal Writer để tạo nháp dựa trên brief dự án và dữ liệu hồ sơ hiện có của mình.

### Giải thích AI hoạt động dựa trên gì

> AI Proposal Writer dùng các nguồn dữ liệu như:

- brief dự án
- category và yêu cầu đầu ra
- hồ sơ Student
- skills đã khai báo
- bio
- portfolio public

> Từ đó hệ thống tạo ra bản nháp proposal. Student vẫn là người kiểm soát nội dung cuối cùng, chỉnh sửa trước khi gửi đi.

### Điểm nên highlight

- AI chỉ hỗ trợ tăng tốc, không thay thế người dùng.
- Nội dung proposal vẫn gắn với dữ liệu có thật.
- Luồng này gắn trực tiếp với feature package trả phí, nên có giá trị kinh doanh rõ ràng.

## Bước 11. Demo khu vực Billing của Student và SME

### Màn hình cần mở

- `/student/billing`
- `/sme/billing`

### Cách trình bày

> D4U không chỉ có AI về mặt kỹ thuật, mà còn có mô hình monetization rõ ràng. Mỗi vai trò có một gói AI riêng với giá trị khác nhau.

### Điểm nên highlight

#### Student

- Gói `AI Proposal Writer`
- Giá hiện tại: `69.000đ / 30 ngày`
- Dùng để tăng tốc viết proposal

#### SME

- Gói `AI Matching`
- Giá hiện tại: `99.000đ / 30 ngày`
- Dùng để mở AI Matching và tăng khả năng vận hành tuyển chọn

### Thông điệp nên nói

> Điểm quan trọng là entitlement chỉ được kích hoạt sau khi thanh toán được xác nhận thành công. Bọn em không mở quyền sớm ở frontend.

## Bước 12. Demo thanh toán và return flow

### Nếu demo live PayOS

Nói:

> Khi người dùng mua gói AI hoặc nạp escrow, hệ thống tạo giao dịch qua PayOS. Sau khi thanh toán xong, frontend nhận return flow và reload trạng thái để cập nhật quyền dùng hoặc trạng thái giao dịch.

### Nếu không demo live

Dùng trạng thái có sẵn và nói:

> Trong local em đã chuẩn bị sẵn purchase history để minh họa các trạng thái như chờ xác nhận, đang hoạt động và đã hết hiệu lực.

### Điểm nên highlight

- Không chỉ có nút “Mua gói”.
- Có purchase history.
- Có reopen payment nếu giao dịch chưa hoàn tất.
- Thông báo đã được Việt hóa và thân thiện hơn.

## Bước 13. Demo luồng chọn Student, milestone và escrow

### Màn hình cần mở

- Chi tiết offer hoặc project detail của SME và Student

### Cách trình bày

> Sau khi SME chọn được Student phù hợp, hệ thống chuyển sang giai đoạn cộng tác thật. Lúc này D4U không dừng ở matching mà tiếp tục quản lý execution theo milestone.

### Điểm nên highlight

- Sketch milestone
- Final milestone
- Review / revision
- Escrow chỉ thực sự có hiệu lực sau xác nhận thanh toán
- Giải ngân diễn ra theo đúng logic hoàn tất

### Ý nghĩa cần nói

> Đây là phần chứng minh D4U là một workflow platform cho dự án thiết kế, không chỉ là bảng tin tuyển cộng tác viên.

## Bước 14. Demo đánh giá sau dự án

### Màn hình cần mở

- Rating / completed project flow nếu đã có sẵn dữ liệu

### Cách trình bày

> Sau khi dự án hoàn tất, hai bên có thể đánh giá lẫn nhau. Điều này tạo tín hiệu chất lượng cho marketplace và cũng là dữ liệu tham khảo cho các lần matching tiếp theo.

## Bước 15. Demo góc nhìn Admin

### Màn hình cần mở

- `/admin/dashboard`
- các màn quản lý liên quan nếu có seed phù hợp

### Cách trình bày

> Ngoài hai vai trò chính là SME và Student, hệ thống còn có Admin để kiểm soát chất lượng marketplace.

### Điểm nên highlight

- Duyệt xác thực Student
- Theo dõi dashboard quản trị
- Kiểm soát portfolio hoặc dữ liệu quan trọng
- Hỗ trợ các flow tài chính/thanh toán thủ công trong phạm vi MVP

### Câu chốt

> Như vậy marketplace không vận hành hoàn toàn “thả nổi”, mà có lớp quản trị để đảm bảo niềm tin cho hệ thống.

## 6. Nếu giảng viên hỏi “AI trong hệ thống này thật sự làm gì?”

Bạn có thể trả lời ngắn gọn như sau:

> Hệ thống có 2 nhóm AI chính.

### 6.1. AI Matching cho SME

- Dùng để gợi ý Student phù hợp cho một dự án.
- Dựa trên brief, category, skills, portfolio public, bio, mức độ xác thực và tín hiệu hồ sơ hiện có.
- Trả về danh sách xếp hạng kèm lý do gợi ý và cảnh báo dữ liệu thiếu.

### 6.2. AI Proposal Writer cho Student

- Dùng để tạo nháp proposal cho một dự án cụ thể.
- Dựa trên brief dự án và dữ liệu hồ sơ/portfolio/skills của Student.
- Mục tiêu là tăng tốc viết proposal, không thay thế việc ra quyết định của người dùng.

## 7. Nếu giảng viên hỏi “điểm mạnh kỹ thuật của hệ thống là gì?”

Có thể trả lời:

- Backend tách theo `Controller - Application - Domain - Infrastructure`.
- Có phân vai rõ `Student - SME - Admin`.
- Có payment flow thật qua PayOS.
- Có entitlement cho feature package AI.
- Có portfolio, dashboard, project lifecycle và rating gắn thành một vòng đời khép kín.
- Frontend đã được refine lại theo hướng production-ready hơn: landing page, dashboard, billing, portfolio, project cards, header identity.

## 8. Phương án demo an toàn nếu live flow lỗi

Nếu sợ mạng, cổng thanh toán hoặc dữ liệu phát sinh lỗi, nên chuẩn bị phương án B:

### Phương án A: demo live

- Tạo project
- Student ứng tuyển
- Chạy AI
- Mua gói
- Show state update

### Phương án B: demo theo state đã seed

- Mở sẵn project đã có dữ liệu
- Mở sẵn billing có lịch sử giao dịch
- Mở sẵn AI Matching result
- Mở sẵn portfolio public

Nên nói trung thực:

> Để tiết kiệm thời gian của buổi bảo vệ, em sẽ dùng một số dữ liệu đã chuẩn bị sẵn để minh họa những trạng thái quan trọng nhất của hệ thống.

## 9. Cách kết thúc buổi demo

Phần kết nên ngắn và chắc:

> Tóm lại, D4U giải quyết bài toán kết nối SME với Student Designer theo một luồng trọn vẹn: tìm nhu cầu, đăng dự án, chọn người phù hợp, hỗ trợ bằng AI, thanh toán an toàn và quản lý execution đến khi hoàn tất.  
> Điểm bọn em muốn chứng minh không chỉ là viết được nhiều màn hình, mà là đã xây được một MVP có logic nghiệp vụ rõ, monetization rõ và có khả năng mở rộng tiếp.

## 10. Gợi ý phân bổ thời gian demo

- 1 phút: mở đầu bài toán
- 2 phút: landing page và định vị sản phẩm
- 4 phút: SME flow
- 4 phút: Student flow
- 2 phút: AI + Billing
- 2 phút: Admin + kết luận

Tổng thời gian đẹp nhất: khoảng `12 - 15 phút`.

## 11. Checklist trước khi bước vào phòng demo

- Chạy lại hệ thống trước ít nhất 15 phút.
- Đăng nhập thử SME và Student.
- Mở sẵn các tab quan trọng.
- Kiểm tra dữ liệu AI Matching và portfolio public.
- Kiểm tra billing page của cả 2 role.
- Nếu demo payment live, test return URL trước.
- Tắt bớt tab/notification không liên quan.
- Chuẩn bị sẵn câu trả lời cho 3 câu hỏi thường gặp:
  - AI dựa trên dữ liệu gì?
  - Vì sao dùng escrow?
  - MVP này khác gì so với một job board thông thường?

## 12. Câu trả lời ngắn cho 3 câu hỏi thường gặp

### D4U khác gì so với nền tảng đăng tin tuyển cộng tác viên?

> D4U đi xa hơn đăng tin. Hệ thống quản lý cả pipeline từ tạo dự án, matching, ứng tuyển, đề nghị hợp tác, escrow, milestone, review và rating.

### Vì sao phải có escrow?

> Vì dự án thiết kế dễ phát sinh rủi ro về cam kết và thanh toán. Escrow giúp chỉ bắt đầu execution khi giao dịch đã được xác nhận, đồng thời tạo niềm tin cho cả SME và Student.

### AI có “bịa” không?

> Bọn em thiết kế AI bám trên dữ liệu thật của hồ sơ, kỹ năng, portfolio và brief. Hệ thống cũng hiển thị lý do gợi ý hoặc cảnh báo thiếu dữ liệu để người dùng không phụ thuộc mù quáng vào AI.

