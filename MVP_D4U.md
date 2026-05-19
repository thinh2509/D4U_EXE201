# D4U MVP Description

## 1. MVP Goal

The D4U MVP validates the core marketplace loop: an SME posts a design project, a Student Designer applies or receives an offer, the SME funds escrow, the Student submits Sketch and Final deliverables, the SME reviews the work, funds are released to the Student wallet, and both parties can rate each other.

The MVP is intentionally narrower than the full D4U product. It should be production-shaped enough to validate real workflows, but small enough to build, test, and iterate quickly.

## 2. Definition of Success

The MVP is complete when:

- Guests can register and log in with email/password.
- Students and SMEs can create their required profiles.
- Admin can approve or reject Student verification.
- SMEs can create and publish projects within subscription limits.
- Students can view open projects and submit applications.
- SMEs can select a Student, create an offer, and fund escrow.
- Students can accept funded offers and start projects.
- Students can submit Sketch and Final files.
- SMEs can approve, request revision, report invalid files, or open disputes.
- Final approval releases escrow into the Student wallet after platform fee deduction.
- Students can create withdrawal requests.
- Both parties can rate each other after project completion.
- Admin can resolve basic disputes.
- In-app notifications are created for important events.

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
- Participate in disputes.
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
- Open disputes.
- Rate Students after completed projects.

### 3.4. Admin

An Admin operates the platform. MVP capabilities:

- Approve or reject Student verification.
- View users, profiles, projects, payments, and disputes.
- Resolve disputes with a money allocation decision.
- Support refund/disbursement cases.
- View audit logs.

## 4. MVP Functional Scope

### 4.1. Authentication and Account

MVP authentication is email/password only.

Required:

- Register with email, username, password, full name, and role.
- Log in with email/password.
- Hash passwords before persistence.
- Create refresh sessions.
- Revoke refresh sessions on logout.
- Track account status: `PENDING`, `ACTIVE`, `SUSPENDED`, `BANNED`, `DELETED`.
- Block suspended, banned, and deleted users from protected business actions.

Out of MVP:

- Social login.
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

1. Student uploads verification document metadata.
2. System creates a verification request.
3. Admin reviews the document.
4. Admin approves or rejects.
5. If rejected, Admin provides a rejection reason.
6. Student profile verification status is updated.

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
| BASIC | 0 VND | 10% | 2 | 5,000,000 VND |
| PRO | 199,000 VND | 7% | 10 | 20,000,000 VND |
| PREMIUM | 499,000 VND | 5% | Unlimited | Unlimited |

Subscription rules:

- Enforce active open project limit when publishing.
- Enforce max project budget when publishing.
- Use the plan platform fee rate when creating escrow.

Automated subscription billing is not part of MVP.

### 4.4. Project Creation

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
- Max revision rounds.
- Confidential flag.
- Student portfolio permission flag.
- Attachments.

Rules:

- Budget must be greater than zero.
- Sketch deadline must be before or equal to Final deadline.
- Final deadline must be before or equal to Total deadline.
- SME can publish only when subscription limits allow it.
- Published open projects use status `OPEN`.
- Private invited projects use status `PRIVATE_INVITED`.

### 4.5. Applications and Offers

Open project flow:

1. Student views an `OPEN` project.
2. Student submits an application with proposed price, cover letter, and estimated duration.
3. A Student can apply only once per project.
4. SME reviews applications.
5. SME selects one application.
6. System creates an offer.

Private project flow:

1. SME creates a `PRIVATE` project.
2. SME selects the Student to invite.
3. System creates an offer without requiring an application.

Offer rules:

- Offer starts as `PENDING_PAYMENT`.
- After escrow payment succeeds, offer becomes `WAITING_ACCEPTANCE`.
- Student can accept or reject.
- Accepted offer selects the Student and starts the execution flow.

### 4.6. Escrow and Payment

Escrow protects both SME and Student.

Flow:

1. SME selects Student and creates an offer.
2. System creates escrow for the offered amount.
3. SME pays through MVP sandbox/provider.
4. Payment success marks escrow as `FUNDED`.
5. Offer becomes `WAITING_ACCEPTANCE`.
6. Student accepts offer.
7. Project becomes `IN_PROGRESS`.

Rules:

- Project cannot start until escrow is funded.
- Escrow in `DISPUTED` status cannot be released.
- Provider transaction id must be unique per provider.
- Payment webhooks must be idempotent.

### 4.7. Sketch and Final Milestones

Every in-progress project has two milestones:

- `SKETCH`
- `FINAL`

Sketch flow:

1. Student submits Sketch.
2. System stores submission and files.
3. Project moves to Sketch review.
4. SME approves, requests revision, reports invalid file, or opens dispute.

Final flow:

1. Student submits Final only after Sketch is approved or auto-approved.
2. System stores Final files.
3. SME reviews Final.
4. Final approval completes the project.
5. System releases escrow and credits Student wallet.

### 4.8. Submissions and Files

Submission includes:

- Project.
- Milestone.
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
- Original Final files should become downloadable only after Final approval or Admin dispute decision.
- Watermarked files may be used for review previews.

### 4.9. Review, Revision, and Invalid Files

SME review actions:

- `APPROVE_SKETCH`
- `APPROVE_FINAL`
- `REQUEST_REVISION`
- `REPORT_INVALID_FILE`
- `OPEN_DISPUTE`

Revision flow:

1. SME requests revision on a submission.
2. System creates revision request with requested changes and due date.
3. Project moves to `REVISION_REQUESTED`.
4. Student submits a revision.
5. SME reviews again.
6. Revision round cannot exceed the project max revision rounds.

Invalid file flow:

1. SME reports invalid file.
2. SME selects a reason: `EMPTY_FILE`, `CANNOT_OPEN`, `WRONG_FORMAT`, `UNRELATED`, `BROKEN_LINK`, or `OTHER`.
3. System creates invalid file report with reupload due date.
4. Student uploads corrected files through a new submission/revision.
5. SME reviews again or opens dispute.

### 4.10. Completion and Disbursement

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

### 4.11. Wallet and Withdrawal

Student wallet includes:

- Available balance.
- Pending balance.
- Locked balance.
- Status.

Payment method:

- Bank account holder name.
- Masked account number.
- Optional provider token.
- Default flag.

Withdrawal flow:

1. Student selects payment method.
2. Student enters amount.
3. System checks wallet is `ACTIVE`.
4. System checks `can_withdraw = true`.
5. System checks minimum amount is 50,000 VND.
6. System applies 5,000 VND fee.
7. System creates withdrawal request.
8. Admin/Finance processes request.
9. Success creates debit transaction.
10. Failure creates reversal transaction.

### 4.12. Dispute MVP

Dispute covers:

- Quality disagreement.
- Scope disagreement.
- Invalid file disagreement.
- Delayed delivery.
- Refund or partial payout decisions.

Flow:

1. Student or SME opens dispute.
2. Project becomes `DISPUTED`.
3. Funded escrow becomes `DISPUTED`.
4. Parties upload evidence or comments.
5. Admin reviews project, files, submissions, payment, and evidence.
6. Admin enters decision type, rationale, SME refund amount, Student payout amount, and platform fee amount.
7. System creates refund and/or disbursement as needed.
8. Dispute becomes `RESOLVED`.

In MVP, the decision is stored directly on `disputes`. Separate decision and appeal tables are post-MVP.

### 4.13. Rating

Rules:

- Rating is available only after `COMPLETED`.
- Student rates SME.
- SME rates Student.
- One rating per project/rater/rated user.
- Rating value is 1 to 5.
- Comment maximum is 500 characters.
- Rating window is 7 days after completion.
- Rating updates average rating and completed project count.

### 4.14. Notification

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
- Dispute opened/resolved.
- Escrow released.
- Withdrawal request status changed.
- Rating received.

Statuses:

- `UNREAD`
- `READ`

### 4.15. Audit Log

Audit important actions:

- Admin verification decision.
- SME project publish/cancel.
- Project status change.
- Payment webhook success/failed.
- Escrow funded/released/refunded/disputed.
- Admin dispute resolution.
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
8. System creates offer and escrow.
9. SME pays escrow.
10. Student accepts offer.
11. Project becomes `IN_PROGRESS`.

Expected result:

- Project has selected Student.
- Escrow is `FUNDED`.
- Sketch and Final milestones are ready.

### 5.3. Execution Flow

1. Student submits Sketch.
2. SME approves or requests revision.
3. Student submits revision if needed.
4. Sketch is approved.
5. Student submits Final.
6. SME approves, requests revision, reports invalid file, or opens dispute.
7. Final is approved.
8. Project is completed.

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

