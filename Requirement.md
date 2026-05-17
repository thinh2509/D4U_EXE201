# D4U Requirement Specification

## 1. Tong quan

### 1.1. Ten he thong

D4U - Design 4 You.

### 1.2. Muc tieu san pham

D4U la nen tang marketplace ket noi sinh vien thiet ke voi doanh nghiep vua va nho (SME) co nhu cau thue thiet ke theo du an. He thong ho tro SME dang brief, chon designer, thanh toan qua escrow, theo doi tien do theo milestone, duyet san pham, xu ly tranh chap, giai ngan cho designer, danh gia hai chieu va quan ly uy tin nguoi dung.

### 1.3. Pham vi

He thong bao gom:

- Quan ly tai khoan Student, SME va Admin.
- Ho so sinh vien thiet ke, ky nang, phan mem, portfolio va xac minh sinh vien.
- Ho so SME, goi subscription va gioi han dang du an.
- Dang du an thiet ke dang open hoac private.
- Ung tuyen, offer, chap nhan offer va khoi tao escrow.
- Thanh toan, refund, giai ngan, vi va rut tien.
- Quy trinh thuc hien du an theo 2 milestone: Sketch va Final.
- Upload file, watermark file, bao loi file khong hop le.
- Yeu cau sua doi, duyet san pham va tu dong duyet theo thoi han.
- Binh luan trong du an va dinh kem file.
- Mo, xu ly, ra quyet dinh va khang nghi tranh chap.
- Danh gia, diem uy tin, canh bao nguoi dung.
- Thong bao, audit log, cau hinh he thong va goi y AI.

### 1.4. Gia dinh va rang buoc

- Database muc tieu: PostgreSQL.
- Don vi tien te mac dinh: VND.
- Thanh toan MVP tich hop mot trong cac cong thanh toan noi dia nhu PayOS hoac VNPAY.
- File duoc phep: jpg, jpeg, png, webp, pdf, zip, fig, ai, psd, svg.
- Gioi han file: toi da 100 MB moi file va 1 GB moi du an.
- Rating chi duoc thuc hien trong 7 ngay sau khi du an hoan thanh.
- Moi nguoi dung trong mot tranh chap chi duoc khang nghi 1 lan trong 48 gio sau quyet dinh.
- Diem uy tin ban dau la 100 va nam trong khoang 0 den 100.

## 2. Actor

### 2.1. Guest

Nguoi chua dang nhap. Co the xem trang gioi thieu, dang ky, dang nhap va tim hieu thong tin cong khai.

### 2.2. Student Designer

Sinh vien thiet ke nhan du an. Co the tao ho so, khai bao ky nang, dang portfolio, ung tuyen du an open, nhan private offer, nop sketch/final, xu ly yeu cau sua doi, nhan tien vao vi, rut tien va danh gia SME.

### 2.3. SME

Doanh nghiep thue thiet ke. Co the tao ho so doanh nghiep, mua/goi subscription, dang du an, moi designer rieng, chon ung vien, thanh toan escrow, review submission, yeu cau sua doi, bao file khong hop le, mo tranh chap va danh gia designer.

### 2.4. Admin

Nguoi van hanh nen tang. Co the duyet xac minh sinh vien, quan ly danh muc, quan ly tranh chap, canh bao/khoa tai khoan, dieu chinh giao dich, cau hinh he thong, theo doi audit log va ho tro tai chinh.

## 3. Trang thai chinh

### 3.1. Tai khoan

- `PENDING`: tai khoan moi tao, chua hoan tat xac minh hoac onboarding.
- `ACTIVE`: tai khoan duoc su dung binh thuong.
- `SUSPENDED`: tam khoa do vi pham hoac can xem xet.
- `BANNED`: cam su dung nen tang.
- `DELETED`: da xoa mem.

### 3.2. Du an

