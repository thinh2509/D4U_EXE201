# D4U MVP Description

## 1. MVP Goal

The D4U MVP validates the core marketplace loop: an SME posts a design project, a Student Designer applies or receives an offer, the SME funds escrow, the Student submits Sketch and Final deliverables, the SME reviews the work, funds are released to the Student wallet, and both parties can rate each other.

The MVP is intentionally narrower than the full D4U product. It should be production-shaped enough to validate real workflows, but small enough to build, test, and iterate quickly.

## 2. Definition of Success

The demo-critical MVP is complete when:

- Guests can register with email/password, verify account email, and then log in.
- Guests can continue with Google for Student or SME account access.
- Students and SMEs can create their required profiles.
- Students can verify through document metadata upload or approved EDU email verification.
- Admin can approve or reject Student verification when manual review is required.
- SMEs can create and publish projects within subscription limits.
- Students can view open projects and submit applications.
- SMEs can select a Student and create an offer.
- Students can accept or reject offers before any escrow payment is made.
- SMEs can fund escrow through PayOS real payment-in only after the Student accepts the offer.
- Students can submit Sketch and Final files.
- SMEs can approve, request revision, or report invalid files.
- Final approval releases escrow into the Student wallet after platform fee deduction.
- Students can create withdrawal requests.
- Both parties can rate each other after project completion.
- Students can build a basic public portfolio from allowed work.
- SMEs can view public Student portfolios during hiring decisions.
- In-app notifications are created for important events.

Extended MVP monetization is complete when:

- Students and SMEs can buy paid feature packages through PayOS.
- Paid AI Matching is unlocked only by active paid package entitlements.
- Package payment and escrow payment reuse the same payment provider abstraction and webhook discipline.

## 3. MVP Actors

### 3.1. Guest

A non-authenticated visitor. MVP capabilities:

- Register.
- Log in.
- Choose Student or SME role during onboarding.

### 3.2. Student Designer

A Student Designer receives and completes design work. MVP capabilities:

- Create and update Student profile.
- Upload verification document metadata.
- Browse open projects.
- Submit project applications.
- Receive, accept, or reject offers.
- Submit Sketch, Final, and Revision files.
- Respond to review results.
- Build a basic public portfolio.
- Receive money in wallet after successful completion.
- Create withdrawal requests.
- Rate SMEs after completed projects.

### 3.3. SME

An SME hires Student Designers. MVP capabilities:

- Create and update SME profile.
- Use an assigned subscription plan.
- Create draft projects.
- Publish open projects.
- Review applications.
- Create offers.
- Fund escrow.
- Review Sketch and Final submissions.
- Request revisions.
- Report invalid files.
- View public Student portfolios while reviewing applications or offers.
- Rate Students after completed projects.

### 3.4. Admin

An Admin operates the platform. MVP capabilities:

- Approve or reject Student verification.
- View users, profiles, projects, payments, and public portfolio items.
- Hide inappropriate public portfolio items.
- Support refund/disbursement cases.
- View audit logs.

## 4. MVP Functional Scope

### 4.1. Authentication and Account

MVP authentication supports email/password and `Continue with Google`.

Required:

- Register with email, username, password, full name, and role.
- Send and confirm an SMTP account email verification code after email/password registration.
- Block email/password login until account email is verified.
- Log in with email/password after account email verification.
- Continue with Google for `STUDENT` and `SME` users.
- Verify Google ID token or OAuth callback before creating a D4U session.
- Create or link a local D4U user from a verified Google email.
- Hash passwords before persistence.
- Create refresh sessions.
- Revoke refresh sessions on logout.
- Track account status: `PENDING`, `ACTIVE`, `SUSPENDED`, `BANNED`, `DELETED`.
- Block suspended, banned, and deleted users from protected business actions.

Out of MVP:

- Non-Google social login providers.
- SSO.
- MFA.

### 4.2. Student Profile and Verification

Student profile includes:

- School.
- Major.
- Study start year.
- Bio.
- Verification status.
- Average rating.
- Completed projects count.
- Withdrawal eligibility.

Verification flow:

