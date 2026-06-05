# D4U Outcome 1 Backlog

Source of truth for Outcome 1: `D:\Download\D4U_Outcome1_Master.docx`.

This backlog is scoped to the Outcome 1 demo path only. Items moved to `Post-Outcome 1 / MVP Expansion` are intentionally outside this checklist even if they exist in broader MVP documents. Latest code audit: backend `dotnet build` passes, but the unchecked items below remain gaps against the Outcome 1 master document.

## Outcome 1 Scope

### Foundation, Auth, Profile, and Admin Verification

- [x] Register with email, password, full name, and role.
- [x] Send account email verification code after registration.
- [x] Block email/password login until account email is verified.
- [x] Allow guests to request and confirm account email verification code.
- [x] Login with email/password.
- [x] Add Google OAuth login for `STUDENT` and `SME` users.
- [x] Restrict Google self-registration to `STUDENT` and `SME`; Admin uses bootstrap/shared auth only.
- [x] Create JWT access token and refresh session on login.
- [x] Rotate refresh token and retry authenticated requests after `401`.
- [x] Logout by revoking refresh sessions.
- [x] Return current user from `/auth/me`.
- [x] Hash passwords before persistence.
- [x] Store Google external login metadata without storing Google access tokens.
- [x] Enforce account statuses: `PENDING`, `ACTIVE`, `SUSPENDED`, `BANNED`, `DELETED`.
- [x] Block suspended, banned, and deleted users from business actions.
- [x] Student can create and update profile with school, major, study start year, and bio.
- [x] SME can create and update profile with company name, representative, phone, business field, and optional logo.
- [x] Student can upload document verification metadata.
- [x] System creates student verification request with `PENDING` status.
- [x] Admin can list student verification requests.
- [x] Admin can view student verification request details and document before deciding.
- [x] Admin can approve student verification.
- [x] Admin can reject student verification with rejection reason.
- [x] Student profile verification status updates after admin decision.
- [x] Bootstrap an initial Admin account.
- [ ] Seed demo accounts for Outcome 1: one Admin, one SME, and one verified Student.

### File Metadata and Seed Data

- [x] Store upload metadata for files with provider, bucket, storage key, filename, MIME type, extension, size, visibility, and scan status.
- [x] Enforce allowed file extensions in service layer: `jpg`, `png`, `pdf`.
- [x] Seed initial active design categories.
- [x] Seed Basic, Pro, and Premium subscription plans.
- [ ] Subscription seed and publish rules match Outcome 1: Basic `10%`, max 2 active open projects, max 5,000,000 VND; Pro `7%`, max 10 active open projects, max 20,000,000 VND; Premium `5%`, unlimited project count and budget.

### Project, Marketplace, Application, and Offer

- [x] SME can create draft project.
- [x] Project captures title, brief, usage purpose, design category, type, budget, deadlines, confidentiality, and portfolio permission.
- [x] Validate budget is greater than zero.
- [x] Validate sketch deadline is before or equal to final deadline.
- [x] Validate final deadline is before or equal to total deadline.
- [x] SME can publish open project.
- [x] Publish enforces subscription active open project limit.
- [x] Publish enforces subscription max budget.
- [ ] Basic plan cannot publish more than 2 active open projects.
- [x] Basic plan cannot publish project over 5,000,000 VND.
- [x] Create project status history for important transitions.
- [x] SME can cancel own draft/open/private-invited project before execution.
- [x] Student can list and view open projects.
- [x] Student can submit application for an open project.
- [x] Duplicate applications are blocked by service validation and database uniqueness.
- [x] Application captures proposed price, cover letter/solution note, and optional estimated duration.
- [x] SME can view applications for own project.
- [x] SME can select an application and create offer.
- [x] Offer starts as `WAITING_ACCEPTANCE`.
- [x] Student can accept offer before SME funds escrow.
- [x] Student can reject offer.
- [x] Accepted offer selects student and waits for SME escrow payment.
- [x] Offer expires if Student does not accept or reject within 48 hours.
- [x] Accepted offer expires if SME does not pay within 72 hours.
- [x] Expired/rejected offers release the project back to `OPEN` or `PRIVATE_INVITED` when no other active offer blocks it.
- [x] Offer state transitions are validated by a single service/state machine helper.
- [x] SME cannot start escrow payment before Student accepts the offer.

### PayOS Escrow Payment