- `DRAFT`: SME dang tao brief, chua publish.
- `OPEN`: du an cong khai, student co the ung tuyen.
- `PRIVATE_INVITED`: du an rieng da moi mot student.
- `OFFER_SELECTED`: SME da chon student/offer.
- `PAYMENT_SECURED`: SME da thanh toan thanh cong vao escrow.
- `WAITING_FOR_ACCEPTANCE`: cho student chap nhan offer sau khi tien duoc dam bao.
- `IN_PROGRESS`: du an dang thuc hien.
- `SKETCH_SUBMITTED`: student da nop sketch.
- `SKETCH_IN_REVIEW`: SME dang review sketch.
- `REVISION_REQUESTED`: SME yeu cau sua doi.
- `FINAL_SUBMITTED`: student da nop final.
- `FINAL_IN_REVIEW`: SME dang review final.
- `COMPLETED`: final duoc duyet, du an hoan thanh.
- `FUNDS_AVAILABLE`: tien da san sang ghi co/giai ngan cho student.
- `CANCELLED`: du an bi huy.
- `DISPUTED`: du an dang tranh chap.

### 3.3. Escrow

- `PENDING_PAYMENT`: cho SME thanh toan.
- `FUNDED`: tien da vao escrow.
- `RELEASE_PENDING`: cho xu ly giai ngan.
- `RELEASED`: da giai ngan.
- `REFUNDED`: da hoan tien.
- `PARTIALLY_REFUNDED`: hoan tien mot phan.
- `DISPUTED`: tien bi giu do tranh chap.
- `CANCELLED`: escrow bi huy.

## 4. Quy trinh nghiep vu tong quat

### 4.1. Open project

1. SME tao du an o trang thai `DRAFT`.
2. SME nhap brief, category, budget, deadline sketch/final, so vong sua toi da, file dinh kem va tuy chon bao mat.
3. He thong kiem tra gioi han subscription cua SME.
4. SME publish, du an chuyen sang `OPEN`.
5. Student xem danh sach du an va gui application gom gia de xuat, cover letter va thoi gian du kien.
6. SME chon mot application va tao offer.
7. SME thanh toan escrow.
8. Student chap nhan offer.
9. Du an chuyen sang `IN_PROGRESS`, he thong tao milestone Sketch va Final.

### 4.2. Private project

1. SME tao du an loai `PRIVATE`.
2. SME chon student can moi.
3. He thong tao offer private.
4. SME thanh toan escrow truoc khi student chap nhan.
5. Student chap nhan hoac tu choi offer.
6. Neu chap nhan, du an chuyen sang `IN_PROGRESS`.

### 4.3. Milestone Sketch

1. Student nop sketch truoc `sketch_deadline_at`.
2. He thong luu submission, file goc va file watermark neu can.
3. Du an chuyen sang `SKETCH_IN_REVIEW`.
4. SME co the:
   - Duyet sketch.
   - Yeu cau sua doi.
   - Bao file khong hop le.
   - Mo tranh chap.
5. Neu qua han review ma SME khong phan hoi, he thong co the tu dong duyet theo cau hinh.

### 4.4. Milestone Final

1. Sau khi sketch duoc duyet, student nop final truoc `final_deadline_at`.
2. SME review final.
3. SME co the duyet, yeu cau sua doi, bao file khong hop le hoac mo tranh chap.
4. Khi final duoc duyet, du an chuyen sang `COMPLETED`.
5. He thong tinh platform fee, chuyen tien net vao vi student va cap nhat escrow.

### 4.5. Sua doi

1. SME tao revision request gan voi submission.
2. Revision request phai nam trong `max_revision_rounds`.
3. Student nop lai file theo han `due_at`.
4. SME review lai submission moi.
5. Neu qua so vong sua hoac qua han, he thong ap dung quy tac xu ly theo cau hinh hoac mo tranh chap.

### 4.6. Bao file khong hop le

1. SME bao file loi voi ly do: file rong, khong mo duoc, sai dinh dang, khong lien quan, link hong hoac ly do khac.
2. He thong tao invalid file report va dat han upload lai.
3. Student upload lai file.
4. SME/Admin xac nhan chap nhan hoac tu choi.
5. Neu khong dong thuan, hai ben co the mo tranh chap.

### 4.7. Tranh chap

1. Student hoac SME mo tranh chap trong du an.
2. Escrow va du an chuyen sang trang thai tranh chap.
3. Hai ben nop bang chung.
4. Admin duoc gan xu ly, xem brief, submission, binh luan, file va lich su trang thai.
5. Admin ra quyet dinh: hoan tien SME, tra tien student, chia tien mot phan, giu platform fee hoac ket hop cac phuong an.
6. He thong tao refund/disbursement tuong ung.
7. Moi ben co toi da 1 lan khang nghi trong 48 gio.

