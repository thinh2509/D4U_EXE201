# D4U Requirement Specification

## 1. Overview

### 1.1. Product Name

D4U - Design 4 You.

### 1.2. Product Goal

D4U is a marketplace that connects Student Designers with small and medium enterprises that need design work. The system supports project posting, candidate selection, escrow payment, milestone-based delivery, review, revision, disputes, wallet payouts, ratings, notifications, and platform operations.

### 1.3. Product Scope

The complete product vision includes:

- Student, SME, and Admin account management.
- Student profiles, verification, skills, software, and portfolio.
- SME profiles, subscription plans, and project limits.
- Open and private design projects.
- Applications, offers, and offer acceptance.
- Escrow payment, refund, disbursement, wallet, and withdrawal.
- Sketch and Final project workflow.
- File upload, watermark support, and invalid file reports.
- Revision requests and auto-approval rules.
- Project workspace comments.
- Disputes, evidence, decisions, and appeals.
- Ratings, reputation, and warnings.
- Notifications, audit logs, system configuration, and AI recommendation.

### 1.4. Assumptions and Constraints

- Target database: PostgreSQL.
- Default currency: VND.
- MVP payment can use PayOS, VNPAY, or a sandbox/mock provider.
- Allowed file extensions: jpg, jpeg, png, webp, pdf, zip, fig, ai, psd, svg.
- Maximum file size: 100 MB per file.
- Maximum project storage: 1 GB per project.
- Rating window: 7 days after project completion.
- Reputation score starts at 100 and stays between 0 and 100.

## 2. Actors

### 2.1. Guest

A visitor who has not logged in. Guests can register, log in, and view public onboarding content.

### 2.2. Student Designer

A Student Designer receives and completes projects. Students can create profiles, apply to projects, accept offers, submit deliverables, respond to reviews, receive wallet funds, withdraw money, and rate SMEs.

### 2.3. SME

An SME hires designers. SMEs can create profiles, subscribe to plans, post projects, review applications, create offers, fund escrow, review submissions, request revisions, report invalid files, open disputes, and rate Students.

### 2.4. Admin

An Admin operates the platform. Admins can review Student verification, manage categories, handle disputes, process finance operations, suspend users, update configuration, and view audit logs.

## 3. Main States

### 3.1. User Status

- `PENDING`: account is created but not fully activated.
- `ACTIVE`: account can use the platform.
- `SUSPENDED`: account is temporarily restricted.
- `BANNED`: account is permanently blocked.
- `DELETED`: account is soft-deleted.

### 3.2. Project Status

- `DRAFT`: SME is editing the project.
- `OPEN`: project is public and accepts applications.
- `PRIVATE_INVITED`: private invitation has been sent.
- `OFFER_SELECTED`: SME selected an offer/candidate.
- `PAYMENT_SECURED`: escrow payment is successful.
- `WAITING_FOR_ACCEPTANCE`: waiting for Student acceptance.
- `IN_PROGRESS`: project is being executed.
- `SKETCH_SUBMITTED`: Student submitted Sketch.
- `SKETCH_IN_REVIEW`: SME is reviewing Sketch.
- `REVISION_REQUESTED`: SME requested revision.
- `FINAL_SUBMITTED`: Student submitted Final.
- `FINAL_IN_REVIEW`: SME is reviewing Final.
- `COMPLETED`: Final is approved.
- `FUNDS_AVAILABLE`: funds are available for Student.
- `CANCELLED`: project was cancelled.
- `DISPUTED`: project is in dispute.

### 3.3. Escrow Status

- `PENDING_PAYMENT`: waiting for SME payment.
- `FUNDED`: escrow is funded.
- `RELEASE_PENDING`: release is being processed.
- `RELEASED`: funds were released.
- `REFUNDED`: funds were refunded.
- `PARTIALLY_REFUNDED`: partial refund was issued.
- `DISPUTED`: funds are locked by dispute.
- `CANCELLED`: escrow was cancelled.