### 5.5. Dispute Flow

1. A party opens dispute.
2. Project and escrow become disputed.
3. Parties submit evidence.
4. Admin reviews.
5. Admin resolves.
6. System creates refund/disbursement.
7. Dispute is resolved.

Expected result:

- Escrow cannot be released while dispute is open.
- Admin decision has clear rationale and money allocation.

## 6. MVP Data Model

The MVP ERD has 34 entities:

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

Detailed attributes and relationships are in `Entity_Dictionary_D4U.md`. DBML for dbdiagram.io is in `D4U_ERD.dbml`.

## 7. Suggested API Groups

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

### 7.9. Ratings and Notifications

- `POST /projects/{id}/ratings`
- `GET /notifications`
- `POST /notifications/{id}/read`

## 8. Build Priority

### Phase 1: Foundation

- Auth email/password.
- Role authorization.
- User/profile CRUD.
- File metadata.
- Design category seed.
- Subscription plan seed.

### Phase 2: Marketplace

- Project create/publish/list/detail.
- Application flow.
- Offer flow.
- Project status history.

### Phase 3: Payment and Execution

- Escrow creation.
- Payment sandbox.
- Milestone creation.
- Submission upload.
- Review action.
- Revision request.
- Invalid file report.

### Phase 4: Completion and Money Movement

- Final approval.
- Disbursement.
- Wallet balance.
- Wallet transaction.
- Payment method.
- Withdrawal request.

### Phase 5: Trust and Operations

- Student verification admin.
- Dispute open/evidence/resolve.
- Rating.
- In-app notification.
- Audit log.

## 9. Out of MVP

- Realtime chat.
- Social login.
- Detailed portfolio builder.
- Skill/software matching.
- AI recommendation.
- Automated subscription billing.
- Dispute appeal.
- Reputation ledger.
- User warning workflow.
- Email/push notification delivery pipeline.
- Contract/e-signature.
- Advanced bank KYC.
- Native mobile app.

## 10. MVP Risks and Mitigation

### 10.1. Payment and escrow complexity

Mitigation:

- Start with sandbox payment.
- Keep payment, escrow, disbursement, and wallet transaction separate.
- Make webhook handling idempotent.

### 10.2. Dispute edge cases

Mitigation:

- Store the MVP decision directly on `disputes`.
- Let Admin manually allocate money.
- Move appeals to a later phase.

### 10.3. Difficult design file formats

Mitigation:

- Store original files in object storage.
- Store metadata in PostgreSQL.
- Apply watermark only to previewable formats.
- Use permission rules for Figma/AI/PSD/ZIP files.

### 10.4. Scope creep

Mitigation:

- Build only against the 34-entity MVP.
- Ask whether every new feature is required by the MVP checklist.
- Move non-required features to a later phase.

## 11. MVP Acceptance Checklist

- [x] Guest can register.
- [x] User can log in and log out.
- [x] Student can create profile.
- [x] SME can create profile.
- [x] Admin can approve or reject Student verification.
- [x] Basic, Pro, and Premium plans are seeded.
- [ ] Basic SME cannot publish more than 2 active open projects.
- [ ] Basic SME cannot publish a project above 5,000,000 VND.
- [ ] SME can create and publish an open project.
- [ ] Student can view open projects.
- [ ] Student can submit application.
- [ ] SME can view applications.
- [ ] SME can create offer.
- [ ] SME can fund escrow through sandbox payment.
- [ ] Student can accept offer.
- [ ] Project becomes `IN_PROGRESS`.
- [ ] System creates Sketch and Final milestones.
- [ ] Student can submit Sketch with valid files.
- [ ] SME can approve Sketch.
- [ ] SME can request revision.
- [ ] Student can submit Revision.
- [ ] Student can submit Final.
- [ ] SME can approve Final.
- [ ] Project becomes `COMPLETED`.
- [ ] Escrow releases successfully.
- [ ] Student wallet is credited with net amount.
- [ ] Student can create a valid withdrawal request.
- [ ] Student and SME can rate each other within 7 days.
- [ ] Student or SME can open dispute.
- [ ] Admin can resolve dispute.
- [ ] In-app notifications are created for key events.
- [ ] Audit logs are created for important actions.
