# D4U MVP Backlog

This backlog is derived from `MVP_D4U.md` and keeps the first build limited to the approved MVP scope.

## Phase 1 - Foundation

### Auth and Account

- [x] Register with email, username, password, full name, and role.
- [x] Send SMTP email verification code after email/password registration.
- [x] Block email/password login until account email is verified.
- [x] Allow guests to request and confirm account email verification code.
- [x] Login with email/password.
- [x] Add `Continue with Google` authentication for MVP users.
- [x] Accept Google ID token or OAuth callback and verify issuer, audience, expiry, email, and Google subject.
- [x] Create or link a local D4U user from verified Google email.
- [x] Restrict self-registration through Google to `STUDENT` and `SME`; Admin still uses bootstrap/shared auth only.
- [x] Create JWT access token and refresh session after successful Google authentication.
- [x] Store external login provider metadata without storing Google access tokens in MVP.
- [x] Hash passwords before persistence.
- [x] Create refresh sessions on login.
- [x] Logout by revoking refresh sessions.
- [x] Return current user from `/auth/me`.
- [x] Enforce account statuses: `PENDING`, `ACTIVE`, `SUSPENDED`, `BANNED`, `DELETED`.
- [x] Block suspended, banned, and deleted users from business actions.

### Profiles and Verification

- [x] Student can create and update profile with school, major, study start year, and bio.
- [x] SME can create and update profile with company name, representative, phone, business field, and optional logo.
- [x] Student can upload verification document metadata.
- [x] Student can request verification through an `.edu` or approved school email address.
- [x] System validates student email domain against MVP school domain rules or whitelist.
- [x] System sends an EDU verification code/link through SMTP and does not expose the code in the web UI.
- [x] Student can confirm EDU email verification code/link.
- [x] Successful EDU email verification updates student verification status or creates an approved verification record.
- [x] Frontend student verification UI clearly supports two methods: document metadata upload and EDU email verification.
- [x] System creates student verification request.
- [x] Admin can approve student verification.
- [x] Admin can reject student verification with rejection reason.
- [x] Student profile verification status updates after admin decision.
- [x] Bootstrap an initial Admin account for MVP operations.
- [x] Admin can log in with email/password through the shared auth endpoint.
- [x] Admin can list student verification requests.
- [x] Admin can view student verification request details before deciding.

### File Metadata and Seeds

- [x] Store upload metadata for files with provider, bucket, storage key, filename, MIME type, extension, size, visibility, and scan status.
- [x] Enforce MVP allowed file extensions in service layer: jpg, png, pdf.
- [x] Seed Basic, Pro, and Premium subscription plans.
- [x] Seed initial active design categories.

## Phase 2 - Marketplace

### AI Project Brief Assistant

- [x] SME can request AI assistance from raw project idea before or during draft project creation.
- [x] AI assistant returns suggested title, brief, usage purpose, deliverables, design category hint, and deadline notes.
- [x] SME must review and edit AI suggestions before saving or publishing a project.
- [x] AI assistant must not publish projects, select students, set final pricing automatically, or bypass subscription limits.
- [x] Store no AI conversation history in MVP; use the response only to prefill the project form.

### Project Creation and Publishing

- [x] SME can create draft project.
- [x] Project captures title, brief, usage purpose, design category, type, budget, deadlines, revision limit, confidentiality, and portfolio permission.
- [x] Validate budget is greater than zero.
- [x] Validate sketch deadline is before or equal to final deadline.
- [x] Validate final deadline is before or equal to total deadline.
- [x] SME can publish open project.
- [x] Enforce subscription active open project limit on publish.
- [x] Enforce subscription max budget on publish.
- [x] Basic plan cannot publish more than 2 active open projects.
- [x] Basic plan cannot publish project over 5,000,000 VND.
- [x] Create project status history for important transitions.
- [x] SME can cancel own draft/open/private-invited project.
- [x] Student can list and view open projects.

### Applications and Offers

- [x] Student can submit one application per open project.
- [x] Duplicate applications are blocked by service validation, database uniqueness, and Student UI state.
- [x] Application captures proposed price, cover letter, and estimated duration.
- [x] SME can view applications for own project.
- [x] SME can select an application and create offer.
- [x] SME can create private project offer without an application.
- [x] Offer starts as `WAITING_ACCEPTANCE`.
- [x] Student can accept offer before SME funds escrow.
- [x] Student can reject offer.
- [x] Accepted offer selects student and waits for SME escrow payment.
- [x] Offer expires if Student does not accept or reject within 48 hours.
- [x] Expired/rejected offers release the project back to `OPEN` or `PRIVATE_INVITED` when no other active offer blocks it.
- [x] Offer state transitions are validated by a single service/state machine helper.

