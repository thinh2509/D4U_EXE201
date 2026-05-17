# D4U MVP Entity Dictionary

Tai lieu nay mo ta ERD MVP-only cua D4U, duoc refactor theo rieng muc `11. Tieu chi chap nhan MVP` trong `Requirement.md`. Muc tieu la giu schema du gon de build MVP, nhung van du du lieu cho cac luong nghiep vu cot loi: dang ky/dang nhap, profile, project, application, offer, escrow payment, submission sketch/final, review/revision, invalid file, dispute, wallet withdrawal, rating, notification va audit.

## 1. Pham vi MVP

### 1.1. Duoc giu trong ERD

- Email/password account cho Guest, Student, SME, Admin.
- Student profile, SME profile, Admin profile.
- Student verification co ban.
- Subscription plan va subscription cua SME de enforce gioi han Basic/Pro/Premium.
- Design category.
- Project open/private, attachment, application, offer va status history.
- Hai milestone bat buoc: Sketch va Final.
- Submission, submission file, review action, revision request, invalid file report.
- File metadata cho upload.
- Escrow, payment sandbox, refund, disbursement.
- Wallet, wallet transaction, payment method, withdrawal request.
- Dispute co bang chung va quyet dinh admin luu truc tiep tren dispute.
- Rating hai chieu sau khi completed.
- In-app notification.
- Audit log cho hanh dong admin/payment/dispute quan trong.

### 1.2. Dua ra khoi ERD MVP

- Social login provider table.
- Student skill/software/portfolio chi tiet.
- AI recommendation.
- Reputation ledger va user warning.
- Comment workspace.
- Dispute appeal va dispute decision table rieng.
- System configuration table.
- Notification email/push delivery tracking.
- Subscription payment chi tiet ngoai luong escrow sandbox.

Nhung phan nay co the them lai o phase sau khi MVP da chay on dinh.

## 2. Entity Dictionary

### 2.1. users

Mo ta: Tai khoan trung tam cho Student, SME va Admin.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh user. |
| email | varchar(255) | not null, unique | Email dang nhap. |
| username | varchar(100) | not null, unique | Ten nguoi dung duy nhat. |
| password_hash | varchar(255) | not null | Mat khau da hash. |
| full_name | varchar(255) | not null | Ho ten hien thi. |
| avatar_url | text | nullable | Anh dai dien. |
| role | user_role | not null | STUDENT, SME hoac ADMIN. |
| status | user_status | not null, default PENDING | Trang thai tai khoan. |
| email_verified_at | timestamp | nullable | Thoi diem xac minh email. |
| last_login_at | timestamp | nullable | Lan dang nhap gan nhat. |
| created_at | timestamp | not null | Thoi diem tao. |
| updated_at | timestamp | not null | Thoi diem cap nhat. |

Relationship:

- 1-n voi `user_sessions`.
- 1-0..1 voi `student_profiles`, `sme_profiles`, `admin_profiles`.
- 1-n voi `files`, `payments`, `ratings`, `notifications`, `audit_logs`.
- Duoc dung trong dispute, review action, verification va withdrawal.

### 2.2. user_sessions

Mo ta: Refresh session theo thiet bi.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh session. |
| user_id | uuid | FK users.id, not null | User dang nhap. |
| refresh_token_hash | varchar(255) | not null | Refresh token da hash. |
| device_info | text | nullable | Thiet bi/trinh duyet. |
| ip_address | varchar(64) | nullable | Dia chi IP. |
| expires_at | timestamp | not null | Han session. |
| revoked_at | timestamp | nullable | Thoi diem logout/revoke. |
| created_at | timestamp | not null | Thoi diem tao. |

Relationship:

- Nhieu session thuoc mot user.

### 2.3. admin_profiles

Mo ta: Ho so quyen van hanh cua Admin.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh admin profile. |
| user_id | uuid | FK users.id, unique, not null | Tai khoan admin. |
| permission_level | varchar(50) | not null | SUPPORT, FINANCE, SUPER_ADMIN. |
| created_at | timestamp | not null | Thoi diem tao. |

Relationship:

- Moi admin profile thuoc mot user role ADMIN.
- Admin review student verification, dispute va audit actions.

### 2.4. student_profiles

Mo ta: Ho so sinh vien thiet ke.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh student profile. |
| user_id | uuid | FK users.id, unique, not null | Tai khoan student. |
| school | varchar(255) | not null | Truong hoc. |
| major | varchar(255) | not null | Nganh hoc. |
| study_start_year | int | not null | Nam bat dau hoc. |
| bio | text | nullable | Gioi thieu ngan. |
| onboarding_status | varchar(50) | not null, default INCOMPLETE | Trang thai onboarding. |
| verification_status | varchar(50) | not null, default NOT_SUBMITTED | Trang thai xac minh. |
| average_rating | decimal(3,2) | not null, default 0 | Rating trung binh. |
| completed_projects_count | int | not null, default 0 | So project hoan thanh. |
| can_withdraw | boolean | not null, default false | Co duoc rut tien hay khong. |
| created_at | timestamp | not null | Thoi diem tao. |
| updated_at | timestamp | not null | Thoi diem cap nhat. |