## 4. Business Workflows

### 4.1. Open Project

1. SME creates a draft project.
2. SME enters brief, category, budget, deadlines, attachments, and privacy options.
3. System validates subscription limits.
4. SME publishes the project.
5. Student submits an application.
6. SME selects one application and creates an offer.
7. SME funds escrow.
8. Student accepts the offer.
9. Project moves to `IN_PROGRESS` and system creates Sketch and Final milestones.

### 4.2. Private Project

1. SME creates a private project.
2. SME invites a specific Student.
3. System creates an offer.
4. SME funds escrow.
5. Student accepts or rejects.
6. Accepted offer starts the project.

### 4.3. Sketch Milestone

1. Student submits Sketch before deadline.
2. System stores submission and files.
3. SME reviews.
4. SME approves, requests revision, reports invalid file, or opens dispute.
5. System can auto-approve if review deadline passes and configuration allows it.

### 4.4. Final Milestone

1. Student submits Final after Sketch is approved.
2. SME reviews Final.
3. SME approves, requests revision, reports invalid file, or opens dispute.
4. Final approval completes the project.
5. System releases escrow and credits Student wallet.

### 4.5. Revision

1. SME creates revision request for a submission.
2. Revision round is stored for audit history without limiting how many revisions SME can request.
3. Student submits revised files before due date.
4. SME reviews again.
5. Unresolved cases can become disputes.

### 4.6. Invalid File

1. SME reports invalid file with reason.
2. System creates invalid file report and reupload deadline.
3. Student uploads corrected files.
4. SME or Admin confirms resolution.
5. Disagreement can become dispute.

### 4.7. Dispute

1. Student or SME opens dispute.
2. Project and escrow become disputed.
3. Parties submit evidence.
4. Admin reviews context.
5. Admin decides refund/payout/platform fee allocation.
6. System creates refund/disbursement records.
7. Dispute is resolved.

## 5. Functional Requirements

### 5.1. Authentication and Sessions

- System must support email/password registration.
- System must hash passwords.
- System must support login, refresh sessions, and logout.
- System must track latest login.
- System must enforce role-based authorization.

### 5.2. Account Management

- Users must have unique email and username.
- Users can update basic profile information.
- Admin can suspend, ban, or restore accounts.
- Restricted accounts cannot perform business actions.

### 5.3. Student Profile

- Student must provide school, major, study start year, and bio.
- System stores Student verification status, rating, completed project count, and withdrawal eligibility.
- Student may later have skills, software, and portfolio in the full product.

### 5.4. Student Verification

- Student can submit verification document.
- Admin can approve or reject.
- Rejection requires a reason.
- System records reviewer and review time.

### 5.5. SME Profile

- SME must provide company name, representative, phone number, and business field.
- SME can upload logo.
- System tracks rating, completed projects, and active open projects.

### 5.6. Subscription Plans

- System supports Basic, Pro, and Premium plans.
- Plans define monthly price, platform fee rate, active open project limit, and max project budget.
- Basic defaults: 0 VND/month, 10% fee, 2 active open projects, max 5,000,000 VND.
- Pro defaults: 199,000 VND/month, 7% fee, 10 active open projects, max 20,000,000 VND.
- Premium defaults: 499,000 VND/month, 5% fee, unlimited limits.
- System validates plan limits before project publish.

### 5.7. Design Categories

- Admin can manage design categories.
- SME can select active categories.
- Student can filter projects by category.

### 5.8. Project Management

- SME can create project with title, brief, purpose, category, type, budget, and deadlines.
- System validates budget and deadlines.
- SME can set confidentiality and Student portfolio permission.
- Project supports attachments.
- Project status changes must be recorded.

### 5.9. Applications and Offers

- Student can apply once per open project.
- Application requires proposed price and cover letter.
- SME can view and select applications.
- SME can create private offer without application.
- Offer has amount, status, and expiration.
- Student can accept or reject funded offers.