## Phase 3A - PayOS Escrow Payment

### Escrow and Payment

- [x] Create or reuse escrow when SME starts offer payment.
- [x] Store escrow amount, currency, fee rate, fee amount, and status.
- [x] Start escrow payment through PayOS real payment-in.
- [x] Return PayOS payment link or QR payment data to the client.
- [x] Store payment provider, provider transaction id, status, and paid timestamp.
- [x] Enforce unique provider transaction id per provider.
- [x] Validate PayOS webhook signature or equivalent trusted callback data.
- [x] Do not trust client-submitted payment success.
- [x] Payment success funds escrow.
- [x] SME can start escrow payment only after Student accepts offer.
- [x] Funded escrow moves project to `IN_PROGRESS`.
- [x] Project cannot start unless escrow is funded.
- [x] SME payment window expires after 72 hours from Student acceptance.
- [x] Payment `FAILED`, `CANCELLED`, or `EXPIRED` cannot start a project.
- [x] Pending payment expiry marks stale payment records safely and releases the accepted offer when appropriate.
- [x] Background job or hosted service handles offer/payment expiry idempotently.
- [x] Keep a mock/sandbox payment provider only for local development and automated tests.
- [x] Frontend SME offer/application screen shows `Thanh toán escrow`.
- [x] Frontend displays PayOS checkout link or QR payment information.
- [x] Frontend payment success/cancel pages guide the user back to the project flow.

## Phase 3B - Project Execution

### Milestones and Submissions

- [x] PayOS-funded accepted offer starts project as `IN_PROGRESS`.
- [x] Submission model uses fixed milestone type `SKETCH` or `FINAL` without requiring a separate milestone table.
- [x] Student can submit Sketch with valid file metadata.
- [x] Project moves to Sketch submitted or in review status.
- [x] SME can approve Sketch.
- [x] System auto-approves Sketch after 5 business days without SME review.
- [x] Student can submit Final only after Sketch approved or auto-approved.
- [x] Student can submit Final files.
- [x] Project moves to Final submitted or in review status.
- [x] System auto-approves Final after 5 business days without SME review and triggers completion/disbursement flow.
- [x] Store submission type, revision round, description, status, and submitted timestamp.
- [x] Store submission files with optional watermarked file and original-download permission.

### Review, Revision, and Invalid Files

- [x] SME can approve final submission.
- [x] SME can request revision through `review_actions` with requested changes and due date.
- [x] Project moves to `REVISION_REQUESTED`.
- [x] Student can submit revision.
- [x] Revision round cannot exceed project max revision rounds.
- [x] When revision limit is reached, SME cannot request another revision.
- [x] Project can move to `ADMIN_REVIEW` when revision limit blocks normal resolution.
- [x] Admin can force complete or cancel a project in `ADMIN_REVIEW`.
- [x] SME can report invalid file through `review_actions`.
- [x] Invalid file review action captures reason, description, status, and reupload due date.
- [x] Auto-approve and Admin review decisions create audit logs with machine-readable reasons.

## Phase 4 - Completion and Money Movement

### Completion and Disbursement

- [x] Final approval moves project to `COMPLETED`.
- [x] Escrow moves to `RELEASE_PENDING`.
- [x] Calculate platform fee from escrow amount and stored fee rate.
- [x] Create disbursement with gross amount, fee, and net amount.
- [x] Credit Student wallet available balance with net amount.
- [x] Create wallet transaction `DISBURSEMENT_CREDIT`.
- [x] Escrow moves to `RELEASED`.
- [x] Project rating due date is set to 7 days after completion.
- [ ] Mid-project cancellation before Sketch refunds 100% to SME and 0% to Student.
- [ ] Mid-project cancellation after Sketch approved refunds 60% to SME and pays 40% to Student.
- [ ] Mid-project cancellation after Final submitted refunds 20% to SME and pays 80% to Student.
- [ ] Student abandon past deadline refunds 70% to SME and pays 30% to Student.

### Wallet and Withdrawal