Relationship:

- Thuoc mot user role STUDENT.
- 1-n voi `student_verifications`, `project_applications`, `project_offers`, `project_submissions`.
- 1-n voi `projects.selected_student_profile_id`, `escrows.student_profile_id`.
- 1-0..1 voi `wallets`.

### 2.5. student_verifications

Mo ta: Ho so xac minh sinh vien do Admin duyet.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh verification. |
| student_profile_id | uuid | FK student_profiles.id, not null | Student nop ho so. |
| document_file_id | uuid | FK files.id, not null | File tai lieu xac minh. |
| status | varchar(50) | not null, default PENDING | PENDING, APPROVED, REJECTED. |
| reviewed_by_admin_id | uuid | FK users.id, nullable | Admin review. |
| rejection_reason | text | nullable | Ly do tu choi. |
| submitted_at | timestamp | not null | Thoi diem nop. |
| reviewed_at | timestamp | nullable | Thoi diem review. |

Relationship:

- Nhieu verification thuoc mot student.
- Moi verification co mot file tai lieu.
- Admin reviewer tham chieu `users`.

### 2.6. sme_profiles

Mo ta: Ho so doanh nghiep thue thiet ke.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh SME profile. |
| user_id | uuid | FK users.id, unique, not null | Tai khoan SME. |
| company_name | varchar(255) | not null | Ten cong ty. |
| representative_name | varchar(255) | not null | Nguoi dai dien. |
| phone_number | varchar(50) | not null | So dien thoai. |
| business_field | varchar(255) | not null | Linh vuc kinh doanh. |
| logo_file_id | uuid | FK files.id, nullable | Logo cong ty. |
| onboarding_status | varchar(50) | not null, default INCOMPLETE | Trang thai onboarding. |
| average_rating | decimal(3,2) | not null, default 0 | Rating trung binh. |
| completed_projects_count | int | not null, default 0 | So project hoan thanh. |
| active_open_project_count | int | not null, default 0 | So open project dang active. |
| created_at | timestamp | not null | Thoi diem tao. |
| updated_at | timestamp | not null | Thoi diem cap nhat. |

Relationship:

- Thuoc mot user role SME.
- 1-n voi `sme_subscriptions`, `projects`, `escrows`.
- Logo tham chieu `files`.

### 2.7. subscription_plans

Mo ta: Goi Basic/Pro/Premium de gioi han project va tinh platform fee.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh plan. |
| code | varchar(50) | not null, unique | BASIC, PRO, PREMIUM. |
| name | varchar(100) | not null | Ten goi. |
| monthly_price | decimal(12,2) | not null | Phi thang. |
| platform_fee_rate | decimal(5,2) | not null | Ty le phi nen tang. |
| max_active_open_projects | int | nullable | Gioi han project open; null la khong gioi han. |
| max_project_budget | decimal(12,2) | nullable | Gioi han budget; null la khong gioi han. |
| is_active | boolean | not null, default true | Co dang duoc dung hay khong. |

Relationship:

- 1-n voi `sme_subscriptions`.

### 2.8. sme_subscriptions

Mo ta: Goi hien tai/lich su goi cua SME.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh subscription. |
| sme_profile_id | uuid | FK sme_profiles.id, not null | SME dang ky. |
| subscription_plan_id | uuid | FK subscription_plans.id, not null | Goi dang dung. |
| status | varchar(50) | not null, default ACTIVE | Trang thai goi. |
| started_at | timestamp | not null | Ngay bat dau. |
| current_period_end | timestamp | nullable | Ngay het chu ky hien tai. |
| cancelled_at | timestamp | nullable | Ngay huy. |
| created_at | timestamp | not null | Thoi diem tao. |

Relationship:

- Nhieu subscription thuoc mot SME.
- Nhieu subscription tham chieu mot plan.

### 2.9. design_categories

Mo ta: Danh muc thiet ke de SME chon khi tao project.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh category. |
| name | varchar(100) | not null, unique | Ten danh muc. |
| description | text | nullable | Mo ta. |
| is_active | boolean | not null, default true | Co duoc chon hay khong. |

Relationship:

- 1-n voi `projects`.

### 2.10. projects