1. Student chooses a verification method.
2. For document verification, Student uploads verification document metadata.
3. System creates a verification request.
4. Admin reviews the document.
5. Admin approves or rejects.
6. If rejected, Admin provides a rejection reason.
7. For EDU email verification, Student submits an `.edu` or approved school email address.
8. System validates the domain and sends a verification code/link to the EDU email via SMTP.
9. Student confirms the verification code/link.
10. Student profile verification status is updated.

### 4.3. SME Profile and Subscription

SME profile includes:

- Company name.
- Representative name.
- Phone number.
- Business field.
- Optional logo.
- Average rating.
- Completed projects count.
- Active open project count.

MVP subscription plans:

| Plan | Monthly price | Platform fee | Active open projects | Max budget |
| --- | ---: | ---: | ---: | ---: |
| BASIC | 0 VND | 5% | 5 | 5,000,000 VND |
| PRO | 199,000 VND | 3% | 10 | 20,000,000 VND |
| PREMIUM | 499,000 VND | 2% | Unlimited | Unlimited |

Subscription rules:

- Enforce active open project limit when publishing.
- Enforce max project budget when publishing.
- Use the plan platform fee rate when creating escrow.

Automated recurring subscription billing is not part of MVP. Paid feature access can be handled as explicit package purchases.

### 4.4. Paid Feature Access Packages

Students and SMEs can buy role-specific packages to unlock selected premium features.

Package rules:

- Package catalog defines role, code, name, price, currency, duration, feature entitlements, usage limits, and active status.
- Student packages can unlock AI matched project suggestions, higher application visibility, or extended profile/portfolio visibility when those features exist.
- SME packages can unlock AI matched student recommendations, extra active open project slots, higher budget ceilings, or premium project visibility.
- Package purchase starts pending and activates only after payment succeeds through PayOS.
- Active entitlements are checked before paid features are used.
- Expired or cancelled entitlements no longer unlock paid features.
- Package limits compose with existing SME subscription limits and must not bypass escrow/payment rules.

### 4.5. AI Matching

AI Matching is a paid recommendation feature for Students and SMEs.

AI Matching rules:

- Student can request ranked open project suggestions when an active entitlement allows it.
- SME can request ranked student recommendations for an owned project when an active entitlement allows it.
- Matching can use project brief, category, budget, deadline, student profile, verification status, application history, ratings, and declared skills when available.
- Matching returns score, reasons, and missing-data warnings.
- Matching results are recommendations only.
- AI must not auto-apply, auto-invite, auto-select, auto-price, auto-publish, or approve verification.
- Matching request metadata and result summaries can be stored for audit/debug, while raw private prompt data should not be retained longer than necessary.
- Recent matching results can be cached to control provider cost.

### 4.6. Project Creation

SME creates a project with:

- Title.
- Brief.
- Usage purpose.
- Design category.
- Project type: `OPEN` or `PRIVATE`.
- Budget amount.
- Total deadline.
- Sketch deadline.
- Final deadline.
- Confidential flag.
- Student portfolio permission flag.
- Attachments.

AI Project Brief Assistant:

- SME can enter a raw project idea and ask AI to draft project content.
- AI can suggest title, brief, usage purpose, deliverables, design category hint, and deadline notes.
- SME must review and edit AI output before saving a draft or publishing.
- AI does not publish projects, select students, decide final price, or bypass subscription rules.
- MVP does not store AI conversation history; AI output is treated as a temporary form helper.

Rules:

- Budget must be greater than zero.
- Sketch deadline must be before or equal to Final deadline.
- Final deadline must be before or equal to Total deadline.
- SME can publish only when subscription limits allow it.
- Published open projects use status `OPEN`.
- Private invited projects use status `PRIVATE_INVITED`.

### 4.7. Applications and Offers

Open project flow:

1. Student views an `OPEN` project.
2. Student either confirms the published budget and deadlines or submits a custom proposal with a different price and solution description.
3. A Student can apply only once per project.
4. SME reviews applications.
5. SME selects one application.
6. System creates an offer.

Private project flow:

1. SME creates a `PRIVATE` project.
2. SME selects the Student to invite.
3. System creates an offer without requiring an application.