## 5. Yeu cau chuc nang

### 5.1. Xac thuc va phien dang nhap

- He thong phai cho phep dang ky bang email/password.
- He thong phai ho tro dang nhap bang provider ben ngoai, toi thieu Google neu duoc cau hinh.
- He thong phai luu password duoi dang hash, khong luu plain text.
- He thong phai tao refresh session rieng theo thiet bi.
- He thong phai cho phep revoke session khi dang xuat.
- He thong phai ghi nhan thoi diem dang nhap gan nhat.
- He thong phai phan quyen theo role: Student, SME, Admin.

### 5.2. Quan ly tai khoan

- Nguoi dung phai co email, username va full name duy nhat theo quy dinh.
- Nguoi dung co the cap nhat anh dai dien va thong tin ca nhan.
- Admin co the tam khoa, cam hoac khoi phuc tai khoan.
- He thong phai ngan nguoi dung `SUSPENDED`, `BANNED`, `DELETED` thuc hien hanh dong nghiep vu.

### 5.3. Ho so Student

- Student phai tao ho so gom truong, nganh, nam bat dau hoc va gioi thieu.
- Student co the khai bao ky nang thiet ke va muc thanh thao.
- Student co the khai bao phan mem su dung va muc thanh thao.
- Student co the them portfolio cong khai hoac rieng tu.
- Portfolio co the gan voi file upload hoac du an da hoan thanh.
- He thong phai luu level cua student: Student, Advanced, Junior, Senior.
- He thong phai tinh rating trung binh va so du an hoan thanh.
- He thong phai quan ly trang thai rut tien cua student qua `can_withdraw`.

### 5.4. Xac minh Student

- Student co the nop tai lieu xac minh sinh vien.
- Admin co the duyet hoac tu choi ho so xac minh.
- Khi tu choi, Admin phai nhap ly do.
- He thong phai ghi nhan nguoi duyet va thoi diem duyet.
- Trang thai xac minh phai anh huong den quyen ung tuyen hoac nhan tien neu cau hinh yeu cau.

### 5.5. Ho so SME

- SME phai tao ho so gom ten cong ty, nguoi dai dien, so dien thoai va linh vuc kinh doanh.
- SME co the tai logo cong ty.
- He thong phai theo doi rating trung binh, so du an hoan thanh, so du an open dang hoat dong va diem uy tin.
- SME chi duoc dang du an khi hoan tat onboarding toi thieu.

### 5.6. Goi subscription

- He thong phai co cac goi Basic, Pro va Premium.
- Moi goi quy dinh phi hang thang, ty le platform fee, gioi han so du an open, gioi han budget va quyen dung AI.
- Basic mac dinh: 0 VND/thang, platform fee 10%, toi da 2 du an open, budget toi da 5.000.000 VND.
- Pro mac dinh: 199.000 VND/thang, platform fee 7%, toi da 10 du an open, budget toi da 20.000.000 VND.
- Premium mac dinh: 499.000 VND/thang, platform fee 5%, khong gioi han neu cau hinh null.
- He thong phai kiem tra subscription truoc khi publish du an.
- He thong phai ghi nhan thanh toan subscription neu goi co phi.

### 5.7. Danh muc thiet ke

- Admin co the tao, sua, tat/bat danh muc thiet ke.
- SME chi duoc chon danh muc dang active.
- Student co the loc du an theo danh muc.

### 5.8. Tao va quan ly du an

- SME co the tao du an voi title, brief, usage purpose, category, budget, deadline va loai du an.
- He thong phai bat buoc `brief`, `budget_amount`, `sketch_deadline_at`, `final_deadline_at`, `total_deadline_at`.
- Deadline sketch phai truoc hoac bang deadline final.
- Deadline final phai truoc hoac bang total deadline.
- Budget phai lon hon 0 va khong vuot gioi han goi subscription.
- SME co the dat du an bao mat bang `is_confidential`.
- SME co the quyet dinh co cho phep student dua san pham vao portfolio hay khong.
- Du an co the dinh kem file brief/reference.
- He thong phai ghi lich su moi lan thay doi trang thai du an.