Mo ta: Du an thiet ke cua SME, open hoac private.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh project. |
| sme_profile_id | uuid | FK sme_profiles.id, not null | SME tao project. |
| selected_student_profile_id | uuid | FK student_profiles.id, nullable | Student duoc chon. |
| design_category_id | uuid | FK design_categories.id, not null | Danh muc. |
| title | varchar(255) | not null | Tieu de. |
| brief | text | not null | Yeu cau chi tiet. |
| usage_purpose | text | nullable | Muc dich su dung. |
| project_type | project_type | not null | OPEN hoac PRIVATE. |
| status | project_status | not null, default DRAFT | Trang thai project. |
| budget_amount | decimal(12,2) | not null | Ngan sach. |
| currency | char(3) | not null, default VND | Don vi tien. |
| total_deadline_at | timestamp | not null | Han tong. |
| sketch_deadline_at | timestamp | not null | Han sketch. |
| final_deadline_at | timestamp | not null | Han final. |
| max_revision_rounds | int | not null, default 2 | So lan sua toi da. |
| current_revision_round | int | not null, default 0 | Lan sua hien tai. |
| is_confidential | boolean | not null, default false | Du an bao mat hay khong. |
| allow_student_portfolio | boolean | not null, default true | Cho phep dua vao portfolio sau nay. |
| rating_due_at | timestamp | nullable | Han rating sau completed. |
| published_at | timestamp | nullable | Ngay publish. |
| accepted_at | timestamp | nullable | Ngay student chap nhan. |
| completed_at | timestamp | nullable | Ngay completed. |
| cancelled_at | timestamp | nullable | Ngay huy. |
| cancellation_reason | text | nullable | Ly do huy. |
| created_at | timestamp | not null | Thoi diem tao. |
| updated_at | timestamp | not null | Thoi diem cap nhat. |

Relationship:

- Thuoc mot SME va mot category.
- Co the chon mot student.
- 1-n voi attachment, application, offer, status history, milestone, submission, review action, revision, invalid report, dispute, rating.
- 1-0..1 voi escrow.

### 2.11. project_attachments

Mo ta: File brief/reference khi SME tao project.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh attachment. |
| project_id | uuid | FK projects.id, not null | Project so huu. |
| file_id | uuid | FK files.id, not null | File dinh kem. |
| attachment_type | varchar(50) | not null, default BRIEF | Loai attachment. |
| created_at | timestamp | not null | Thoi diem tao. |

Relationship:

- Nhieu attachment thuoc mot project.
- Moi attachment tham chieu mot file.

### 2.12. project_applications

Mo ta: Don ung tuyen cua Student vao open project.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh application. |
| project_id | uuid | FK projects.id, not null | Project ung tuyen. |
| student_profile_id | uuid | FK student_profiles.id, not null | Student ung tuyen. |
| proposed_price | decimal(12,2) | not null | Gia de xuat. |
| cover_letter | text | not null | Loi gioi thieu/phuong an. |
| estimated_duration_days | int | nullable | Thoi gian du kien. |
| status | varchar(50) | not null, default SUBMITTED | Trang thai application. |
| submitted_at | timestamp | not null | Thoi diem nop. |
| updated_at | timestamp | not null | Thoi diem cap nhat. |

Constraint:

- Unique `(project_id, student_profile_id)` de mot student chi ung tuyen mot lan moi project.

Relationship:

- Nhieu application thuoc mot project.
- Nhieu application thuoc mot student.
- Co the tao offer tu application.

### 2.13. project_offers

Mo ta: Offer SME gui cho Student sau khi chon application hoac moi private.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh offer. |
| project_id | uuid | FK projects.id, not null | Project lien quan. |
| student_profile_id | uuid | FK student_profiles.id, not null | Student nhan offer. |
| application_id | uuid | FK project_applications.id, nullable | Application nguon. |
| status | offer_status | not null, default PENDING_PAYMENT | Trang thai offer. |
| offered_amount | decimal(12,2) | not null | So tien offer. |
| expires_at | timestamp | nullable | Han chap nhan. |
| accepted_at | timestamp | nullable | Ngay chap nhan. |
| rejected_at | timestamp | nullable | Ngay tu choi. |
| revoked_at | timestamp | nullable | Ngay thu hoi. |
| created_at | timestamp | not null | Thoi diem tao. |

Relationship:

- Nhieu offer thuoc mot project.
- Nhieu offer gui den mot student.
- Offer co the lien ket application.

### 2.14. project_status_histories

Mo ta: Lich su trang thai project de audit workflow.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh history. |
| project_id | uuid | FK projects.id, not null | Project thay doi. |
| from_status | project_status | nullable | Trang thai truoc. |
| to_status | project_status | not null | Trang thai moi. |
| changed_by_user_id | uuid | FK users.id, nullable | User thuc hien. |
| change_reason | text | nullable | Ly do. |
| metadata_json | json | nullable | Du lieu bo sung. |
| created_at | timestamp | not null | Thoi diem thay doi. |

Relationship:

- Nhieu history thuoc mot project.
- User thay doi co the nullable neu la system job.

### 2.15. project_milestones

Mo ta: Hai milestone MVP: Sketch va Final.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh milestone. |
| project_id | uuid | FK projects.id, not null | Project so huu. |
| milestone_type | milestone_type | not null | SKETCH hoac FINAL. |
| status | milestone_status | not null, default PENDING | Trang thai milestone. |
| deadline_at | timestamp | not null | Han nop. |
| submitted_at | timestamp | nullable | Ngay nop. |
| review_due_at | timestamp | nullable | Han review. |
| approved_at | timestamp | nullable | Ngay duyet. |
| auto_approved_at | timestamp | nullable | Ngay auto approve. |
| created_at | timestamp | not null | Thoi diem tao. |
| updated_at | timestamp | not null | Thoi diem cap nhat. |

Constraint:

- Unique `(project_id, milestone_type)`.

Relationship:

- Mot project co mot Sketch milestone va mot Final milestone.
- Mot milestone co nhieu submission neu co revision.

### 2.16. project_submissions

Mo ta: Lan nop Sketch, Final hoac Revision cua Student.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh submission. |
| project_id | uuid | FK projects.id, not null | Project lien quan. |
| milestone_id | uuid | FK project_milestones.id, not null | Milestone duoc nop. |
| submitted_by_student_id | uuid | FK student_profiles.id, not null | Student nop. |
| submission_type | submission_type | not null | SKETCH, FINAL, REVISION. |
| revision_round | int | not null, default 0 | Vong sua. |
| description | text | nullable | Ghi chu. |
| status | submission_status | not null, default SUBMITTED | Trang thai submission. |
| submitted_at | timestamp | not null | Thoi diem nop. |

Relationship:

- Nhieu submission thuoc mot project va mot milestone.
- Moi submission do selected student nop.
- 1-n voi submission file, review action, revision request, invalid file report.

### 2.17. submission_files

Mo ta: File nop trong submission.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh submission file. |
| submission_id | uuid | FK project_submissions.id, not null | Submission so huu. |
| file_id | uuid | FK files.id, not null | File goc. |
| watermarked_file_id | uuid | FK files.id, nullable | File watermark de review. |
| is_original_downloadable | boolean | not null, default false | Co duoc download file goc hay khong. |
| created_at | timestamp | not null | Thoi diem tao. |

Relationship:

- Nhieu file thuoc mot submission.
- `file_id` va `watermarked_file_id` deu tham chieu `files`.

### 2.18. review_actions

Mo ta: Hanh dong SME/Admin/he thong thuc hien khi review submission.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh review action. |
| project_id | uuid | FK projects.id, not null | Project lien quan. |
| submission_id | uuid | FK project_submissions.id, not null | Submission duoc review. |
| reviewer_user_id | uuid | FK users.id, nullable | Reviewer; null neu auto approve. |
| action | review_action_type | not null | Approve, request revision, report invalid file, open dispute. |
| comment | text | nullable | Ghi chu review. |
| created_at | timestamp | not null | Thoi diem action. |

Relationship:

- Nhieu review action thuoc mot project va submission.
- Reviewer tham chieu user SME/Admin hoac nullable cho system.

### 2.19. revision_requests

Mo ta: Yeu cau sua doi khi SME chua dong y submission.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh revision. |
| project_id | uuid | FK projects.id, not null | Project lien quan. |
| submission_id | uuid | FK project_submissions.id, not null | Submission bi yeu cau sua. |
| requested_by_user_id | uuid | FK users.id, not null | User yeu cau. |
| revision_round | int | not null | Vong sua. |
| requested_changes | text | not null | Noi dung can sua. |
| status | varchar(50) | not null, default OPEN | OPEN, SUBMITTED, APPROVED, EXPIRED. |
| due_at | timestamp | not null | Han nop lai. |
| resolved_at | timestamp | nullable | Ngay dong. |
| created_at | timestamp | not null | Ngay tao. |

Constraint:

- Unique `(project_id, revision_round, submission_id)`.

Relationship:

- Nhieu revision request thuoc mot project va submission.
- Nguoi yeu cau tham chieu `users`.

### 2.20. invalid_file_reports

Mo ta: Bao loi file nop khong hop le.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh report. |
| project_id | uuid | FK projects.id, not null | Project lien quan. |
| submission_id | uuid | FK project_submissions.id, not null | Submission bi report. |
| reported_by_user_id | uuid | FK users.id, not null | User bao loi. |
| reason_code | invalid_file_reason | not null | Ly do file loi. |
| description | text | nullable | Mo ta. |
| status | varchar(50) | not null, default OPEN | Trang thai xu ly. |
| reupload_due_at | timestamp | not null | Han upload lai. |
| resolved_at | timestamp | nullable | Ngay dong. |
| created_at | timestamp | not null | Ngay tao. |

