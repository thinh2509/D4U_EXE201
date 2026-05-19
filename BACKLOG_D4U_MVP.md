# D4U MVP Backlog

This backlog is derived from `MVP_D4U.md` and keeps the first build limited to the 34-entity MVP scope.

## Phase 1 - Foundation

### Auth and Account

- [x] Register with email, username, password, full name, and role.
- [x] Login with email/password.
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
- [x] System creates student verification request.
- [x] Admin can approve student verification.
- [x] Admin can reject student verification with rejection reason.
- [x] Student profile verification status updates after admin decision.

### File Metadata and Seeds

- [ ] Store upload metadata for files with provider, bucket, storage key, filename, MIME type, extension, size, visibility, and scan status.
- [ ] Enforce MVP allowed file extensions in service layer: jpg, jpeg, png, webp, pdf, zip, fig, ai, psd, svg.
- [ ] Seed Basic, Pro, and Premium subscription plans.
- [ ] Seed initial active design categories.

## Phase 2 - Marketplace

### Project Creation and Publishing

- [ ] SME can create draft project.
- [ ] Project captures title, brief, usage purpose, design category, type, budget, deadlines, revision limit, confidentiality, and portfolio permission.
- [ ] Validate budget is greater than zero.
- [ ] Validate sketch deadline is before or equal to final deadline.
- [ ] Validate final deadline is before or equal to total deadline.
- [ ] SME can publish open project.
- [ ] Enforce subscription active open project limit on publish.
- [ ] Enforce subscription max budget on publish.
- [ ] Basic plan cannot publish more than 2 active open projects.
- [ ] Basic plan cannot publish project over 5,000,000 VND.
- [ ] Create project status history for important transitions.
- [ ] Student can list and view open projects.

### Applications and Offers

- [ ] Student can submit one application per open project.
- [ ] Application captures proposed price, cover letter, and estimated duration.
- [ ] SME can view applications for own project.
- [ ] SME can select an application and create offer.
- [ ] SME can create private project offer without an application.
- [ ] Offer starts as `PENDING_PAYMENT`.
- [ ] Student can accept funded offer.
- [ ] Student can reject offer.
- [ ] Accepted offer selects student and moves project into execution flow.

## Phase 3 - Payment and Execution

### Escrow and Payment

- [ ] Create escrow when SME creates offer.
- [ ] Store escrow amount, currency, fee rate, fee amount, and status.
- [ ] Start payment through MVP sandbox/provider.
- [ ] Store payment provider, provider transaction id, status, and paid timestamp.
- [ ] Enforce unique provider transaction id per provider.
- [ ] Payment success funds escrow.
- [ ] Funded escrow moves offer to `WAITING_ACCEPTANCE`.
- [ ] Project cannot start unless escrow is funded.
- [ ] Escrow in `DISPUTED` cannot be released.

### Milestones and Submissions

- [ ] Accepted funded offer starts project as `IN_PROGRESS`.
- [ ] System creates exactly two milestones: `SKETCH` and `FINAL`.
- [ ] Student can submit Sketch with valid file metadata.
- [ ] Project moves to Sketch submitted or in review status.
- [ ] SME can approve Sketch.
- [ ] Student can submit Final only after Sketch approved or auto-approved.
- [ ] Student can submit Final files.
- [ ] Project moves to Final submitted or in review status.
- [ ] Store submission type, revision round, description, status, and submitted timestamp.
- [ ] Store submission files with optional watermarked file and original-download permission.

### Review, Revision, and Invalid Files

- [ ] SME can approve final submission.
- [ ] SME can request revision with requested changes and due date.
- [ ] Project moves to `REVISION_REQUESTED`.
- [ ] Student can submit revision.
- [ ] Revision round cannot exceed project max revision rounds.
- [ ] SME can report invalid file.
- [ ] Invalid file report captures reason, description, status, and reupload due date.
- [ ] SME can open dispute from review.

## Phase 4 - Completion and Money Movement

### Completion and Disbursement

- [ ] Final approval moves project to `COMPLETED`.
- [ ] Escrow moves to `RELEASE_PENDING`.
- [ ] Calculate platform fee from escrow amount and stored fee rate.
- [ ] Create disbursement with gross amount, fee, and net amount.
- [ ] Credit Student wallet available balance with net amount.
- [ ] Create wallet transaction `DISBURSEMENT_CREDIT`.
- [ ] Escrow moves to `RELEASED`.
- [ ] Project rating due date is set to 7 days after completion.

### Wallet and Withdrawal

- [ ] Student has wallet with available, pending, locked balances, currency, and status.
- [ ] Student can create bank account payment method.
- [ ] Student can request withdrawal.
- [ ] Withdrawal requires wallet `ACTIVE`.
- [ ] Withdrawal requires student `can_withdraw = true`.
- [ ] Withdrawal minimum amount is 50,000 VND.
- [ ] Withdrawal fee is 5,000 VND.
- [ ] Admin/Finance can process withdrawal request.
- [ ] Successful withdrawal creates debit transaction.
- [ ] Failed withdrawal creates reversal transaction.
- [ ] Wallet balance must never go negative.

## Phase 5 - Trust and Operations

### Disputes

- [ ] Student or SME can open dispute.
- [ ] Open dispute moves project to `DISPUTED`.
- [ ] Open dispute moves funded escrow to `DISPUTED`.
- [ ] Parties can upload evidence or comments.
- [ ] Admin can view dispute context.
- [ ] Admin can resolve dispute with decision type, rationale, SME refund amount, Student payout amount, and platform fee amount.
- [ ] Resolution creates refund and/or disbursement records as needed.
- [ ] Dispute moves to `RESOLVED`.

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
- [ ] Create in-app notification for dispute opened/resolved.
- [ ] Create in-app notification for escrow released.
- [ ] Create in-app notification for withdrawal request status changes.
- [ ] Create in-app notification for rating received.
- [ ] Mark notification as read.
- [ ] Record audit log for admin verification decisions.
- [ ] Record audit log for SME publish/cancel project.
- [ ] Record audit log for project status changes.
- [ ] Record audit log for payment webhook success/failed.
- [ ] Record audit log for escrow funded/released/refunded/disputed.
- [ ] Record audit log for admin dispute resolution.
- [ ] Record audit log for wallet balance changes.
- [ ] Record audit log for withdrawal processing.
- [ ] Record audit log for user suspended/banned.

## Explicitly Out of MVP

- [ ] Do not implement social login.
- [ ] Do not implement realtime chat.
- [ ] Do not implement AI recommendation.
- [ ] Do not implement detailed portfolio builder.
- [ ] Do not implement dispute appeal.
- [ ] Do not implement reputation ledger.
- [ ] Do not implement email/push delivery pipeline.
- [ ] Do not implement automatic subscription billing.
- [ ] Do not implement advanced bank KYC.
- [ ] Do not implement mobile-native features.