### 5.9. Tim kiem va ung tuyen du an

- Student co the xem danh sach du an `OPEN`.
- Student co the loc theo danh muc, budget, deadline, ky nang lien quan va trang thai.
- Student co the ung tuyen mot lan cho moi du an.
- Application phai co gia de xuat va cover letter.
- Student co the xem trang thai application cua minh.
- SME co the xem danh sach application cua du an.
- SME co the loc/sap xep application theo rating, portfolio, gia de xuat va thoi gian.

### 5.10. Offer va chap nhan

- SME co the tao offer cho student tu application hoac moi rieng.
- Offer phai co so tien, han het hieu luc va trang thai.
- Offer ban dau o `PENDING_PAYMENT`.
- Sau khi thanh toan thanh cong, offer chuyen `WAITING_ACCEPTANCE`.
- Student co the chap nhan hoac tu choi offer.
- Offer het han phai chuyen `EXPIRED`.
- SME co the revoke offer neu student chua chap nhan va theo quy tac he thong.

### 5.11. Milestone va submission

- Moi du an dang thuc hien phai co 2 milestone: Sketch va Final.
- Student chi duoc nop submission cho du an ma minh duoc chon.
- Submission phai gan voi milestone va co loai Sketch, Final hoac Revision.
- He thong phai luu revision round cho moi submission.
- Submission co the gom nhieu file.
- File final goc chi duoc cho download khi du an duoc phe duyet hoac theo quy tac escrow.
- He thong co the tao file watermark de SME review truoc khi duyet.

### 5.12. Review submission

- SME la reviewer mac dinh cua submission.
- SME co the duyet sketch, duyet final, yeu cau sua, bao file khong hop le hoac mo tranh chap.
- Moi review action phai duoc ghi nhan voi action, reviewer, comment va thoi diem.
- He thong phai cap nhat trang thai milestone, submission va project theo action.
- He thong phai ho tro auto-approve khi qua han review theo cau hinh.

### 5.13. Binh luan du an

- Student va SME trong du an co the binh luan.
- Binh luan co the tra loi binh luan khac.
- Binh luan co the dinh kem file.
- He thong phai ho tro xoa mem binh luan.
- He thong phai luu original content de phuc vu kiem duyet/audit neu can.
- He thong phai co moderation status cho binh luan.

### 5.14. Quan ly file

- Moi file phai luu owner, storage provider, storage key, ten goc, mime type, extension, size va checksum neu co.
- File phai co visibility: private hoac cac muc cau hinh khac.
- He thong phai quet virus/malware neu co tich hop scanner.
- He thong phai tu choi extension khong nam trong danh sach cho phep.
- He thong phai tu choi file vuot qua gioi han dung luong.
- Xoa file la xoa mem bang `deleted_at`.

### 5.15. Escrow va thanh toan

- Khi SME chon student, he thong phai tao escrow cho du an.
- SME phai thanh toan du so tien vao escrow truoc khi du an bat dau.
- Payment phai ghi provider, provider transaction id, amount, currency va status.
- Provider transaction id phai duy nhat theo provider.
- Khi payment thanh cong, escrow chuyen `FUNDED`.
- He thong phai tinh platform fee dua tren subscription plan tai thoi diem escrow.
- He thong phai khong cho giai ngan khi escrow chua funded hoac dang disputed.

### 5.16. Hoan tien va giai ngan

- Khi du an hoan thanh, he thong tao disbursement cho student.
- Gross amount la tong tien escrow.
- Platform fee amount la phi nen tang.
- Net amount la so tien student nhan.
- He thong phai ghi co vao vi student thong qua wallet transaction.
- Khi huy du an hoac tranh chap co quyet dinh hoan tien, he thong tao refund.
- Refund co the toan phan hoac mot phan.
- Tat ca giao dich phai co trang thai de doi soat.

### 5.17. Vi va rut tien