Offer rules:

- Offer starts as `WAITING_ACCEPTANCE`.
- For an open project application, the offer amount is copied from the selected application and cannot be overridden by SME.
- Student has 24 hours to accept or reject the offer.
- Student can accept or reject before SME pays escrow.
- Accepted offer selects the Student but does not start execution yet.
- After Student accepts, SME has 24 hours to start and complete escrow payment.
- SME can pay escrow only after the Student accepts the offer.
- PayOS webhook success funds escrow and starts the execution flow.
- If Student does not decide within 24 hours, the offer becomes `EXPIRED`.
- When an offer expires or is rejected, its selected application returns to `SUBMITTED` so SME can choose again.
- If SME does not pay within 24 hours after Student acceptance, the offer becomes `EXPIRED`, any pending payment is expired/cancelled, and the Student is released from the offer.
- If Student rejects or the offer expires before payment, no refund is needed because escrow has not been funded.

### 4.8. Escrow and Payment

Escrow protects both SME and Student.

MVP payment-in uses PayOS as the selected real payment provider. Sandbox or mock payment is allowed only for local development and automated tests, not for the required demo flow.

Flow:

1. SME selects Student and creates an offer.
2. Offer becomes `WAITING_ACCEPTANCE`.
3. Student accepts or rejects the offer.
4. If Student accepts, offer becomes `ACCEPTED`.
5. System creates escrow for the offered amount when SME starts payment.
6. SME pays through PayOS payment link, VietQR, or another PayOS-supported payment method.
7. Payment success marks escrow as `FUNDED`.
8. Project becomes `IN_PROGRESS`.

Rules:

- PayOS is the required provider for escrow funding in the demo-critical MVP.
- The same payment provider integration is later reused for paid feature package purchases.
- Backend must create a payment record before redirecting or returning provider payment link/QR data.
- Backend must validate provider webhook signature or equivalent trusted callback data.
- Backend must not trust client-submitted payment success.
- SME cannot start escrow payment until the Student has accepted the offer.
- Project cannot start until escrow is funded.
- Payment `FAILED`, `CANCELLED`, or `EXPIRED` cannot start a project.
- Each checkout payment expires independently after its provider checkout window. SME can create a new checkout while the 24-hour offer payment window remains open.
- Provider transaction id must be unique per provider.
- Payment webhooks must be idempotent.
- PayOS webhook is the only trusted source for payment success.
- Payment timeout handling must be safe to replay and must not double-expire or double-fund an offer.

### 4.9. Sketch and Final Submission Stages

Every in-progress project has two fixed submission stages:

- `SKETCH`
- `FINAL`

Sketch flow:

1. Student submits Sketch.
2. System stores submission and files.
3. Project moves to Sketch review.
4. SME approves, requests revision, or reports invalid file.
5. If SME does not review within 5 business days, the system auto-approves Sketch and records an audit log with reason `AUTO_APPROVED_TIMEOUT`.

Final flow:

1. Student submits Final only after Sketch is approved or auto-approved.
2. System stores Final files.
3. SME reviews Final.
4. Final approval completes the project.
5. System releases escrow and credits Student wallet.
6. If SME does not review within 5 business days, the system auto-approves Final, completes the project, and triggers disbursement.

### 4.10. Submissions and Files

Submission includes:

- Project.
- Milestone type: `SKETCH` or `FINAL`.
- Student submitter.
- Submission type: `SKETCH`, `FINAL`, `REVISION`.
- Revision round.
- Description.
- Status.
- Submitted timestamp.

File metadata includes:

- Storage provider.
- Bucket.
- Storage key.
- Original filename.
- MIME type.
- Extension.
- File size.
- Visibility.
- Optional scan status.

Allowed extensions:

- jpg.
- png.
- pdf.

Rules:

- Private files require signed URL or controlled access.
- Original Final files should become downloadable only after Final approval.
- Watermarked files may be used for review previews.

### 4.11. Review, Revision, and Invalid Files

SME review actions:

- `APPROVE_SKETCH`
- `APPROVE_FINAL`
- `REQUEST_REVISION`
- `REPORT_INVALID_FILE`
- `AUTO_APPROVE`