### 5.10. Milestones and Submissions

- Every in-progress project has Sketch and Final milestones.
- Student can submit only for assigned project.
- Submission can be Sketch, Final, or Revision.
- Submission can include multiple files.
- Final original files are downloadable only after approval or allowed release.

### 5.11. Review

- SME can approve Sketch, approve Final, request revision, report invalid file, or open dispute.
- Every review action must be recorded.
- System updates project, milestone, and submission statuses consistently.

### 5.12. File Management

- System stores file owner, provider, key, filename, MIME type, extension, size, checksum, visibility, and scan status.
- System rejects unsupported extensions and files above limits.
- File deletion is soft delete.

### 5.13. Escrow and Payment

- System creates escrow when SME selects Student.
- SME must fund escrow before project starts.
- Payment stores provider, transaction id, amount, currency, and status.
- Provider transaction id must be unique per provider.
- Escrow release is blocked while disputed.

### 5.14. Refund and Disbursement

- Final approval creates disbursement.
- System calculates gross amount, platform fee, and net amount.
- System credits Student wallet through wallet transaction.
- Cancellation or dispute can create refund.

### 5.15. Wallet and Withdrawal

- Student wallet stores available, pending, and locked balances.
- Student can add bank payment method.
- Minimum withdrawal is 50,000 VND.
- Default withdrawal fee is 5,000 VND.
- Failed withdrawal creates reversal transaction.

### 5.16. Disputes

- Student or SME can open dispute.
- Dispute requires reason and description.
- Parties can submit evidence.
- Admin must provide rationale and money allocation.
- System executes decision through refund/disbursement.

### 5.17. Ratings

- Student and SME can rate each other after project completion.
- Rating value must be 1 to 5.
- One rating per project/rater/rated user.
- Comment max length is 500 characters.
- Rating updates average rating and completed project count.

### 5.18. Notifications

- System creates notifications for verification, application, offer, payment, submission, review, revision, invalid file, dispute, escrow release, withdrawal, and rating events.
- MVP notifications are in-app.

### 5.19. Audit Log

- System records important actions and Admin actions.
- Audit log stores actor, action, entity, before/after JSON, IP, user agent, and timestamp.

## 6. UI Requirements

### 6.1. Student

- Dashboard with active projects, pending submissions, revisions, wallet, and notifications.
- Project search/listing with filters.
- Project workspace with milestones, submissions, reviews, and disputes.
- Wallet page with balance, transactions, payment methods, and withdrawal.

### 6.2. SME

- Dashboard with open projects, applications, submissions, disputes, and subscription.
- Project creation form.
- Application comparison view.
- Submission review screen.
- Billing/escrow view.

### 6.3. Admin

- Operations dashboard.
- Student verification review.
- Dispute case view.
- Audit search.

## 7. Access Matrix

| Feature | Guest | Student | SME | Admin |
| --- | --- | --- | --- | --- |
| Register/login | Yes | Yes | Yes | Yes |
| Student profile | No | Yes | No | Manage |
| SME profile | No | No | Yes | Manage |
| Post project | No | No | Yes | Manage |
| Apply to project | No | Yes | No | View |
| Create offer | No | No | Yes | Support |
| Pay escrow | No | No | Yes | Support |
| Submit work | No | Yes | No | View |
| Review submission | No | No | Yes | Support |
| Withdraw money | No | Yes | No | Process |
| Open dispute | No | Yes | Yes | Support |
| Resolve dispute | No | No | No | Yes |
| Manage configuration | No | No | No | Yes |

## 8. Business Rules

