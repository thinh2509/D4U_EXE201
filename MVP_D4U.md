# D4U MVP Description

## 1. Muc tieu MVP

MVP cua D4U tap trung chung minh mot luong gia tri cot loi: SME co the dang yeu cau thiet ke, Student co the ung tuyen va thuc hien cong viec, tien duoc giu qua escrow, san pham duoc nop theo milestone, SME duyet ket qua, Student nhan tien vao vi va hai ben co the danh gia nhau sau khi du an hoan thanh.

MVP khong co muc tieu xay dung day du tat ca tinh nang marketplace lon ngay tu dau. Muc tieu chinh la tao ra mot phien ban co the van hanh that voi du lieu that, thanh toan sandbox hoac provider MVP, va du luong nghiep vu de kiem chung nhu cau thi truong.

## 2. Dinh nghia thanh cong

MVP duoc xem la hoan thanh khi:

- Guest co the dang ky va dang nhap bang email/password.
- Student va SME co the tao profile toi thieu.
- Admin co the duyet xac minh Student.
- SME co the tao va publish project trong gioi han goi Basic.
- Student co the xem open project va gui application.
- SME co the chon Student, tao offer va thanh toan escrow.
- Student co the chap nhan offer va bat dau project.
- Student co the nop Sketch va Final voi file hop le.
- SME co the approve, request revision, report invalid file hoac open dispute.
- Khi Final approved, tien escrow duoc release vao wallet Student sau khi tru platform fee.
- Student co the tao withdrawal request.
- Hai ben co the rating sau khi project completed.
- Admin co the xu ly dispute co ban.
- He thong co notification in-app cho cac su kien quan trong.

## 3. Actor trong MVP

### 3.1. Guest

Guest la nguoi chua dang nhap. Trong MVP, Guest chi can:

- Dang ky tai khoan.
- Dang nhap.
- Chon role Student hoac SME khi tao tai khoan.

### 3.2. Student

Student la sinh vien thiet ke nhan project tu SME.

Student trong MVP co the:

- Tao va cap nhat profile sinh vien.
- Upload tai lieu xac minh sinh vien.
- Xem danh sach open project.
- Gui application vao project.
- Nhan va chap nhan offer.
- Upload submission cho Sketch, Final va Revision.
- Xem review action tu SME.
- Tham gia dispute neu co van de.
- Nhan tien vao wallet sau khi project completed.
- Tao withdrawal request.
- Danh gia SME sau khi project completed.

### 3.3. SME

SME la doanh nghiep can thue thiet ke.

SME trong MVP co the:

- Tao va cap nhat profile doanh nghiep.
- Co subscription mac dinh hoac duoc gan goi Basic/Pro/Premium.
- Tao draft project.
- Publish open project neu khong vuot gioi han subscription.
- Xem applications tu Student.
- Chon Student va tao offer.
- Thanh toan escrow.
- Review Sketch va Final.
- Request revision.
- Report invalid file.
- Open dispute.
- Danh gia Student sau khi project completed.

### 3.4. Admin

Admin la nguoi van hanh he thong.

Admin trong MVP co the:

- Duyet hoac tu choi student verification.
- Xem user, profile, project, payment va dispute.
- Xu ly dispute bang cach nhap quyet dinh va phan bo tien.
- Ho tro refund/disbursement trong cac case dispute.
- Xem audit log.

## 4. Scope chuc nang MVP

### 4.1. Authentication va account

MVP chi can email/password login.

Chuc nang can co:

- Dang ky tai khoan voi email, username, password, full name va role.
- Dang nhap bang email/password.
- Hash password.
- Tao refresh session.
- Dang xuat bang cach revoke session.
- Quan ly status tai khoan: PENDING, ACTIVE, SUSPENDED, BANNED, DELETED.
- Chan nguoi dung bi suspend/ban/deleted thuc hien hanh dong nghiep vu.

Khong thuoc MVP:

- Google login.
- SSO.
- Multi-factor authentication.
- Advanced device management.

### 4.2. Student profile va verification

Student profile toi thieu gom:

- School.
- Major.
- Study start year.
- Bio.
- Verification status.
- Average rating.
- Completed projects count.
- Can withdraw.

Student verification flow:

1. Student upload tai lieu xac minh.
2. He thong tao verification request.
3. Admin xem file va approve/reject.
4. Neu reject, Admin nhap rejection reason.
5. He thong cap nhat verification status tren Student profile.

Trong MVP, verification co the anh huong den quyen rut tien hoac quyen nhan project tuy theo quy tac van hanh.

### 4.3. SME profile va subscription