Revision flow:

1. SME requests revision on a submission.
2. System records a review action with requested changes and due date.
3. Project moves to `REVISION_REQUESTED`.
4. Student submits a revision.
5. SME reviews again.
6. Revision round is recorded for audit history without limiting how many revisions SME can request.

Invalid file flow:

1. SME reports invalid file.
2. SME selects a reason: `EMPTY_FILE`, `CANNOT_OPEN`, `WRONG_FORMAT`, `UNRELATED`, `BROKEN_LINK`, or `OTHER`.
3. System records a review action with invalid file reason, description, and reupload due date.
4. Student uploads corrected files through a new submission/revision.
5. SME reviews again.

Admin review flow:

1. Project enters `ADMIN_REVIEW` only when an Admin decision is explicitly required by an operational workflow.
2. Admin reviews project context, submissions, and review actions.
3. Admin can force complete or cancel.
4. Admin decision must create an audit log.

Mid-project cancellation policy:

| Situation | Refund to SME | Pay to Student |
| --- | ---: | ---: |
| Before Student submits Sketch | 100% | 0% |
| After Sketch approved | 60% | 40% |
| After Final submitted | 20% | 80% |
| Student abandon past deadline | 70% | 30% |

### 4.12. Completion and Disbursement

When Final is approved:

1. Project becomes `COMPLETED`.
2. Escrow becomes `RELEASE_PENDING`.
3. System calculates platform fee.
4. System creates disbursement.
5. System credits Student wallet with net amount.
6. System creates wallet transaction `DISBURSEMENT_CREDIT`.
7. Escrow becomes `RELEASED`.
8. Rating due date is set to 7 days after completion.

Formula:

```text
platform_fee_amount = escrow.amount * platform_fee_rate
net_amount = escrow.amount - platform_fee_amount
```

### 4.13. Wallet and Withdrawal

Student wallet includes:

- Available balance.
- Pending balance.
- Locked balance.
- Status.

Payment method:

- Bank name.
- Optional bank code.
- Bank account holder name.
- Masked account number.
- Protected full account number for Admin manual transfer.
- Optional provider token.
- Default flag.

Withdrawal flow:

1. Student selects payment method.
2. Student enters amount.
3. System checks wallet is `ACTIVE`.
4. System checks `can_withdraw = true`.
5. System checks minimum amount is 50,000 VND.
6. System applies 0 VND withdrawal fee in MVP.
7. System creates withdrawal request.
8. Admin/Finance manually transfers money to the Student bank account outside the system.
9. Admin/Finance marks the withdrawal as successful or failed in D4U.
10. Success creates debit transaction.
11. Failure creates reversal transaction.

MVP does not include automatic bank payout, bank account verification/KYC, or direct bank balance synchronization.

### 4.14. Portfolio Builder

Portfolio Builder gives verified Students a basic way to present work inside D4U.

Portfolio item includes:

- Title.
- Description.
- Design category.
- Student role.
- Tools and skills.
- External link.
- Public/private visibility.
- Featured/pinned flag.
- Attached file metadata for jpg, png, or pdf.
- Optional completed D4U project reference.

Rules:

- Student can create, update, delete, publish, unpublish, and feature portfolio items.
- Public portfolio items can be viewed by SMEs during application and offer review.
- Completed D4U project output can be attached only when the project is not confidential and `allowStudentPortfolio` is true.
- The system must block public portfolio use for confidential projects or projects that do not allow Student portfolio use.
- Admin can hide inappropriate public portfolio items.
- Portfolio Builder is not a standalone social network, portfolio marketplace, analytics product, or monetized showcase in MVP.

### 4.15. Rating

Rules:

- Rating is available only after `COMPLETED`.
- Student rates SME.
- SME rates Student.
- One rating per project/rater/rated user.
- Rating value is 1 to 5.
- Comment maximum is 500 characters.
- Rating window is 7 days after completion.
- Rating updates average rating and completed project count.

### 4.16. Notification

MVP uses in-app notifications only.

Events:

- Verification approved/rejected.
- Project published.
- New application.
- New offer.
- Payment success/failed.
- Offer accepted/rejected.
- New submission.
- Review action.
- Revision request.
- Invalid file report.
- Portfolio item hidden by Admin.
- Escrow released.
- Withdrawal request status changed.
- Rating received.

Statuses:

- `UNREAD`
- `READ`

### 4.17. Audit Log

Audit important actions:

- Admin verification decision.
- SME project publish/cancel.
- Project status change.
- Payment webhook success/failed.
- Escrow funded/released/refunded.
- Portfolio item create/update/publish/hide/delete.
- Wallet balance change.
- Withdrawal processing.
- User status change.

Audit fields:

- Actor user.
- Action.
- Entity type.
- Entity id.
- Before JSON.
- After JSON.
- IP address.
- User agent.
- Created timestamp.

### 4.18. State Machines

Project status flow:

```text
DRAFT -> OPEN
DRAFT -> PRIVATE_INVITED
OPEN / PRIVATE_INVITED -> OFFER_SELECTED
OFFER_SELECTED -> IN_PROGRESS
IN_PROGRESS -> SKETCH_REVIEW
SKETCH_REVIEW -> REVISION_REQUESTED
SKETCH_REVIEW -> FINAL_REVIEW
REVISION_REQUESTED -> SKETCH_REVIEW / FINAL_REVIEW / ADMIN_REVIEW
FINAL_REVIEW -> REVISION_REQUESTED
FINAL_REVIEW -> COMPLETED
ADMIN_REVIEW -> COMPLETED / CANCELLED
DRAFT / OPEN / PRIVATE_INVITED / IN_PROGRESS -> CANCELLED
```

Offer status flow:

```text
WAITING_ACCEPTANCE -> ACCEPTED
WAITING_ACCEPTANCE -> REJECTED
WAITING_ACCEPTANCE -> EXPIRED
ACCEPTED -> PENDING_PAYMENT
ACCEPTED -> EXPIRED
PENDING_PAYMENT -> ACTIVE
PENDING_PAYMENT -> PAYMENT_FAILED
```

State machine rules:

- `WAITING_ACCEPTANCE` means the Student must decide within 24 hours.
- `ACCEPTED` means the Student agreed and SME must pay within 24 hours.
- `ACTIVE` means escrow is funded and project execution has started; project and escrow statuses remain the authoritative execution state.
- `PAYMENT_FAILED` means payment failed, cancelled, or expired before funding.
- `ADMIN_REVIEW` remains an operational resolution path, not a revision-limit rule or dispute workflow.

## 5. Main Business Flows

### 5.1. Registration and Onboarding

1. Guest registers as Student or SME.
2. System creates user.
3. User logs in.
4. Student creates Student profile; SME creates SME profile.
5. Student submits verification if required.
6. Admin approves verification.

Expected result:

- User has a valid profile.
- Student can apply.
- SME can create projects.

### 5.2. Open Project Flow

1. SME creates project draft.
2. SME uploads attachments.
3. SME publishes project.
4. System validates subscription.
5. Project becomes `OPEN`.
6. Student submits application.
7. SME selects application.
8. System creates offer in `WAITING_ACCEPTANCE`.
9. Student accepts or rejects offer within 24 hours.
10. If accepted, SME pays escrow through PayOS.
11. SME must complete escrow payment within 24 hours.
12. PayOS webhook funds escrow.
13. Project becomes `IN_PROGRESS`.

Expected result:

- Project has selected Student.
- Escrow is `FUNDED`.
- Sketch and Final submission stages are ready.

### 5.3. Execution Flow

1. Student submits Sketch.
2. SME approves or requests revision.
3. System auto-approves Sketch after 5 business days without SME review.
4. Student submits revision if needed.
5. Sketch is approved.
6. Student submits Final.
7. SME approves, requests revision, or reports invalid file.
8. System auto-approves Final after 5 business days without SME review.
9. Final is approved.
10. Project is completed.

Expected result:

- Submission and review actions are recorded.
- Project, milestone, and submission statuses remain consistent.

### 5.4. Money Flow