- BR-001: A user has one primary role.
- BR-002: A Student user has one Student profile.
- BR-003: An SME user has one SME profile.
- BR-004: A project has at most one selected Student.
- BR-005: A project has at most one escrow.
- BR-006: A Student can apply only once per project.
- BR-007: SME cannot publish beyond active open project limit.
- BR-008: SME cannot publish above plan max budget.
- BR-009: Project starts only when escrow is funded and Student accepts offer.
- BR-010: Student submits only to assigned project.
- BR-011: Final should follow approved Sketch.
- BR-012: Revision round is auditable and does not cap SME revision requests.
- BR-013: Final original file is not downloadable before valid release.
- BR-014: Provider transaction id is unique per provider.
- BR-015: Wallet balance cannot be negative.
- BR-016: Withdrawal requires active wallet and withdrawal eligibility.
- BR-017: Open dispute blocks escrow release.
- BR-018: Rating is allowed only within rating window.
- BR-019: Reputation score stays between 0 and 100 when implemented.
- BR-020: Project status changes must be recorded.

## 9. Non-Functional Requirements

### 9.1. Security

- Passwords must be hashed with a strong algorithm.
- Protected APIs must enforce authentication and authorization.
- Private files must use signed URL or controlled access.
- Bank data must be masked or tokenized.
- Rate limiting should protect login, upload, and payment creation.
- Sensitive actions must be audited.

### 9.2. Reliability

- Payment, escrow, wallet, and disbursement operations must be transactional or idempotent.
- Payment webhooks must be idempotent.
- Notifications should be retryable.
- State transitions must be consistent.

### 9.3. Performance

- Lists must support pagination.
- Filter fields need indexes.
- Large file upload/download should use object storage.

### 9.4. Extensibility

- Separate modules for account, project, payment, wallet, dispute, notification, and admin.
- Payment provider should be replaceable.
- Notification channels should be extensible.

### 9.5. Operations

- System must log application and webhook errors.
- System should monitor pending payments, pending withdrawals, dispute SLA, and failed notifications.
- Database should be backed up regularly.
- Database migrations must be versioned.

### 9.6. Privacy

- Users must know whether project work can be used as portfolio.
- Confidential projects must not be public.
- Deleted data should generally be soft-deleted for audit unless policy requires permanent deletion.

## 10. Seed Data

### 10.1. Subscription Plans

| Code | Name | Monthly price | Platform fee | Active open project limit | Max budget | AI |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| BASIC | Basic | 0 | 10% | 2 | 5,000,000 | No |
| PRO | Pro | 199,000 | 7% | 10 | 20,000,000 | Later |
| PREMIUM | Premium | 499,000 | 5% | Unlimited | Unlimited | Later |

### 10.2. Suggested Design Categories

- Logo design.
- Brand identity.
- Social media post.
- Poster/banner.
- Packaging.
- Website/app UI.
- Illustration.
- Presentation.

## 11. MVP Acceptance Criteria

- Guest can register and log in.
- Student and SME can create profiles.
- Admin can review Student verification.
- SME Basic can publish up to 2 open projects within budget limit.
- Student can view open projects and apply.
- SME can select an application, create offer, and fund escrow.
- Student can accept offer and start project.
- Student can submit Sketch and Final files.
- SME can approve, request revision, report invalid file, or open dispute.
- Final approval releases escrow and credits Student wallet.
- Student can create withdrawal request.
- Both parties can rate within 7 days.
- Admin can resolve disputes.
- In-app notifications are created for key events.

## 12. Out of MVP

- Advanced e-contracts.
- Full automated subscription billing.
- Realtime chat.
- Advanced bank KYC.
- AI quality scoring.
- Affiliate/referral system.
- Native mobile app.

## 13. Open Questions

- Which payment provider should be used first: PayOS, VNPAY, or mock provider?
- What legal model should be used for escrow?
- What exact auto-approve review window should be used?
- What cancellation/refund policy applies before and after work starts?
- What conditions enable Student withdrawals?
- How should watermarking work for Figma, PSD, AI, and ZIP files?
- What moderation rules apply to comments, portfolio, and public ratings?