- Moi student co the co mot vi tien VND.
- Vi gom available balance, pending balance va locked balance.
- Student co the them phuong thuc nhan tien dang tai khoan ngan hang.
- He thong phai mask so tai khoan, khong hien thi day du thong tin nhay cam.
- So tien rut toi thieu: 50.000 VND.
- Phi rut tien mac dinh: 5.000 VND.
- Yeu cau rut tien phai co status va thoi gian xu ly.
- Thoi gian xu ly muc tieu: 1 den 3 ngay lam viec.
- Khi rut tien that bai, he thong phai hoan lai so du bang transaction loai `WITHDRAWAL_FAILED_REVERSAL`.

### 5.18. Tranh chap va khang nghi

- Student hoac SME co the mo tranh chap khi du an dang thuc hien, review, revision hoac lien quan escrow.
- Tranh chap phai co reason code va description.
- He thong phai gan first response due date va decision due date theo cau hinh.
- Admin co the gan tranh chap cho chinh minh hoac admin khac.
- Cac ben co the nop bang chung dang file hoac comment.
- Admin phai nhap rationale khi ra quyet dinh.
- Quyet dinh phai xac dinh so tien hoan SME, tra student va phi platform.
- He thong phai thuc thi quyet dinh qua refund/disbursement.
- Khang nghi chi duoc nop mot lan moi nguoi dung moi dispute.

### 5.19. Danh gia va uy tin

- Sau khi du an completed, Student va SME co the danh gia lan nhau.
- Moi cap rater/rated/project chi co mot rating.
- Rating value phai tu 1 den 5.
- Comment toi da 500 ky tu.
- Rating co the public hoac private theo quy tac moderation.
- He thong phai cap nhat average rating va completed projects count.
- He thong phai ghi reputation event moi khi diem uy tin thay doi.
- Admin co the tao warning va dieu chinh diem uy tin neu co ly do.

### 5.20. Thong bao

- He thong phai tao notification cho cac su kien quan trong:
  - Dang ky/xac minh tai khoan.
  - Application moi.
  - Offer moi, offer duoc chap nhan/tu choi/het han.
  - Payment thanh cong/that bai.
  - Submission moi.
  - Review action, revision request, invalid file report.
  - Dispute, decision, appeal.
  - Giai ngan, refund, rut tien.
  - Rating due va rating received.
- Notification co the qua in-app, email hoac push.
- He thong phai luu status pending, sent, failed, read.

### 5.21. Audit log

- He thong phai ghi audit log cho hanh dong quan trong va hanh dong admin.
- Audit log phai co actor, action, entity type, entity id, before/after json, IP va user agent neu co.
- Audit log khong duoc sua/xoa qua giao dien thong thuong.

### 5.22. Cau hinh he thong

- Admin co the quan ly system configuration dang key-value.
- Moi cau hinh phai co type, description va trang thai active.
- Cac rule nen cau hinh duoc gom:
  - allowed file extensions.
  - max file size.
  - max project storage.
  - review window hours.
  - revision due hours.
  - invalid file reupload hours.
  - withdrawal fee.
  - minimum withdrawal amount.
  - dispute SLA.
  - rating window days.

### 5.23. AI recommendation

- He thong co the tao goi y student phu hop cho moi project.
- Moi recommendation phai co score, rank, ly do dang JSON va model version.
- SME co goi Pro/Premium hoac goi co `ai_features_enabled` moi duoc dung tinh nang AI neu quy dinh.
- Recommendation chi mang tinh tham khao, SME van phai tu chon student.

## 6. Yeu cau giao dien

### 6.1. Student

- Dashboard hien thi du an dang lam, submission can nop, revision dang mo, so du vi va thong bao.
- Man hinh tim du an co filter ro rang theo danh muc, budget, deadline va loai du an.
- Man hinh chi tiet du an hien brief, file dinh kem, timeline, budget, trang thai va nut ung tuyen.
- Man hinh workspace du an hien milestone, comment, submission, revision va tranh chap.
- Man hinh vi hien so du, lich su giao dich, phuong thuc thanh toan va rut tien.
- Man hinh portfolio cho phep quan ly tac pham public/private.

### 6.2. SME