1. SME payment succeeds.
2. Escrow is funded.
3. Project is completed.
4. Escrow moves to release pending.
5. System creates disbursement.
6. Student wallet is credited.
7. Escrow is released.

Expected result:

- Platform fee is calculated correctly.
- Wallet transaction stores balance after transaction.

### 5.5. Portfolio Builder Flow

1. Student creates a portfolio item.
2. Student adds description, category, tools, skills, links, and allowed file metadata.
3. Student optionally links a completed D4U project.
4. System checks project confidentiality and portfolio permission before public publishing.
5. Student publishes or unpublishes the portfolio item.
6. SME views public portfolio items during application or offer review.
7. Admin hides inappropriate public portfolio items when needed.

Expected result:

- Public portfolio content respects project confidentiality and SME portfolio permission.
- SMEs can better evaluate Student design capability without adding a separate social feature.

## 6. MVP Data Model

The optimized MVP ERD has 29 entities. The model intentionally removes duplicate workflow tables and keeps one source of truth for audit/status transitions.

- `users`
- `user_sessions`
- `admin_profiles`
- `student_profiles`
- `student_verifications`
- `sme_profiles`
- `subscription_plans`
- `design_categories`
- `projects`
- `project_attachments`
- `project_applications`
- `project_offers`
- `project_submissions`
- `submission_files`
- `review_actions`
- `files`
- `escrows`
- `payments`
- `refunds`
- `disbursements`
- `wallets`
- `wallet_transactions`
- `payment_methods`
- `withdrawal_requests`
- `student_portfolio_items`
- `student_portfolio_files`
- `ratings`
- `notifications`
- `audit_logs`

Optimized modeling rules:

- `sme_profiles.subscription_plan_id` stores the current MVP plan; recurring subscription history is out of MVP.
- `project_submissions` stores fixed `SKETCH` and `FINAL` milestone type directly; `project_milestones` is not needed for MVP.
- `review_actions` stores approve, revision request, invalid file report, and auto-approve actions.
- `audit_logs` is the primary source for project status transition history; avoid duplicating the same lifecycle data in a separate status history table.
- Wallet balances must never become negative and should be protected by database constraints in addition to application validation.

Detailed attributes and relationships are in `Entity_Dictionary_D4U.md`. DBML for dbdiagram.io is in `D4U_ERD.dbml`.

## 7. Suggested API Groups

### 7.1. Auth

- `POST /auth/register`
- `POST /auth/email-verification/request`
- `POST /auth/email-verification/confirm`
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

- `POST /ai/project-brief-assistant`
- `POST /projects`
- `GET /projects`
- `GET /projects/{id}`
- `PUT /projects/{id}`
- `POST /projects/{id}/publish`
- `POST /projects/{id}/cancel`

### 7.4. Applications and Offers

- `POST /projects/{id}/applications`
- `GET /projects/{id}/applications`
- `POST /projects/{id}/offers`
- `POST /offers/{id}/accept`
- `POST /offers/{id}/reject`

### 7.5. Payments and Escrow

- `POST /offers/{id}/payment`
- `POST /payments/webhook`
- `GET /projects/{id}/escrow`

### 7.6. Submissions and Review

- `POST /projects/{id}/submissions`
- `GET /projects/{id}/submissions`
- `POST /submissions/{id}/approve`
- `POST /submissions/{id}/request-revision`
- `POST /submissions/{id}/report-invalid-file`

### 7.7. Portfolio Builder

- `GET /students/me/portfolio`
- `POST /students/me/portfolio-items`
- `PUT /students/me/portfolio-items/{id}`
- `DELETE /students/me/portfolio-items/{id}`
- `POST /students/me/portfolio-items/{id}/publish`
- `POST /students/me/portfolio-items/{id}/unpublish`
- `GET /students/{id}/portfolio`
- `POST /admin/portfolio-items/{id}/hide`

### 7.8. Wallet

- `GET /wallets/me`
- `GET /wallets/me/transactions`
- `POST /payment-methods`
- `POST /withdrawal-requests`
- `POST /admin/withdrawal-requests/{id}/process`

### 7.9. Ratings and Notifications