SME profile toi thieu gom:

- Company name.
- Representative name.
- Phone number.
- Business field.
- Logo optional.
- Average rating.
- Completed projects count.
- Active open project count.

Subscription MVP:

| Plan | Monthly price | Platform fee | Active open projects | Max budget |
| --- | ---: | ---: | ---: | ---: |
| BASIC | 0 VND | 10% | 2 | 5.000.000 VND |
| PRO | 199.000 VND | 7% | 10 | 20.000.000 VND |
| PREMIUM | 499.000 VND | 5% | Unlimited | Unlimited |

MVP can enforce subscription khi SME publish project:

- Kiem tra so active open project.
- Kiem tra budget co vuot plan hay khong.
- Lay platform fee rate tu plan tai thoi diem tao escrow.

Thanh toan subscription tu dong chua bat buoc trong MVP.

### 4.4. Project creation

SME tao project voi cac truong:

- Title.
- Brief.
- Usage purpose.
- Design category.
- Project type: OPEN hoac PRIVATE.
- Budget amount.
- Total deadline.
- Sketch deadline.
- Final deadline.
- Max revision rounds.
- Confidential flag.
- Allow student portfolio flag.
- Attachments.

Quy tac:

- Budget phai lon hon 0.
- Sketch deadline phai truoc hoac bang Final deadline.
- Final deadline phai truoc hoac bang Total deadline.
- SME chi publish duoc khi khong vuot gioi han subscription.
- Project publish open se co status OPEN.
- Project private se co status PRIVATE_INVITED sau khi moi Student.

### 4.5. Application va offer

Open project flow:

1. Student xem project status OPEN.
2. Student gui application gom proposed price, cover letter va estimated duration.
3. Moi Student chi ung tuyen mot lan cho mot project.
4. SME xem danh sach application.
5. SME chon mot application.
6. He thong tao offer cho Student.

Private project flow:

1. SME tao project loai PRIVATE.
2. SME chon Student can moi.
3. He thong tao offer khong can application.

Offer trong MVP:

- Offer ban dau co status PENDING_PAYMENT.
- Sau khi SME thanh toan escrow thanh cong, offer chuyen WAITING_ACCEPTANCE.
- Student co the ACCEPTED hoac REJECTED.
- Neu Student chap nhan, project chuyen IN_PROGRESS.

### 4.6. Escrow va payment

Escrow la co che giu tien de bao ve ca SME va Student.

Flow:

1. SME chon Student va tao offer.
2. He thong tao escrow voi amount bang offered amount.
3. SME thanh toan qua provider sandbox hoac provider MVP.
4. Payment SUCCESS thi escrow chuyen FUNDED.
5. Offer chuyen WAITING_ACCEPTANCE.
6. Student chap nhan offer.
7. Project chuyen IN_PROGRESS.

Du lieu can luu:

- Escrow amount.
- Currency.
- Platform fee rate.
- Platform fee amount.
- Payment provider.
- Provider transaction id.
- Payment status.
- Paid at.

Quy tac:

- Project khong duoc bat dau neu escrow chua FUNDED.
- Escrow DISPUTED thi khong duoc release.
- Provider transaction id phai unique theo provider.

### 4.7. Milestone Sketch va Final

Moi project IN_PROGRESS co 2 milestone:

- SKETCH.
- FINAL.

Sketch flow:

1. Student nop Sketch submission.
2. He thong luu submission va submission files.
3. Project chuyen SKETCH_SUBMITTED hoac SKETCH_IN_REVIEW.
4. SME review Sketch.
5. SME co the approve, request revision, report invalid file hoac open dispute.

Final flow:

1. Student chi nop Final sau khi Sketch approved hoac auto-approved.
2. Student upload Final files.
3. Project chuyen FINAL_SUBMITTED hoac FINAL_IN_REVIEW.
4. SME review Final.
5. Neu approve Final, project chuyen COMPLETED.
6. He thong release escrow va cong tien vao wallet Student.

### 4.8. Submission va file

Submission gom:

- Project.
- Milestone.
- Student submitter.
- Submission type: SKETCH, FINAL, REVISION.
- Revision round.
- Description.
- Status.
- Submitted at.

File upload trong MVP can luu metadata:

- Storage provider.
- Bucket.
- Storage key.
- Original filename.
- MIME type.
- Extension.
- File size.
- Visibility.
- Scan status optional.

File extensions cho phep:

- jpg, jpeg, png, webp.
- pdf.
- zip.
- fig.
- ai.
- psd.
- svg.

Quy tac:

- File private phai truy cap qua signed URL hoac co che tuong duong.
- Original final file chi nen downloadable sau khi Final approved hoac Admin cho phep trong dispute.
- Watermarked file co the dung de SME review truoc khi release file goc.

### 4.9. Review, revision va invalid file

SME co cac action review:

- APPROVE_SKETCH.
- APPROVE_FINAL.
- REQUEST_REVISION.
- REPORT_INVALID_FILE.
- OPEN_DISPUTE.

Revision flow:

1. SME request revision tren submission.
2. He thong tao revision request voi requested changes va due date.
3. Project chuyen REVISION_REQUESTED.
4. Student nop lai submission type REVISION.
5. SME review lai.
6. So revision round khong vuot max revision rounds cua project.

Invalid file flow:

1. SME report invalid file.
2. SME chon reason: EMPTY_FILE, CANNOT_OPEN, WRONG_FORMAT, UNRELATED, BROKEN_LINK hoac OTHER.
3. He thong tao invalid file report va reupload due date.
4. Student upload lai file bang submission/revision moi.
5. SME review lai hoac mo dispute neu khong dong thuan.

### 4.10. Completion va disbursement

Khi Final approved:

1. Project chuyen COMPLETED.
2. Escrow chuyen RELEASE_PENDING.
3. He thong tinh platform fee amount.
4. He thong tao disbursement.
5. He thong cong net amount vao wallet Student.
6. He thong tao wallet transaction loai DISBURSEMENT_CREDIT.
7. Escrow chuyen RELEASED.
8. Project co rating due date trong 7 ngay.

Cong thuc:

```text
platform_fee_amount = escrow.amount * platform_fee_rate
net_amount = escrow.amount - platform_fee_amount
```

### 4.11. Wallet va withdrawal

Wallet MVP cua Student gom:

- Available balance.
- Pending balance.
- Locked balance.
- Status.

Student co the them payment method dang BANK_ACCOUNT:

- Account holder name.
- Masked account number.
- Provider token optional.
- Is default.

Withdrawal flow:

1. Student chon payment method.
2. Student nhap amount.
3. He thong kiem tra wallet ACTIVE va `can_withdraw = true`.
4. He thong kiem tra amount toi thieu 50.000 VND.
5. He thong tinh fee 5.000 VND va net amount.
6. He thong tao withdrawal request PENDING.
7. Admin/Finance xu ly request.
8. Neu success, request completed va wallet transaction ghi debit.
9. Neu failed, he thong hoan lai so du bang transaction WITHDRAWAL_FAILED_REVERSAL.

### 4.12. Dispute MVP

Dispute MVP can xu ly cac tinh huong:

- SME khong dong y chat luong san pham.
- Student cho rang SME yeu cau ngoai brief.
- File bi bao loi nhung hai ben khong dong thuan.
- Project bi tre han hoac can refund.
- Escrow can chia tien mot phan.

Flow:

1. Student hoac SME open dispute.
2. Project chuyen DISPUTED.
3. Escrow chuyen DISPUTED neu da funded.
4. Hai ben upload evidence hoac comment.
5. Admin review project, submission, file, payment va evidence.
6. Admin nhap decision type, rationale va phan bo tien:
   - SME refund amount.
   - Student payout amount.
   - Platform fee amount.
7. He thong tao refund/disbursement tuong ung.
8. Dispute chuyen RESOLVED.

Trong MVP, decision duoc luu truc tiep tren bang `disputes` de don gian hoa. Bang decision rieng va appeal co the them o phase sau.

### 4.13. Rating

Rating chi mo sau khi project COMPLETED.

Quy tac:

- Student rating SME.
- SME rating Student.
- Moi cap rater/rated/project chi co mot rating.
- Rating value tu 1 den 5.
- Comment toi da 500 ky tu.
- Rating window: 7 ngay sau completed.
- Sau khi rating, he thong cap nhat average rating va completed projects count tren profile.

### 4.14. Notification

MVP chi can in-app notification.

Su kien can gui notification:

- Student verification approved/rejected.
- Project published.
- Application moi.
- Offer moi.
- Payment success/failed.
- Offer accepted/rejected.
- Submission moi.
- Review action moi.
- Revision request.
- Invalid file report.
- Dispute opened/resolved.
- Escrow released.
- Withdrawal request status changed.
- Rating received.

Notification co status:

- UNREAD.
- READ.

### 4.15. Audit log

Audit log MVP ghi nhan cac hanh dong quan trong:

- Admin approve/reject verification.
- SME publish/cancel project.
- Project status changed.
- Payment success/failed webhook.
- Escrow funded/released/refunded/disputed.
- Admin resolve dispute.
- Wallet balance changed.
- Withdrawal processed.
- User suspended/banned.