- [x] Create Payment record before calling PayOS provider.
- [x] Create or reuse escrow when SME starts offer payment.
- [x] Store escrow amount, currency, fee rate, fee amount, and status.
- [x] Start escrow payment through PayOS real payment-in.
- [x] Return PayOS payment link or QR payment data to the client.
- [x] Store payment provider, provider transaction id, status, and paid timestamp.
- [x] Enforce unique provider transaction id per provider.
- [x] Validate PayOS webhook signature before processing business logic.
- [x] Do not trust client-submitted payment success.
- [x] Payment success funds escrow.
- [x] Funded escrow moves project to `IN_PROGRESS`.
- [x] Project cannot start unless escrow is funded.
- [x] Payment `FAILED`, `CANCELLED`, or `EXPIRED` cannot start a project.
- [x] Pending payment expiry marks stale payment records safely and releases the accepted offer when appropriate.
- [x] Expired checkout records move from `PENDING` to `EXPIRED` independently of the 72-hour SME payment window.
- [x] Background job or hosted service handles offer/payment expiry idempotently.
- [x] Keep a mock/sandbox payment provider only for local development and automated tests.
- [x] Frontend SME offer/application screen shows escrow payment CTA only after Student acceptance.
- [x] Frontend displays PayOS checkout link or QR payment information.
- [x] Frontend payment success/cancel pages guide the user back to the project workspace and refresh backend status.

### Execution, Submission, Review, and Completion

- [x] PayOS-funded accepted offer starts project as `IN_PROGRESS`.
- [x] Submission model uses fixed milestone type `SKETCH` or `FINAL` without requiring a separate milestone table.
- [x] Student can submit Sketch with valid file metadata.
- [x] Submission upload validates extension: `jpg`, `png`, `pdf`.
- [x] Submission upload validates file size up to 20MB.
- [x] Submission upload validates file signature.
- [x] Project moves to Sketch submitted/in-review status.
- [x] SME can approve Sketch.
- [x] System auto-approves Sketch after 5 business days without SME review.
- [x] Student can submit Final only after Sketch is approved or auto-approved.
- [x] Student can submit Final files.
- [x] Project moves to Final submitted/in-review status.
- [x] SME can approve Final.
- [x] System auto-approves Final after 5 business days without SME review.
- [x] Final approval moves project to `COMPLETED`.
- [x] Escrow moves to `RELEASE_PENDING`.
- [x] Calculate platform fee from escrow amount and stored fee rate.
- [x] Create disbursement with gross amount, platform fee, and net amount.
- [x] Credit Student wallet available balance with net amount.
- [x] Create wallet transaction `DISBURSEMENT_CREDIT`.
- [x] Escrow moves to `RELEASED`.
- [x] Disbursement is idempotent and does not double-credit wallet.
- [x] Project rating due date is set to 7 days after completion.
- [x] SME can request revision through `review_actions` with requested changes and due date.
- [x] Project moves to `REVISION_REQUESTED`.
- [x] Student can submit revision for the requested milestone.
- [x] SME can report invalid file through `review_actions`.
- [x] Invalid file review action captures reason, description, status, and reupload due date.
- [x] Admin can force complete or cancel a project in `ADMIN_REVIEW`.
- [ ] Revision over `maxRevisionRounds` moves project to `ADMIN_REVIEW`.

### Student Abandoned and SME Refund

- [x] Student can abandon an in-progress project before any submission.
- [x] Student abandon requires a reason.
- [x] Student abandon is blocked after any submission.
- [x] Student abandon moves project to `STUDENT_ABANDONED`.
- [x] Student abandon moves escrow to `REFUND_PENDING`.
- [x] Student abandon creates pending refund request for Admin manual processing.
- [x] Auto-detect job marks projects past sketch deadline with no submission as `STUDENT_ABANDONED`.
- [x] Auto-detect job moves escrow to `REFUND_PENDING` and creates pending refund request.
- [x] Admin can list pending SME refunds.
- [x] Admin can mark manual SME refund completed and move escrow to `REFUNDED`.
- [ ] Refund admin flow matches Outcome 1 expectation or documents accepted deviation: master doc describes refund in withdrawal list with `isRefund=true`, current code uses separate `/admin/refunds`.
- [x] Mid-project cancellation and partial refund split rules are deferred beyond Outcome 1.
- [x] PayOS refund API is out of Outcome 1; Admin manual refund is sufficient.

### Wallet and Withdrawal

- [x] Student has wallet with available, pending, locked balances, currency, and status.
- [x] Student can create bank account payment method with bank name, holder name, and account number.
- [x] Admin can view protected full account number for manual withdrawal transfer.
- [x] Student can request withdrawal.
- [x] Withdrawal requires wallet `ACTIVE`.
- [x] Withdrawal requires student `can_withdraw = true`.
- [x] Withdrawal minimum amount is 50,000 VND.
- [x] Withdrawal fee is 5,000 VND.
- [x] Only one pending or processing withdrawal is allowed.
- [x] Admin/Finance can manually process withdrawal request after external bank transfer.
- [x] Successful withdrawal creates `WITHDRAWAL_DEBIT` wallet transaction.
- [x] Failed withdrawal creates `WITHDRAWAL_FAILED_REVERSAL` wallet transaction and allows Student to request again.
- [x] Wallet balance must never go negative.
- [x] Wallet non-negative balance is enforced by database constraint as well as service validation.
- [x] Automatic bank payout and direct bank balance synchronization are out of Outcome 1.
- [ ] Frontend Student wallet displays withdrawal fee as 5,000 VND and net amount as `amount - 5,000 VND`.