- `POST /projects/{id}/ratings`
- `GET /notifications`
- `POST /notifications/{id}/read`

### 7.10. Paid Feature Access and AI Matching

- `GET /feature-packages`
- `POST /feature-package-purchases`
- `POST /feature-package-purchases/{id}/payment`
- `GET /me/feature-entitlements`
- `POST /ai/matching/projects`
- `POST /ai/matching/projects/{id}/students`

## 8. Build Priority

### Phase 1: Foundation

- Auth email/password with account email verification.
- Continue with Google authentication.
- Role authorization.
- User/profile CRUD.
- EDU email student verification.
- File metadata.
- Design category seed.
- Subscription plan seed.

### Phase 2: Marketplace

- AI Project Brief Assistant for SME project drafting.
- Project create/publish/list/detail.
- Application flow.
- Offer flow.
- Project status transition audit.
- Offer 24-hour Student decision timeout.

### Phase 3A: PayOS Escrow Payment

- Escrow creation.
- PayOS real payment-in integration.
- Provider payment link or QR payment data returned to the client.
- PayOS webhook signature validation.
- Idempotent payment webhook handling.
- Payment success funds escrow.
- Student accepts offer before SME can start escrow payment.
- Funded escrow moves project to `IN_PROGRESS`.
- SME 24-hour payment timeout after Student accepts.
- Payment failed/cancelled/expired handling.
- Scheduled expiry handling for offer and pending payment records.
- Local mock/sandbox payment provider for development and tests only.

### Phase 3B: Project Execution

- Submission upload.
- Review action.
- Revision request as review action.
- Invalid file report as review action.
- Auto-approve Sketch/Final after 5 business days without SME review.
- Admin review resolution for operational exceptions.

### Phase 4: Completion and Money Movement

- Final approval.
- Disbursement.
- Partial refund policy for mid-project cancellation.
- Wallet balance.
- Wallet transaction.
- Payment method.
- Withdrawal request with manual Admin/Finance bank transfer processing.

### Phase 5: Trust and Operations

- Student verification admin.
- Portfolio Builder.
- Rating.
- In-app notification.
- Audit log.

### Phase 6: Paid Feature Access and AI Matching

- Student and SME paid feature packages.
- Package purchase through PayOS.
- Entitlement activation after successful provider webhook/callback.
- Feature gate checks for paid capabilities.
- AI matched project suggestions for Students.
- AI matched student recommendations for SMEs.
- AI matching audit/debug metadata and cost controls.

## 9. Out of MVP

- Realtime chat.
- Non-Google social login providers.
- AI auto-approval, AI project publishing, AI auto-selection, and AI pricing decisions.
- Automatic recurring subscription billing.
- Dispute open/evidence/resolve workflow.
- Dispute appeal.
- Advanced portfolio marketplace, portfolio analytics, and portfolio monetization.
- Reputation ledger.
- User warning workflow.
- Email/push notification delivery pipeline.
- Contract/e-signature.
- Advanced bank KYC.
- Automatic bank payout and direct bank account balance synchronization.
- Native mobile app.

## 10. MVP Risks and Mitigation

### 10.1. Payment and escrow complexity

Mitigation:

- Choose one real payment provider for MVP payment-in.
- Keep a mock/sandbox provider only for local development and automated tests.
- Keep payment, escrow, disbursement, and wallet transaction separate.
- Make webhook handling idempotent.
- Student accepts before SME pays to avoid refund-after-rejection edge cases.
- Expire offers and pending payments automatically so neither party is blocked forever.

### 10.2. Portfolio content moderation and confidentiality

Mitigation:

- Treat project confidentiality and `allowStudentPortfolio` as hard publish gates.
- Allow Admin to hide inappropriate public portfolio items.
- Keep Portfolio Builder focused on basic Student showcase, not a social network or marketplace.

### 10.3. Difficult design file formats

Mitigation:

- Store original files in object storage.
- Store metadata in PostgreSQL.
- Apply watermark only to previewable formats.
- Move complex source formats such as Figma, Adobe Illustrator, PSD, and ZIP to a later file-handling scope.

### 10.4. Workflow deadlock

Mitigation:

- Auto-approve Sketch and Final after 5 business days without SME review.
- Keep revision history auditable while allowing SME and Student to iterate freely.
- Define partial refund policy for mid-project cancellation before implementing execution.

### 10.5. Scope creep

Mitigation:

- Build only against the optimized 29-entity MVP.
- Ask whether every new feature is required by the MVP checklist.
- Move non-required features to a later phase.

## 11. AI Implementation Strategy

Use small module prompts instead of asking AI to build an entire phase at once. Each prompt must include related schema, API contract, business rules, error cases, expected tests, and assumptions.

Recommended module split:

- Auth core: email/password, JWT, refresh session, account email verification.
- Google OAuth: ID token verification and create/link local user.
- Student profile and EDU verification.
- SME profile and current plan assignment.
- Project CRUD, publish, and plan limit enforcement.
- Application flow with duplicate prevention.
- Offer state machine, accept/reject, and timeout rules.
- Escrow business logic without provider-specific code.
- PayOS integration and webhook signature validation.
- Webhook idempotency and provider transaction uniqueness.
- Submission and review flow with auto-approve guard.
- Wallet, disbursement, withdrawal, and non-negative balance safety.
- Portfolio Builder, rating, notification, and audit.
- Package entitlement and paid AI Matching.

Prompt guardrails:

- Do not put business rules directly in webhook controllers.
- Do not let AI auto-apply, auto-select, auto-price, auto-publish, or approve verification.
- Keep one vertical module per branch/prompt.
- Ask the agent to list assumptions at the end of each module.

## 12. MVP Acceptance Checklist

- [x] Guest can register.
- [x] User can log in and log out.
- [x] Student can create profile.
- [x] SME can create profile.
- [x] Admin can approve or reject Student verification.
- [x] Basic, Pro, and Premium plans are seeded.
- [x] Basic SME cannot publish more than 5 active open projects.
- [x] Basic SME cannot publish a project above 5,000,000 VND.
- [x] SME can use AI Project Brief Assistant to prefill project draft content.
- [x] SME can create and publish an open project.
- [x] SME can cancel own draft/open/private-invited project.
- [x] Student can view open projects.
- [x] Student can submit application.
- [x] SME can view applications.
- [x] SME can create offer.
- [x] Student can accept offer before escrow payment.
- [x] SME can fund escrow through PayOS real payment-in.
- [x] PayOS webhook success funds escrow.
- [x] Project becomes `IN_PROGRESS`.
- [ ] Offer expires if Student does not accept/reject within 24 hours.
- [x] Accepted offer expires if SME does not pay within 24 hours.
- [ ] Payment failed/cancelled/expired never starts a project.
- [ ] System supports fixed Sketch and Final submission stages without requiring a separate milestone table.
- [ ] Student can submit Sketch with valid files.
- [ ] SME can approve Sketch.
- [ ] System auto-approves Sketch after 5 business days without SME review.
- [ ] SME can request revision.
- [ ] Student can submit Revision.
- [ ] Student can submit Final.
- [ ] SME can approve Final.
- [ ] System auto-approves Final after 5 business days without SME review.
- [ ] Revision history remains auditable without limiting SME revision requests.
- [ ] Project becomes `COMPLETED`.
- [ ] Escrow releases successfully.
- [ ] Mid-project cancellation uses the defined partial refund policy.
- [ ] Student wallet is credited with net amount.
- [ ] Wallet balances are protected from going negative by service validation and database constraints.
- [ ] Student can create a valid withdrawal request.
- [ ] Admin/Finance can manually process withdrawal status after external bank transfer.
- [ ] Student or SME can buy a paid feature package through PayOS.
- [ ] Successful package payment activates AI Matching entitlement.
- [ ] Student and SME can rate each other within 7 days.
- [ ] Student can create and publish a basic portfolio item.
- [ ] SME can view public Student portfolio items.
- [ ] System blocks portfolio publishing when project confidentiality or portfolio permission does not allow it.
- [ ] Admin can hide inappropriate public portfolio items.
- [ ] In-app notifications are created for key events.
- [ ] Audit logs are created for important actions.