- [x] Student has wallet with available, pending, locked balances, currency, and status.
- [x] Student can create bank account payment method.
- [x] Student can request withdrawal.
- [x] Withdrawal requires wallet `ACTIVE`.
- [x] Withdrawal requires student `can_withdraw = true`.
- [x] Withdrawal minimum amount is 50,000 VND.
- [x] Withdrawal fee is 5,000 VND.
- [x] Admin/Finance can manually process withdrawal request after external bank transfer.
- [x] Successful withdrawal creates debit transaction.
- [x] Failed withdrawal creates reversal transaction.
- [x] Wallet balance must never go negative.
- [x] Wallet non-negative balance is enforced by database constraint as well as service validation.
- [x] MVP does not perform automatic bank payout or direct bank account balance synchronization.

## Phase 5 - Trust and Operations

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

### Ratings

- [ ] Rating is available only after project completed.
- [ ] Student can rate SME.
- [ ] SME can rate Student.
- [ ] Enforce one rating per rater, rated user, and project.
- [ ] Rating value must be 1 to 5.
- [ ] Rating comment maximum is 500 characters.
- [ ] Rating is allowed only within 7 days after completion.
- [ ] Rating updates profile average rating and completed project count.

### Notifications and Audit

- [ ] Create in-app notification for verification approved/rejected.
- [ ] Create in-app notification for project published.
- [ ] Create in-app notification for new application.
- [ ] Create in-app notification for new offer.
- [ ] Create in-app notification for payment success/failed.
- [ ] Create in-app notification for offer accepted/rejected.
- [ ] Create in-app notification for new submission.
- [ ] Create in-app notification for review action.
- [ ] Create in-app notification for revision request.
- [ ] Create in-app notification for invalid file report.
- [ ] Create in-app notification for escrow released.
- [ ] Create in-app notification for withdrawal request status changes.
- [ ] Create in-app notification for rating received.
- [ ] Mark notification as read.
- [ ] Record audit log for admin verification decisions.
- [ ] Record audit log for SME publish/cancel project.
- [ ] Record audit log for project status changes.
- [ ] Use audit logs as the primary source for project status transition history in the optimized MVP model.
- [ ] Record audit log for payment webhook success/failed.
- [ ] Record audit log for escrow funded/released/refunded.
- [ ] Record audit log for wallet balance changes.
- [ ] Record audit log for withdrawal processing.
- [ ] Record audit log for user suspended/banned.

## Phase 6 - Paid Feature Access and AI Matching

### Feature Access Packages

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

### Student Paid Features

- [ ] Student package can unlock AI matched project suggestions.
- [ ] Student package can unlock higher application visibility or priority application placement.
- [ ] Student package can unlock extended portfolio/profile visibility when portfolio features exist.
- [ ] Student package limits are enforced per active entitlement and billing period.

### SME Paid Features

- [ ] SME package can unlock AI matched student recommendations for a project.
- [ ] SME package can unlock additional active open project slots beyond the base plan.
- [ ] SME package can unlock higher project budget ceilings beyond the base plan.
- [ ] SME package can unlock premium project visibility when featured project placement exists.
- [ ] SME package limits compose with existing subscription plan limits without bypassing payment rules.

### AI Matching

- [ ] Student can request AI matched open project suggestions when they have an active matching entitlement.
- [ ] SME can request AI matched student recommendations for an owned project when they have an active matching entitlement.
- [ ] AI matching uses project brief, category, budget, deadline, student profile, verification status, application history, ratings, and declared skills when available.
- [ ] AI matching returns ranked candidates or projects with match score, reasons, and missing-data warnings.
- [ ] AI matching results are recommendations only; the system must not auto-apply, auto-invite, auto-select, auto-price, or auto-publish.
- [ ] Store matching request metadata and returned result summaries for audit/debug, without storing raw private prompts longer than necessary.
- [ ] Cache recent matching results for the same user/project input to control AI cost.
- [ ] Enforce rate limits per user and package entitlement.
- [ ] Admin can disable AI matching feature access globally if AI provider is unavailable.

## Explicitly Out of MVP

- [ ] Do not implement non-Google social login providers.
- [ ] Do not implement realtime chat.
- [ ] Do not implement AI verification approval, AI auto-publishing, AI auto-selection, or AI pricing decisions.
- [ ] Do not implement dispute open/evidence/resolve workflow in MVP.
- [ ] Do not implement dispute appeal.
- [ ] Do not implement advanced portfolio marketplace, portfolio analytics, or portfolio monetization.
- [ ] Do not implement reputation ledger.
- [ ] Do not implement broad email/push delivery pipeline beyond account email verification and EDU verification email.
- [ ] Do not implement automatic recurring subscription billing; paid feature access is handled as explicit package purchases.
- [ ] Do not implement advanced bank KYC.
- [ ] Do not implement automatic bank payout or direct bank account balance synchronization.
- [ ] Do not implement mobile-native features.

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