- Dashboard hien thi du an dang mo, application moi, submission cho review, dispute va subscription.
- Man hinh tao du an can co form theo tung buoc de nhap brief, file, budget, deadline, privacy va publish.
- Man hinh quan ly application can so sanh candidate theo gia, rating, portfolio va cover letter.
- Man hinh review submission can cho xem file/watermark, approve, request revision, report invalid file va open dispute.
- Man hinh billing hien goi subscription, han muc, lich su thanh toan va escrow.

### 6.3. Admin

- Dashboard van hanh hien tai khoan pending, student verification, dispute open, payment/refund can xu ly va warning.
- Man hinh dispute case phai gom timeline, evidence, submission, comment, escrow va cong cu ra quyet dinh.
- Man hinh cau hinh he thong cho phep cap nhat rule an toan.
- Man hinh audit cho phep tim kiem theo actor, action, entity va thoi gian.

## 7. Quyen truy cap

| Chuc nang | Guest | Student | SME | Admin |
| --- | --- | --- | --- | --- |
| Dang ky/dang nhap | Co | Co | Co | Co |
| Tao ho so student | Khong | Co | Khong | Quan ly |
| Tao ho so SME | Khong | Khong | Co | Quan ly |
| Dang du an | Khong | Khong | Co | Quan ly |
| Ung tuyen du an | Khong | Co | Khong | Xem |
| Tao offer | Khong | Khong | Co | Xem/ho tro |
| Thanh toan escrow | Khong | Khong | Co | Xem/ho tro |
| Nop submission | Khong | Co | Khong | Xem |
| Review submission | Khong | Khong | Co | Xem/ho tro |
| Rut tien | Khong | Co | Khong | Xu ly/ho tro |
| Mo tranh chap | Khong | Co | Co | Tao ho tro |
| Xu ly tranh chap | Khong | Khong | Khong | Co |
| Quan ly cau hinh | Khong | Khong | Khong | Co |

## 8. Quy tac nghiep vu

- BR-001: Mot user chi co mot role chinh trong he thong.
- BR-002: Mot user Student chi co mot `student_profile`.
- BR-003: Mot user SME chi co mot `sme_profile`.
- BR-004: Mot project chi co toi da mot selected student.
- BR-005: Mot project chi co mot escrow.
- BR-006: Student khong duoc ung tuyen cung mot project qua mot lan.
- BR-007: SME khong duoc publish project neu vuot gioi han active open project cua plan.
- BR-008: SME khong duoc publish project neu budget vuot `max_project_budget` cua plan.
- BR-009: Project chi duoc bat dau khi escrow funded va student chap nhan offer.
- BR-010: Student chi duoc nop submission cho project ma minh la selected student.
- BR-011: Final chi duoc duyet sau khi Sketch duoc duyet, tru truong hop Admin override theo dispute.
- BR-012: So vong revision khong duoc vuot `max_revision_rounds`.
- BR-013: File goc final khong duoc mo download truoc khi co quy tac release hop le.
- BR-014: Payment provider transaction id phai duy nhat theo provider.
- BR-015: Wallet balance khong duoc am.
- BR-016: Rut tien chi duoc thuc hien khi student duoc phep rut va vi dang active.
- BR-017: Dispute dang open phai khoa giai ngan escrow.
- BR-018: Rating chi duoc tao trong rating window sau khi project completed.
- BR-019: Diem reputation phai nam trong khoang 0 den 100.
- BR-020: Tat ca thay doi trang thai project phai duoc ghi vao history.

## 9. Yeu cau phi chuc nang

### 9.1. Bao mat

- Mat khau phai duoc hash bang thuat toan manh nhu bcrypt hoac Argon2.
- API phai kiem tra authentication va authorization tren moi endpoint bao ve.
- File private phai duoc truy cap bang signed URL hoac co che tuong duong.
- Thong tin tai khoan ngan hang phai duoc token hoa hoac luu duoi dang masked neu co the.
- He thong phai co rate limit cho dang nhap, upload file va tao payment.
- He thong phai ghi audit log cho hanh dong nhay cam.

### 9.2. Tin cay va nhat quan du lieu

- Cac thao tac payment, escrow, wallet va disbursement phai chay trong transaction hoac co co che idempotency.
- Webhook thanh toan phai idempotent.
- He thong phai co retry cho notification va webhook xu ly that bai.
- Trang thai project, milestone, submission va escrow phai nhat quan theo state machine.