### Rating

- [x] Rating is available only after project is completed.
- [x] Student can rate SME.
- [x] SME can rate Student.
- [x] Enforce one rating per rater, rated user, and project.
- [x] Rating value must be integer 1 to 5.
- [x] Rating comment maximum is 500 characters.
- [x] Rating is allowed only within 7 days after completion.
- [x] Rating updates profile average rating.
- [ ] Real rating UI exists for Student and SME instead of placeholder pages.
- [ ] Rating window expired response matches Outcome 1 acceptance or documents accepted deviation: master doc expects `410`, current backend returns conflict-style response.

### Notifications

- [x] Create in-app notification for `NEW_OFFER` to Student.
- [x] Create in-app notification for `PAYMENT_SUCCESS` to Student.
- [x] Create in-app notification for `NEW_SUBMISSION` to SME.
- [x] Create in-app notification for `REVIEW_ACTION` to Student.
- [x] Create in-app notification for `ESCROW_RELEASED` to Student.
- [x] List notifications newest-first.
- [x] Mark notification as read.
- [x] Mark all notifications as read.
- [ ] Add unread count endpoint or document accepted API deviation from `GET /notifications/unread-count`.
- [ ] Add frontend notification UI for Outcome 1 demo.
- [ ] Notification creation is non-blocking and does not rollback the main business transaction if notification creation fails.

### Audit Logs

- [x] Record audit logs for important project status changes.
- [x] Record audit log for escrow release.
- [x] Record audit log for escrow refund.
- [x] Record audit log for wallet balance changes during disbursement.
- [x] Record audit log for withdrawal processing.
- [x] Record audit log for auto-approval and Admin review decisions with machine-readable reasons.
- [ ] Record audit log for `PAYMENT_WEBHOOK_SUCCESS`.
- [ ] Record audit log for `PAYMENT_WEBHOOK_FAILED`.
- [ ] Record audit log for `ESCROW_FUNDED`.

### Demo Readiness

- [x] Backend `dotnet build` passes for the current codebase.
- [x] Core interaction guide exists for SME/Student happy path.
- [x] Completed feature E2E guide exists.
- [ ] Outcome 1 demo script runs all 8 steps end-to-end without blocking error.
- [ ] Seed demo data includes ready-to-use Admin, SME, and verified Student accounts.
- [ ] Frontend build passes.
- [ ] Desktop and mobile demo routes have no blocking overflow.
- [ ] API response time for ordinary demo actions is under 2 seconds in staging/demo environment.

## Post-Outcome 1 / MVP Expansion

These items are outside Outcome 1 according to `D4U_Outcome1_Master.docx`. Do not block Outcome 1 completion on them unless the source-of-truth document changes.

### AI Project Brief Assistant

- [x] SME can request AI assistance from raw project idea before or during draft project creation.
- [x] AI assistant returns suggested title, brief, usage purpose, deliverables, design category hint, and deadline notes.
- [x] SME must review and edit AI suggestions before saving or publishing a project.
- [x] AI assistant must not publish projects, select students, set final pricing automatically, or bypass subscription limits.
- [x] Store no AI conversation history in MVP; use the response only to prefill the project form.

### EDU Email Verification Polish

- [x] Student can request verification through an `.edu` or approved school email address.
- [x] System validates student email domain against MVP school domain rules or whitelist.
- [x] System sends an EDU verification code/link through SMTP and does not expose the code in the web UI.
- [x] Student can confirm EDU email verification code/link.
- [x] Successful EDU email verification updates student verification status or creates an approved verification record.
- [x] Frontend student verification UI clearly supports document metadata upload and EDU email verification.

### Portfolio Builder

- [ ] Student can create and update a portfolio profile summary.
- [ ] Student can create portfolio items with title, description, design category, role, tools, skills, and external link.
- [ ] Student can attach portfolio item file metadata for jpg, png, and pdf files.
- [ ] Student can mark portfolio items as public or private.
- [ ] Student can feature or pin selected portfolio items.
- [ ] Student can attach completed D4U project output to portfolio only when project confidentiality and `allowStudentPortfolio` permit it.
- [ ] System blocks portfolio publishing for confidential projects or projects that do not allow Student portfolio use.
- [ ] SME can view a Student public portfolio while reviewing applications or offers.
- [ ] Admin can hide inappropriate public portfolio items.
- [ ] Record audit log for portfolio item create, update, publish, hide, and delete actions.

### Broad Notifications and Audit Beyond Outcome 1