Relationship:

- Nhieu report thuoc mot project va submission.
- Reporter tham chieu `users`.

### 2.21. files

Mo ta: Metadata file upload dung cho profile, brief, submission, dispute, payment evidence neu can.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh file. |
| owner_user_id | uuid | FK users.id, nullable | User so huu. |
| storage_provider | varchar(50) | not null | Provider luu tru. |
| bucket | varchar(255) | nullable | Bucket. |
| storage_key | text | not null | Key trong storage. |
| original_filename | varchar(255) | not null | Ten file goc. |
| mime_type | varchar(100) | not null | MIME type. |
| file_extension | varchar(20) | not null | Duoi file. |
| file_size_bytes | bigint | not null | Dung luong. |
| checksum | varchar(128) | nullable | Checksum. |
| visibility | varchar(50) | not null, default PRIVATE | Quyen truy cap. |
| scan_status | varchar(50) | nullable | Trang thai scan. |
| created_at | timestamp | not null | Ngay tao. |
| deleted_at | timestamp | nullable | Xoa mem. |

Relationship:

- File co the duoc tham chieu boi logo SME, verification, project attachment, submission file va dispute evidence.

### 2.22. escrows

Mo ta: Khoan ky quy cho project truoc khi Student bat dau.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh escrow. |
| project_id | uuid | FK projects.id, unique, not null | Project duoc ky quy. |
| sme_profile_id | uuid | FK sme_profiles.id, not null | SME tra tien. |
| student_profile_id | uuid | FK student_profiles.id, not null | Student nhan tien. |
| amount | decimal(12,2) | not null | Tong tien. |
| currency | char(3) | not null, default VND | Don vi tien. |
| platform_fee_rate | decimal(5,2) | not null | Ty le phi nen tang. |
| platform_fee_amount | decimal(12,2) | nullable | Phi nen tang. |
| status | escrow_status | not null, default PENDING_PAYMENT | Trang thai escrow. |
| funded_at | timestamp | nullable | Ngay nap tien. |
| released_at | timestamp | nullable | Ngay release. |
| refunded_at | timestamp | nullable | Ngay refund. |
| created_at | timestamp | not null | Ngay tao. |
| updated_at | timestamp | not null | Ngay cap nhat. |

Relationship:

- Mot project co toi da mot escrow.
- Escrow thuoc mot SME va mot Student.
- 1-n voi payment, refund, disbursement; co the gan dispute.

### 2.23. payments

Mo ta: Thanh toan sandbox nap tien vao escrow.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh payment. |
| payer_user_id | uuid | FK users.id, not null | User thanh toan. |
| escrow_id | uuid | FK escrows.id, nullable | Escrow duoc nap. |
| amount | decimal(12,2) | not null | So tien. |
| currency | char(3) | not null, default VND | Don vi tien. |
| provider | varchar(100) | not null | PayOS/VNPAY sandbox hoac provider khac. |
| provider_transaction_id | varchar(255) | nullable | Ma giao dich provider. |
| status | payment_status | not null, default PENDING | Trang thai. |
| paid_at | timestamp | nullable | Ngay thanh cong. |
| created_at | timestamp | not null | Ngay tao. |

Constraint:

- Unique `(provider, provider_transaction_id)`.

Relationship:

- Nhieu payment thuoc mot payer user.
- Nhieu payment co the thuoc mot escrow.
- Payment co the duoc refund.

### 2.24. refunds

Mo ta: Hoan tien khi project huy hoac dispute yeu cau.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh refund. |
| escrow_id | uuid | FK escrows.id, not null | Escrow bi refund. |
| payment_id | uuid | FK payments.id, nullable | Payment goc. |
| amount | decimal(12,2) | not null | So tien refund. |
| currency | char(3) | not null, default VND | Don vi tien. |
| reason | varchar(50) | not null | Ly do. |
| status | varchar(50) | not null, default PENDING | Trang thai. |
| provider_refund_id | varchar(255) | nullable | Ma refund provider. |
| created_by_user_id | uuid | FK users.id, nullable | Admin/system tao. |
| created_at | timestamp | not null | Ngay tao. |
| completed_at | timestamp | nullable | Ngay hoan tat. |

Relationship:

- Nhieu refund thuoc mot escrow.
- Refund co the lien ket payment goc.

### 2.25. disbursements

Mo ta: Giai ngan tien tu escrow vao wallet Student sau khi final duoc duyet.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh disbursement. |
| escrow_id | uuid | FK escrows.id, not null | Escrow nguon. |
| wallet_id | uuid | FK wallets.id, not null | Wallet nhan tien. |
| gross_amount | decimal(12,2) | not null | Tong tien. |
| platform_fee_amount | decimal(12,2) | not null | Phi nen tang. |
| net_amount | decimal(12,2) | not null | Tien thuc nhan. |
| status | varchar(50) | not null, default PENDING | Trang thai. |
| created_at | timestamp | not null | Ngay tao. |
| completed_at | timestamp | nullable | Ngay hoan tat. |