### 9.3. Hieu nang

- Danh sach du an, application, notification va transaction phai ho tro phan trang.
- Cac truong loc chinh phai co index phu hop.
- Upload/download file lon phai di qua object storage, khong di qua memory cua application server neu khong can.

### 9.4. Kha nang mo rong

- He thong phai tach ro module account, project, payment, wallet, dispute, notification va admin.
- Payment provider phai co interface de thay PayOS/VNPAY bang provider khac.
- Notification channel phai mo rong duoc them email/push/SMS.
- AI recommendation phai luu model version de doi soat ket qua.

### 9.5. Kha dung va van hanh

- He thong phai log loi application va loi webhook.
- He thong phai co dashboard theo doi payment pending, withdrawal pending, dispute SLA va failed notification.
- He thong phai backup database dinh ky.
- He thong phai co migration database co version.

### 9.6. Tuan thu va rieng tu

- Nguoi dung phai biet file nao co the duoc dung lam portfolio.
- Du an confidential khong duoc hien thi cong khai va khong duoc dua vao portfolio neu SME khong cho phep.
- Du lieu da xoa nen duoc xoa mem de phuc vu audit, tru khi co yeu cau xoa vinh vien theo chinh sach rieng tu.

## 10. Du lieu khoi tao

### 10.1. Subscription plans

| Code | Ten | Gia thang | Platform fee | Gioi han open project | Gioi han budget | AI |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| BASIC | Basic | 0 | 10% | 2 | 5.000.000 | Khong |
| PRO | Pro | 199.000 | 7% | 10 | 20.000.000 | Co |
| PREMIUM | Premium | 499.000 | 5% | Khong gioi han | Khong gioi han | Co |

### 10.2. Design categories goi y

- Logo design.
- Brand identity.
- Social media post.
- Poster/banner.
- Packaging.
- Website/app UI.
- Illustration.
- Presentation.

### 10.3. Design skills goi y

- Branding.
- Typography.
- Layout.
- Illustration.
- UI design.
- Motion graphics.
- Packaging design.
- Photo editing.

### 10.4. Design softwares goi y

- Figma.
- Adobe Illustrator.
- Adobe Photoshop.
- Adobe InDesign.
- Canva.
- Procreate.
- Blender.

## 11. Tieu chi chap nhan MVP

- Guest co the dang ky va dang nhap thanh cong.
- Student va SME co the tao ho so rieng.
- SME Basic co the tao va publish toi da 2 open project trong gioi han budget.
- Student co the xem project open va gui application.
- SME co the chon application, tao offer va thanh toan escrow thanh cong qua payment sandbox.
- Student co the chap nhan offer va bat dau du an.
- Student co the nop sketch va final voi file hop le.
- SME co the duyet, yeu cau sua, bao file loi hoac mo tranh chap.
- Khi final duoc duyet, escrow duoc release, platform fee duoc tinh va tien net vao vi student.
- Student co the tao withdrawal request hop le.
- Hai ben co the danh gia nhau trong 7 ngay sau completed.
- Admin co the duyet xac minh student, xem audit log va xu ly dispute.
- He thong gui notification in-app cho cac su kien chinh.

## 12. Ngoai pham vi MVP

- Hop dong phap ly dien tu nang cao.
- Chu ky thanh toan subscription tu dong day du voi retry phuc tap.
- Chat realtime day du.
- KYC ngan hang nang cao.
- Cham diem AI tu dong cho chat luong thiet ke.
- He thong affiliate/referral.
- Mobile app native.

## 13. Rui ro va diem can lam ro

- Can xac dinh cong thanh toan chinh thuc: PayOS, VNPAY hay provider khac.
- Can xac dinh chinh sach phap ly cua escrow tai thi truong muc tieu.
- Can chot quy tac auto-approve: thoi gian review, exception va cach thong bao.
- Can chot quy tac refund khi huy du an truoc/sau khi student bat dau lam.
- Can chot dieu kien student duoc rut tien: xac minh sinh vien, so ngay hold, dispute pending.
- Can chot co che watermark cho tung loai file, dac biet la Figma, PSD, AI va ZIP.
- Can chot noi dung moderation cho comment, portfolio va rating public.