- [ ] Create in-app notification for verification approved/rejected.
- [ ] Create in-app notification for project published.
- [ ] Create in-app notification for new application.
- [ ] Create in-app notification for payment failed.
- [ ] Create in-app notification for offer accepted/rejected.
- [x] Create in-app notification for revision request.
- [x] Create in-app notification for invalid file report.
- [x] Create in-app notification for withdrawal request status changes.
- [ ] Create in-app notification for rating received.
- [ ] Record audit log for admin verification decisions.
- [ ] Record audit log for SME publish/cancel project.
- [ ] Use audit logs as the primary source for project status transition history in the optimized MVP model.
- [ ] Record audit log for user suspended/banned.

### Paid Feature Access Packages

- [ ] Define purchasable feature access packages for `STUDENT` and `SME` roles.
- [ ] Package catalog captures role, name, code, price, currency, duration, feature entitlements, usage limits, and active status.
- [ ] Student can view packages available for Student accounts.
- [ ] SME can view packages available for SME accounts.
- [ ] Student can purchase a package to unlock premium Student features.
- [ ] SME can purchase a package to unlock premium SME features or increase selected limits.
- [ ] Package purchase creates a payment record and starts as pending until payment succeeds through PayOS.
- [ ] Package payment returns PayOS payment link or QR payment data to the client.
- [ ] Package payment webhook/callback is idempotent and cannot be spoofed by client-side success state.
- [ ] Successful payment activates package entitlement for the purchasing user.
- [ ] Expired or cancelled entitlements no longer unlock paid features.
- [ ] System checks active entitlements before allowing paid features.
- [ ] Admin can view package purchases and entitlement status for support.
- [ ] Record audit log for package purchase, activation, expiry, and cancellation.

### AI Matching

- [ ] Student package can unlock AI matched project suggestions.
- [ ] SME package can unlock AI matched student recommendations for a project.
- [ ] Student can request AI matched open project suggestions when they have an active matching entitlement.
- [ ] SME can request AI matched student recommendations for an owned project when they have an active matching entitlement.
- [ ] AI matching uses project brief, category, budget, deadline, student profile, verification status, application history, ratings, and declared skills when available.
- [ ] AI matching returns ranked candidates or projects with match score, reasons, and missing-data warnings.
- [ ] AI matching results are recommendations only; the system must not auto-apply, auto-invite, auto-select, auto-price, or auto-publish.
- [ ] Store matching request metadata and returned result summaries for audit/debug, without storing raw private prompts longer than necessary.
- [ ] Cache recent matching results for the same user/project input to control AI cost.
- [ ] Enforce rate limits per user and package entitlement.
- [ ] Admin can disable AI matching feature access globally if AI provider is unavailable.

### Explicitly Out of Outcome 1

- [x] Do not implement non-Google social login providers.
- [x] Do not implement realtime chat.
- [x] Do not implement AI verification approval, AI auto-publishing, AI auto-selection, or AI pricing decisions.
- [x] Do not implement dispute open/evidence/resolve workflow.
- [x] Do not implement dispute appeal.
- [x] Do not implement advanced portfolio marketplace, portfolio analytics, or portfolio monetization.
- [x] Do not implement reputation ledger.
- [x] Do not implement broad email/push delivery pipeline beyond account email verification.
- [x] Do not implement automatic recurring subscription billing in Outcome 1.
- [x] Do not implement advanced bank KYC.
- [x] Do not implement automatic bank payout or direct bank account balance synchronization.
- [x] Do not implement mobile-native features.
- [x] Do not implement partial refund by milestone in Outcome 1.
- [x] Do not implement mid-project SME cancel in Outcome 1.
- [x] Do not implement PayOS refund API in Outcome 1.

## Optimized Data Model Follow-up

- [ ] Move current SME plan reference into `sme_profiles.subscription_plan_id` for MVP and remove standalone `sme_subscriptions` from optimized ERD/docs.
- [ ] Remove standalone `project_milestones`; store fixed Sketch/Final milestone type on `project_submissions`.
- [ ] Remove standalone `revision_requests`; store revision request details on `review_actions`.
- [ ] Remove standalone `invalid_file_reports`; store invalid file report details on `review_actions`.
- [ ] Remove standalone `project_status_histories` from optimized ERD/docs and use `audit_logs` for lifecycle transitions.
- [ ] Keep migration/code refactor for the optimized data model in a dedicated feature branch because it changes persistence shape.

## AI Implementation Strategy

- [ ] Split AI/vibe coding work into one module per prompt/branch.
- [ ] Each module prompt includes related schema, API contract, business rules, error cases, expected tests, and assumptions.
- [ ] Require assumptions list at the end of every AI-generated module.
- [ ] Keep webhook controllers thin; payment business rules must live in application services.
- [ ] Do not allow AI features to auto-apply, auto-select, auto-price, auto-publish, or approve verification.