Relationship:

- Nhieu disbursement thuoc mot escrow.
- Nhieu disbursement ghi vao mot wallet.

### 2.26. wallets

Mo ta: Vi tien VND cua Student.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh wallet. |
| owner_user_id | uuid | FK users.id, unique, not null | User so huu. |
| student_profile_id | uuid | FK student_profiles.id, unique, nullable | Student profile. |
| currency | char(3) | not null, default VND | Don vi tien. |
| available_balance | decimal(12,2) | not null, default 0 | So du kha dung. |
| pending_balance | decimal(12,2) | not null, default 0 | So du cho xu ly. |
| locked_balance | decimal(12,2) | not null, default 0 | So du bi khoa. |
| status | wallet_status | not null, default ACTIVE | Trang thai vi. |
| created_at | timestamp | not null | Ngay tao. |
| updated_at | timestamp | not null | Ngay cap nhat. |

Relationship:

- Mot wallet thuoc mot user/student.
- 1-n voi wallet transaction, disbursement va withdrawal request.

### 2.27. wallet_transactions

Mo ta: Ledger bien dong so du wallet.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh transaction. |
| wallet_id | uuid | FK wallets.id, not null | Wallet lien quan. |
| type | wallet_transaction_type | not null | Loai giao dich. |
| amount | decimal(12,2) | not null | So tien. |
| balance_after | decimal(12,2) | not null | So du sau giao dich. |
| reference_type | varchar(50) | nullable | Loai tham chieu. |
| reference_id | uuid | nullable | ID tham chieu. |
| description | text | nullable | Mo ta. |
| created_at | timestamp | not null | Ngay tao. |

Relationship:

- Nhieu transaction thuoc mot wallet.
- Reference polymorphic toi disbursement/withdrawal/admin adjustment.

### 2.28. payment_methods

Mo ta: Tai khoan ngan hang nhan tien khi Student rut tien.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh payment method. |
| user_id | uuid | FK users.id, not null | User so huu. |
| method_type | varchar(50) | not null, default BANK_ACCOUNT | Loai phuong thuc. |
| account_holder_name | varchar(255) | nullable | Ten chu tai khoan. |
| masked_account_number | varchar(100) | nullable | So tai khoan da mask. |
| provider_token | varchar(255) | nullable | Token neu co provider. |
| is_default | boolean | not null, default false | Mac dinh hay khong. |
| status | varchar(50) | not null, default ACTIVE | Trang thai. |
| created_at | timestamp | not null | Ngay tao. |

Relationship:

- Nhieu payment method thuoc mot user.
- 1-n voi withdrawal request.

### 2.29. withdrawal_requests

Mo ta: Yeu cau rut tien hop le cua Student.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh withdrawal. |
| wallet_id | uuid | FK wallets.id, not null | Wallet rut tien. |
| requested_by_user_id | uuid | FK users.id, not null | User yeu cau. |
| payment_method_id | uuid | FK payment_methods.id, not null | Tai khoan nhan. |
| amount | decimal(12,2) | not null | So tien truoc phi. |
| fee_amount | decimal(12,2) | not null, default 5000 | Phi rut tien. |
| net_amount | decimal(12,2) | not null | So tien thuc nhan. |
| status | varchar(50) | not null, default PENDING | Trang thai. |
| failure_reason | text | nullable | Ly do that bai. |
| requested_at | timestamp | not null | Ngay yeu cau. |
| processed_at | timestamp | nullable | Ngay xu ly. |

Relationship:

- Nhieu request thuoc mot wallet.
- Request do mot user tao va dung mot payment method.

### 2.30. disputes

Mo ta: Tranh chap MVP do Student/SME mo va Admin xu ly.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh dispute. |
| project_id | uuid | FK projects.id, not null | Project tranh chap. |
| escrow_id | uuid | FK escrows.id, nullable | Escrow bi giu. |
| opened_by_user_id | uuid | FK users.id, not null | User mo tranh chap. |
| against_user_id | uuid | FK users.id, nullable | User bi khieu nai. |
| reason_code | varchar(50) | not null | Ma ly do. |
| description | text | not null | Mo ta. |
| status | dispute_status | not null, default OPEN | Trang thai. |
| assigned_admin_id | uuid | FK users.id, nullable | Admin phu trach. |
| decision_type | varchar(50) | nullable | Loai quyet dinh. |
| sme_refund_amount | decimal(12,2) | not null, default 0 | Tien hoan SME. |
| student_payout_amount | decimal(12,2) | not null, default 0 | Tien tra Student. |
| platform_fee_amount | decimal(12,2) | not null, default 0 | Phi nen tang. |
| decision_rationale | text | nullable | Ly do quyet dinh. |
| opened_at | timestamp | not null | Ngay mo. |
| resolved_at | timestamp | nullable | Ngay giai quyet. |