Audit log can luu:

- Actor user.
- Action.
- Entity type.
- Entity id.
- Before json.
- After json.
- IP address.
- User agent.
- Created at.

## 5. Luong nghiep vu chinh

### 5.1. Luong dang ky va onboarding

1. Guest dang ky voi role Student hoac SME.
2. He thong tao user status PENDING hoac ACTIVE tuy quy tac email verification.
3. User dang nhap.
4. Student tao student profile; SME tao SME profile.
5. Student nop verification neu can.
6. Admin approve verification.

Ket qua mong doi:

- User co profile hop le.
- Student co the ung tuyen.
- SME co the tao project.

### 5.2. Luong project open

1. SME tao project DRAFT.
2. SME upload attachments.
3. SME publish project.
4. He thong validate subscription.
5. Project chuyen OPEN.
6. Student gui application.
7. SME chon application.
8. He thong tao offer va escrow.
9. SME thanh toan.
10. Student chap nhan offer.
11. Project chuyen IN_PROGRESS.

Ket qua mong doi:

- Project co selected student.
- Escrow FUNDED.
- Sketch va Final milestone san sang.

### 5.3. Luong thuc hien project

1. Student nop Sketch.
2. SME approve Sketch hoac request revision.
3. Student nop revision neu co.
4. Sketch approved.
5. Student nop Final.
6. SME approve Final hoac request revision/report invalid/open dispute.
7. Final approved.
8. Project COMPLETED.

Ket qua mong doi:

- Submission va review action duoc ghi day du.
- Status project/milestone/submission nhat quan.

### 5.4. Luong thanh toan va giai ngan

1. SME payment SUCCESS.
2. Escrow FUNDED.
3. Project completed.
4. Escrow RELEASE_PENDING.
5. He thong tao disbursement.
6. Wallet Student tang available balance.
7. Escrow RELEASED.

Ket qua mong doi:

- Platform fee duoc tinh dung theo subscription plan.
- Wallet transaction ghi nhan so du sau giao dich.

### 5.5. Luong dispute

1. Mot ben open dispute.
2. Project va escrow chuyen DISPUTED.
3. Hai ben nop evidence.
4. Admin review.
5. Admin ra decision.
6. He thong tao refund/disbursement.
7. Dispute RESOLVED.

Ket qua mong doi:

- Escrow khong release khi dispute open.
- Quyet dinh Admin co rationale va phan bo tien ro rang.

## 6. Data model MVP

ERD MVP tuong ung gom 34 entity:

- `users`
- `user_sessions`
- `admin_profiles`
- `student_profiles`
- `student_verifications`
- `sme_profiles`
- `subscription_plans`
- `sme_subscriptions`
- `design_categories`
- `projects`
- `project_attachments`
- `project_applications`
- `project_offers`
- `project_status_histories`
- `project_milestones`
- `project_submissions`
- `submission_files`
- `review_actions`
- `revision_requests`
- `invalid_file_reports`
- `files`
- `escrows`
- `payments`
- `refunds`
- `disbursements`
- `wallets`
- `wallet_transactions`
- `payment_methods`
- `withdrawal_requests`
- `disputes`
- `dispute_evidences`
- `ratings`
- `notifications`
- `audit_logs`

Chi tiet attribute va relationship nam trong `Entity_Dictionary_D4U.md`. Ma DBML dung cho dbdiagram.io nam trong `D4U_ERD.dbml`.

## 7. API nhom chuc nang goi y

### 7.1. Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `GET /auth/me`

### 7.2. Profiles

- `GET /students/me`
- `PUT /students/me`
- `POST /students/me/verification`
- `GET /smes/me`
- `PUT /smes/me`
- `GET /admin/users`

### 7.3. Projects

- `POST /projects`
- `GET /projects`
- `GET /projects/{id}`
- `PUT /projects/{id}`
- `POST /projects/{id}/publish`
- `POST /projects/{id}/cancel`

### 7.4. Applications va offers

- `POST /projects/{id}/applications`
- `GET /projects/{id}/applications`
- `POST /projects/{id}/offers`
- `POST /offers/{id}/accept`
- `POST /offers/{id}/reject`

### 7.5. Payments va escrow

- `POST /offers/{id}/payment`
- `POST /payments/webhook`
- `GET /projects/{id}/escrow`

### 7.6. Submissions va review

- `POST /projects/{id}/submissions`
- `GET /projects/{id}/submissions`
- `POST /submissions/{id}/approve`
- `POST /submissions/{id}/request-revision`
- `POST /submissions/{id}/report-invalid-file`