Relationship:

- Nhieu dispute thuoc mot project.
- Dispute co the gan escrow.
- User mo, user bi khieu nai va admin phu trach deu tham chieu `users`.
- 1-n voi `dispute_evidences`.

### 2.31. dispute_evidences

Mo ta: Bang chung trong dispute.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh evidence. |
| dispute_id | uuid | FK disputes.id, not null | Dispute lien quan. |
| submitted_by_user_id | uuid | FK users.id, not null | User nop bang chung. |
| file_id | uuid | FK files.id, nullable | File bang chung. |
| comment | text | nullable | Ghi chu. |
| created_at | timestamp | not null | Ngay tao. |

Relationship:

- Nhieu evidence thuoc mot dispute.
- Evidence co the co file.

### 2.32. ratings

Mo ta: Danh gia hai chieu sau khi project completed.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh rating. |
| project_id | uuid | FK projects.id, not null | Project duoc danh gia. |
| rater_user_id | uuid | FK users.id, not null | User danh gia. |
| rated_user_id | uuid | FK users.id, not null | User duoc danh gia. |
| rating_value | int | not null | Diem 1..5. |
| comment | varchar(500) | nullable | Nhan xet. |
| is_public | boolean | not null, default false | Co hien cong khai hay khong. |
| created_at | timestamp | not null | Ngay tao. |

Constraint:

- Unique `(project_id, rater_user_id, rated_user_id)`.

Relationship:

- Nhieu rating thuoc mot project.
- Rater va rated deu tham chieu user.

### 2.33. notifications

Mo ta: In-app notification MVP.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh notification. |
| recipient_user_id | uuid | FK users.id, not null | User nhan. |
| actor_user_id | uuid | FK users.id, nullable | User tao su kien. |
| type | varchar(80) | not null | Loai thong bao. |
| title | varchar(255) | not null | Tieu de. |
| body | text | nullable | Noi dung. |
| reference_type | varchar(50) | nullable | Loai doi tuong lien quan. |
| reference_id | uuid | nullable | ID doi tuong lien quan. |
| status | notification_status | not null, default UNREAD | UNREAD hoac READ. |
| read_at | timestamp | nullable | Ngay doc. |
| created_at | timestamp | not null | Ngay tao. |

Relationship:

- Nhieu notification gui den mot recipient user.
- Actor user la optional.

### 2.34. audit_logs

Mo ta: Nhat ky hanh dong quan trong cho MVP.

| Attribute | Type | Constraint | Mo ta |
| --- | --- | --- | --- |
| id | uuid | PK | Dinh danh audit log. |
| actor_user_id | uuid | FK users.id, nullable | User thuc hien. |
| action | varchar(100) | not null | Hanh dong. |
| entity_type | varchar(100) | not null | Loai entity. |
| entity_id | uuid | nullable | ID entity. |
| before_json | json | nullable | Du lieu truoc. |
| after_json | json | nullable | Du lieu sau. |
| ip_address | varchar(64) | nullable | Dia chi IP. |
| user_agent | text | nullable | User agent. |
| created_at | timestamp | not null | Ngay tao. |

Relationship:

- Nhieu audit log co the thuoc mot actor user.
- `entity_type/entity_id` la polymorphic reference, khong ep FK vat ly.

## 3. Relationship Tong Hop

### 3.1. Account va profile

- `users.id` 1-n `user_sessions.user_id`.
- `users.id` 1-0..1 `admin_profiles.user_id`.
- `users.id` 1-0..1 `student_profiles.user_id`.
- `users.id` 1-0..1 `sme_profiles.user_id`.

### 3.2. Verification va file

- `student_profiles.id` 1-n `student_verifications.student_profile_id`.
- `files.id` 1-n `student_verifications.document_file_id`.
- `users.id` 1-n `student_verifications.reviewed_by_admin_id`.
- `users.id` 1-n `files.owner_user_id`.

### 3.3. SME subscription

- `sme_profiles.id` 1-n `sme_subscriptions.sme_profile_id`.
- `subscription_plans.id` 1-n `sme_subscriptions.subscription_plan_id`.

### 3.4. Project marketplace

- `sme_profiles.id` 1-n `projects.sme_profile_id`.
- `student_profiles.id` 1-n `projects.selected_student_profile_id`.
- `design_categories.id` 1-n `projects.design_category_id`.
- `projects.id` 1-n `project_attachments.project_id`.
- `files.id` 1-n `project_attachments.file_id`.
- `projects.id` 1-n `project_applications.project_id`.
- `student_profiles.id` 1-n `project_applications.student_profile_id`.
- `projects.id` 1-n `project_offers.project_id`.
- `student_profiles.id` 1-n `project_offers.student_profile_id`.
- `project_applications.id` 1-n `project_offers.application_id`.
- `projects.id` 1-n `project_status_histories.project_id`.
- `users.id` 1-n `project_status_histories.changed_by_user_id`.

### 3.5. Milestone va submission

- `projects.id` 1-n `project_milestones.project_id`.
- `projects.id` 1-n `project_submissions.project_id`.
- `project_milestones.id` 1-n `project_submissions.milestone_id`.
- `student_profiles.id` 1-n `project_submissions.submitted_by_student_id`.
- `project_submissions.id` 1-n `submission_files.submission_id`.
- `files.id` 1-n `submission_files.file_id`.
- `files.id` 1-n `submission_files.watermarked_file_id`.
- `projects.id` 1-n `review_actions.project_id`.
- `project_submissions.id` 1-n `review_actions.submission_id`.
- `users.id` 1-n `review_actions.reviewer_user_id`.
- `projects.id` 1-n `revision_requests.project_id`.
- `project_submissions.id` 1-n `revision_requests.submission_id`.
- `users.id` 1-n `revision_requests.requested_by_user_id`.
- `projects.id` 1-n `invalid_file_reports.project_id`.
- `project_submissions.id` 1-n `invalid_file_reports.submission_id`.
- `users.id` 1-n `invalid_file_reports.reported_by_user_id`.

### 3.6. Escrow, payment va wallet

- `projects.id` 1-0..1 `escrows.project_id`.
- `sme_profiles.id` 1-n `escrows.sme_profile_id`.
- `student_profiles.id` 1-n `escrows.student_profile_id`.
- `users.id` 1-n `payments.payer_user_id`.
- `escrows.id` 1-n `payments.escrow_id`.
- `escrows.id` 1-n `refunds.escrow_id`.
- `payments.id` 1-n `refunds.payment_id`.
- `users.id` 1-n `refunds.created_by_user_id`.
- `escrows.id` 1-n `disbursements.escrow_id`.
- `wallets.id` 1-n `disbursements.wallet_id`.
- `users.id` 1-0..1 `wallets.owner_user_id`.
- `student_profiles.id` 1-0..1 `wallets.student_profile_id`.
- `wallets.id` 1-n `wallet_transactions.wallet_id`.
- `users.id` 1-n `payment_methods.user_id`.
- `wallets.id` 1-n `withdrawal_requests.wallet_id`.
- `users.id` 1-n `withdrawal_requests.requested_by_user_id`.
- `payment_methods.id` 1-n `withdrawal_requests.payment_method_id`.

### 3.7. Dispute, rating, notification, audit

- `projects.id` 1-n `disputes.project_id`.
- `escrows.id` 1-n `disputes.escrow_id`.
- `users.id` 1-n `disputes.opened_by_user_id`.
- `users.id` 1-n `disputes.against_user_id`.
- `users.id` 1-n `disputes.assigned_admin_id`.
- `disputes.id` 1-n `dispute_evidences.dispute_id`.
- `users.id` 1-n `dispute_evidences.submitted_by_user_id`.
- `files.id` 1-n `dispute_evidences.file_id`.
- `projects.id` 1-n `ratings.project_id`.
- `users.id` 1-n `ratings.rater_user_id`.
- `users.id` 1-n `ratings.rated_user_id`.
- `users.id` 1-n `notifications.recipient_user_id`.
- `users.id` 1-n `notifications.actor_user_id`.
- `users.id` 1-n `audit_logs.actor_user_id`.

## 4. MVP Business Notes

- Mot user chi co mot role chinh.
- Moi Student/SME/Admin profile co quan he 1-1 voi `users`.
- SME Basic mac dinh chi duoc toi da 2 active open projects va budget toi da 5.000.000 VND.
- Student chi duoc ung tuyen mot lan tren moi project.
- Project chi bat dau khi payment thanh cong, escrow funded va Student chap nhan offer.
- Moi project in progress co dung 2 milestone MVP: SKETCH va FINAL.
- Final chi nen duoc submit sau khi Sketch da duoc approved hoac auto-approved.
- Original final file chi duoc downloadable sau khi final approved hoac Admin dispute decision cho phep.
- Khi final approved, he thong tao disbursement va wallet transaction de cong tien net cho Student.
- Withdrawal request chi hop le khi wallet active, Student `can_withdraw = true`, va so tien dat toi thieu 50.000 VND.
- Dispute open/disputed phai khoa release escrow.
- Rating chi tao trong 7 ngay sau khi project completed.