### 7.7. Disputes

- `POST /projects/{id}/disputes`
- `POST /disputes/{id}/evidences`
- `POST /admin/disputes/{id}/resolve`

### 7.8. Wallet

- `GET /wallets/me`
- `GET /wallets/me/transactions`
- `POST /payment-methods`
- `POST /withdrawal-requests`
- `POST /admin/withdrawal-requests/{id}/process`

### 7.9. Ratings va notifications

- `POST /projects/{id}/ratings`
- `GET /notifications`
- `POST /notifications/{id}/read`

## 8. Uu tien build MVP

### Phase 1: Foundation

- Auth email/password.
- Role authorization.
- User/profile CRUD.
- File upload metadata.
- Design categories seed.
- Subscription plans seed.

### Phase 2: Marketplace

- Project create/publish/list/detail.
- Application flow.
- Offer flow.
- Project status history.

### Phase 3: Payment va project execution

- Escrow creation.
- Payment sandbox.
- Milestone creation.
- Submission upload.
- Review action.
- Revision request.
- Invalid file report.

### Phase 4: Completion va money movement

- Final approval.
- Disbursement.
- Wallet balance.
- Wallet transaction.
- Payment method.
- Withdrawal request.

### Phase 5: Trust va operation

- Student verification admin.
- Dispute open/evidence/resolve.
- Rating.
- In-app notification.
- Audit log.

## 9. Ngoai pham vi MVP

Nhung tinh nang sau khong nen lam trong MVP dau tien:

- Chat realtime.
- Social login.
- Portfolio builder chi tiet.
- Skill/software matching nang cao.
- AI recommendation.
- Subscription billing tu dong phuc tap.
- Dispute appeal.
- Reputation ledger rieng.
- User warning workflow day du.
- Email/push notification delivery pipeline.
- Contract/e-signature.
- KYC ngan hang nang cao.
- Mobile native app.

## 10. Rui ro MVP va cach giam thieu

### 10.1. Payment va escrow phuc tap hon du kien

Giam thieu:

- Dung payment sandbox trong MVP.
- Tach ro payment, escrow, disbursement va wallet transaction.
- Dam bao webhook idempotent.

### 10.2. Dispute co nhieu edge case

Giam thieu:

- MVP chi can dispute decision truc tiep tren bang `disputes`.
- Admin nhap manual phan bo tien.
- Appeal dua sang phase sau.

### 10.3. File design co dinh dang kho xu ly

Giam thieu:

- Luu metadata va file goc trong object storage.
- Watermark chi ap dung duoc cho file preview.
- File Figma/AI/PSD/ZIP co the review bang download permission sau khi co rule.

### 10.4. Scope bi phong to

Giam thieu:

- Chi build theo 34 entity MVP.
- Moi feature moi phai tra loi: co can de pass MVP acceptance criteria khong?
- Neu khong, dua vao phase sau.

## 11. Checklist nghiem thu MVP

- [ ] Guest dang ky thanh cong.
- [ ] User dang nhap/dang xuat thanh cong.
- [ ] Student tao profile thanh cong.
- [ ] SME tao profile thanh cong.
- [ ] Admin duyet hoac tu choi Student verification.
- [ ] Seed duoc Basic, Pro, Premium plans.
- [ ] SME Basic khong publish duoc qua 2 active open projects.
- [ ] SME Basic khong publish duoc project qua 5.000.000 VND.
- [ ] SME tao va publish open project thanh cong.
- [ ] Student xem danh sach open projects.
- [ ] Student gui application thanh cong.
- [ ] SME xem application list.
- [ ] SME tao offer cho Student.
- [ ] SME thanh toan escrow sandbox thanh cong.
- [ ] Student chap nhan offer.
- [ ] Project chuyen IN_PROGRESS.
- [ ] He thong tao Sketch va Final milestones.
- [ ] Student nop Sketch voi file hop le.
- [ ] SME approve Sketch.
- [ ] SME request revision khi can.
- [ ] Student nop Revision.
- [ ] Student nop Final.
- [ ] SME approve Final.
- [ ] Project chuyen COMPLETED.
- [ ] Escrow release thanh cong.
- [ ] Wallet Student duoc cong net amount.
- [ ] Student tao withdrawal request hop le.
- [ ] Student va SME rating nhau trong 7 ngay.
- [ ] Student hoac SME open dispute.
- [ ] Admin resolve dispute.
- [ ] Notification in-app duoc tao cho event chinh.
- [ ] Audit log ghi lai action quan trong.
