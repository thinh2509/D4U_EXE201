# D4U MVP Entity Dictionary

This document describes the optimized MVP-only ERD for D4U. It matches the 29 tables in `D4U_ERD.dbml` and supports the implementation scope in `MVP_D4U.md`.

## 1. Conventions

- Primary keys use `id uuid` unless noted otherwise.
- Money fields use `decimal(12,2)`.
- Default currency is `VND`.
- Table and column names in PostgreSQL use snake_case.
- C# code should use PascalCase properties.
- Soft delete is represented by nullable `deleted_at` fields when needed.
- Some MVP status fields are string-based for speed; important state machines use enums in DBML.
- `audit_logs` is the primary source for project status transition history in the optimized MVP model.
- Fixed Sketch/Final execution does not require a standalone milestone table.

## 2. Entities

### 2.1. users

Core account table for Student, SME, and Admin.

Key attributes:

- `id`: primary key.
- `email`: unique login email.
- `username`: unique username.
- `password_hash`: hashed password.
- `full_name`: display name.
- `avatar_url`: optional avatar.
- `role`: `STUDENT`, `SME`, or `ADMIN`.
- `status`: account status.
- `email_verified_at`, `last_login_at`, `created_at`, `updated_at`: lifecycle timestamps.

Relationships:

- One user has many sessions.
- One user may have one Student, SME, or Admin profile depending on role.
- Users are referenced by files, payments, portfolio moderation, ratings, notifications, and audit logs.

### 2.2. user_sessions

Refresh token sessions per device.

Key attributes:

- `user_id`: owner user.
- `refresh_token_hash`: hashed refresh token.
- `device_info`, `ip_address`: optional client metadata.
- `expires_at`, `revoked_at`, `created_at`: session timestamps.

Relationships:

- Many sessions belong to one user.

### 2.3. admin_profiles

Admin operation profile.

Key attributes:

- `user_id`: unique Admin user.
- `permission_level`: `SUPPORT`, `FINANCE`, or `SUPER_ADMIN`.
- `created_at`: creation timestamp.

Relationships:

- One Admin profile belongs to one user.

### 2.4. student_profiles

Student Designer profile.

Key attributes:

- `user_id`: unique Student user.
- `school`, `major`, `study_start_year`, `bio`: profile details.
- `onboarding_status`, `verification_status`: onboarding state.
- `average_rating`, `completed_projects_count`: performance metrics.
- `can_withdraw`: withdrawal eligibility.
- `created_at`, `updated_at`: lifecycle timestamps.

Relationships:

- One Student profile belongs to one user.
- Student profile is referenced by verification, applications, offers, submissions, projects, escrow, and wallet.

### 2.5. student_verifications

Student verification request reviewed by Admin.

Key attributes:

- `student_profile_id`: Student being verified.
- `document_file_id`: verification document file.
- `status`: review status.
- `reviewed_by_admin_id`: Admin reviewer.
- `rejection_reason`: required when rejected.
- `submitted_at`, `reviewed_at`: timestamps.

Relationships:

- Many verification requests belong to one Student profile.
- Verification uses one file and may be reviewed by one Admin user.

### 2.6. sme_profiles

SME company profile.

Key attributes:

- `user_id`: unique SME user.
- `company_name`, `representative_name`, `phone_number`, `business_field`: company details.
- `logo_file_id`: optional logo file.
- `onboarding_status`: onboarding state.
- `average_rating`, `completed_projects_count`, `active_open_project_count`: metrics.
- `subscription_plan_id`: current MVP plan used for publish limits and platform fee.
- `subscription_started_at`, `subscription_current_period_end`: lightweight plan lifecycle fields.
- `created_at`, `updated_at`: timestamps.

Relationships:

- One SME profile belongs to one user.
- SME profile owns its current plan reference, projects, and escrows.

### 2.7. subscription_plans

Subscription plan configuration.

Key attributes:

- `code`: unique plan code, such as `BASIC`, `PRO`, `PREMIUM`.
- `name`: display name.
- `monthly_price`: plan price.
- `platform_fee_rate`: fee percentage.
- `max_active_open_projects`: publishing limit.
- `max_project_budget`: budget limit.
- `is_active`: availability flag.

Relationships:

- One plan can be referenced by many SME profiles.

### 2.8. design_categories

Project category catalog.

Key attributes:

- `name`: unique category name.
- `description`: optional description.
- `is_active`: selectable flag.

Relationships:

- One category has many projects.

### 2.9. projects

Design project posted by an SME.

Key attributes:

- `sme_profile_id`: project owner.
- `selected_student_profile_id`: selected Student.
- `design_category_id`: category.
- `title`, `brief`, `usage_purpose`: project content.
- `project_type`: `OPEN` or `PRIVATE`.
- `status`: project workflow status.
- `budget_amount`, `currency`: commercial terms.
- `total_deadline_at`, `sketch_deadline_at`, `final_deadline_at`: deadlines.
- `max_revision_rounds`, `current_revision_round`: revision control.
- `is_confidential`, `allow_student_portfolio`: privacy settings.
- `rating_due_at`, `published_at`, `accepted_at`, `completed_at`, `cancelled_at`: lifecycle timestamps.

Relationships:

- Project belongs to one SME and one category.
- Project may select one Student.
- Project has attachments, applications, offers, submissions, review actions, escrow, portfolio items, ratings, and audit logs for lifecycle transitions.

### 2.10. project_attachments

Files attached to a project brief.

Key attributes:

- `project_id`: target project.
- `file_id`: attached file.
- `attachment_type`: attachment purpose.
- `created_at`: creation timestamp.

Relationships:

- Many attachments belong to one project.
- Each attachment references one file.

### 2.11. project_applications

Student application to an open project.

Key attributes:

- `project_id`: target project.
- `student_profile_id`: applicant.
- `proposed_price`: proposed amount.
- `cover_letter`: proposal text.
- `estimated_duration_days`: optional estimate.
- `status`, `submitted_at`, `updated_at`: application state.

Constraints:

- Unique `(project_id, student_profile_id)`.

Relationships:

- Many applications belong to one project.
- Many applications belong to one Student.
- An application may be linked to an offer.

### 2.12. project_offers

Offer from SME to Student.

Key attributes:

- `project_id`: target project.
- `student_profile_id`: invited Student.
- `application_id`: optional source application.
- `status`: offer status.
- `offered_amount`: offer value.
- `expires_at`: Student 48-hour decision deadline.
- `payment_due_at`: SME 72-hour escrow payment deadline after Student acceptance.
- `accepted_at`, `rejected_at`, `expired_at`, `created_at`: timestamps.

Relationships:

- Many offers belong to one project.
- Many offers target one Student.

### 2.13. project_submissions

Student delivery submission.

Key attributes:

- `project_id`: project.
- `submitted_by_student_id`: submitting Student.
- `submission_type`: `SKETCH`, `FINAL`, or `REVISION`.
- `milestone_type`: fixed stage `SKETCH` or `FINAL`.
- `revision_round`: revision number.
- `description`, `status`, `submitted_at`: submission details.
- `review_due_at`, `approved_at`, `auto_approved_at`: review and auto-approve timestamps.

Relationships:

- Many submissions belong to one project.
- Submission has files and review actions.
- Revision request and invalid file report details are stored as review actions.

### 2.14. submission_files

Files included in a submission.

Key attributes:

- `submission_id`: submission.
- `file_id`: original file.
- `watermarked_file_id`: optional review file.
- `is_original_downloadable`: download permission.
- `created_at`: timestamp.

Relationships:

- Many submission files belong to one submission.
- File references point to `files`.

### 2.15. review_actions

Review action on a submission.

Key attributes:

- `project_id`: project.
- `submission_id`: reviewed submission.
- `reviewer_user_id`: SME/Admin reviewer or null for system action.
- `action`: review action type.
- `comment`: optional comment.
- `requested_changes`, `revision_round`, `due_at`: revision request details when action is `REQUEST_REVISION`.
- `invalid_file_reason`, `reupload_due_at`: invalid file report details when action is `REPORT_INVALID_FILE`.
- `resolved_at`, `metadata_json`: resolution and structured context for auto/admin actions.
- `created_at`: timestamp.

Relationships:

- Many review actions belong to one project and one submission.
- Auto-approve actions use a null or system reviewer and must include reason `AUTO_APPROVED_TIMEOUT` in metadata.

### 2.16. files

File metadata table.

Key attributes:

- `owner_user_id`: optional file owner.
- `storage_provider`, `bucket`, `storage_key`: storage location.
- `original_filename`, `mime_type`, `file_extension`, `file_size_bytes`: file metadata.
- `checksum`, `visibility`, `scan_status`: integrity and access metadata.
- `created_at`, `deleted_at`: lifecycle timestamps.

Relationships:

- Files are referenced by profiles, verification, project attachments, submissions, and portfolio items.

### 2.17. escrows

Escrow record for a project.

Key attributes:

- `project_id`: unique project.
- `sme_profile_id`: payer SME.
- `student_profile_id`: receiving Student.
- `amount`, `currency`: escrow value.
- `platform_fee_rate`, `platform_fee_amount`: platform fee.
- `status`: escrow state.
- `funded_at`, `released_at`, `refunded_at`, `created_at`, `updated_at`: timestamps.

Relationships:

- One project has at most one escrow.
- Escrow has payments, refunds, and disbursements.

### 2.18. payments

Payment transaction from SME/provider.

Key attributes:

- `payer_user_id`: paying user.
- `escrow_id`: target escrow.
- `amount`, `currency`: payment value.
- `provider`, `provider_transaction_id`, `provider_order_code`: provider data.
- `checkout_url`, `qr_code`, `expires_at`: PayOS checkout data.
- `status`, `paid_at`, `created_at`, `updated_at`: payment state.
- `raw_provider_response_json`: raw provider response for support/debug.

Constraints:

- Unique `(provider, provider_transaction_id)`.
- Unique `(provider, provider_order_code)`.

Relationships:

- Many payments may belong to one escrow.
- Payment may be linked to refunds.

### 2.19. refunds

Refund from escrow/payment.

Key attributes:

- `escrow_id`: refunded escrow.
- `payment_id`: optional original payment.
- `amount`, `currency`: refund value.
- `reason`, `status`, `provider_refund_id`: refund details.
- `created_by_user_id`, `created_at`, `completed_at`: operation metadata.

Relationships:

- Many refunds belong to one escrow.

### 2.20. disbursements

Payout from escrow to Student wallet.

Key attributes:

- `escrow_id`: source escrow.
- `wallet_id`: destination wallet.
- `gross_amount`, `platform_fee_amount`, `net_amount`: payout values.
- `status`, `created_at`, `completed_at`: payout state.

Relationships:

- Many disbursements can reference one escrow.
- Disbursement credits one wallet.

### 2.21. wallets

Student wallet.

Key attributes:

- `owner_user_id`: wallet owner.
- `student_profile_id`: optional Student profile link.
- `currency`: wallet currency.
- `available_balance`, `pending_balance`, `locked_balance`: balances.
- `status`, `created_at`, `updated_at`: wallet state.

Relationships:

- One wallet belongs to one user.
- Wallet has transactions, disbursements, and withdrawal requests.

### 2.22. wallet_transactions

Wallet ledger entry.

Key attributes:

- `wallet_id`: wallet.
- `type`: transaction type.
- `amount`: movement amount.
- `balance_after`: balance after transaction.
- `reference_type`, `reference_id`: polymorphic reference.
- `description`, `created_at`: context.

Relationships:

- Many wallet transactions belong to one wallet.

### 2.23. payment_methods

Bank account/payment method for withdrawals.

Key attributes:

- `user_id`: owner.
- `method_type`: MVP default `BANK_ACCOUNT`.
- `account_holder_name`, `masked_account_number`, `provider_token`: bank details.
- `is_default`, `status`, `created_at`: state.

Relationships:

- Many payment methods belong to one user.
- Withdrawal requests use payment methods.

### 2.24. withdrawal_requests

Student withdrawal request.

Key attributes:

- `wallet_id`: source wallet.
- `requested_by_user_id`: requester.
- `payment_method_id`: destination method.
- `amount`, `fee_amount`, `net_amount`: withdrawal values.
- `status`, `failure_reason`, `requested_at`, `processed_at`: state.

Relationships:

- Many withdrawal requests belong to one wallet and one user.

### 2.25. student_portfolio_items

Basic Student portfolio item.

Key attributes:

- `student_profile_id`: portfolio owner.
- `source_project_id`: optional completed D4U project reference.
- `design_category_id`: optional category.
- `title`, `description`: portfolio content.
- `student_role`, `tools`, `skills`: contribution and capability details.
- `external_url`: optional external portfolio/demo link.
- `status`: `DRAFT`, `PUBLIC`, `PRIVATE`, or `HIDDEN`.
- `is_featured`: featured/pinned item flag.
- `published_at`: public publishing timestamp.
- `hidden_by_admin_id`, `hidden_reason`: moderation fields.
- `created_at`, `updated_at`: lifecycle timestamps.

Relationships:

- Many portfolio items belong to one Student profile.
- Portfolio item may reference one completed project.
- Portfolio item may reference one design category.
- Portfolio item may be hidden by one Admin user.
- Portfolio item has portfolio files.

Rules:

- Public items linked to a D4U project must respect `projects.is_confidential` and `projects.allow_student_portfolio`.
- Admin-hidden items should not be visible to SMEs or public portfolio viewers.

### 2.26. student_portfolio_files

Files attached to a Student portfolio item.

Key attributes:

- `portfolio_item_id`: portfolio item.
- `file_id`: attached file.
- `display_order`: ordering inside the portfolio item.
- `created_at`: timestamp.

Relationships:

- Many portfolio files belong to one portfolio item.
- Each portfolio file references one file metadata record.

### 2.27. ratings

Post-completion rating.

Key attributes:

- `project_id`: completed project.
- `rater_user_id`: reviewer.
- `rated_user_id`: reviewed user.
- `rating_value`: 1 to 5.
- `comment`: optional text.
- `is_public`, `created_at`: display and timing.

Constraints:

- Unique `(project_id, rater_user_id, rated_user_id)`.

Relationships:

- Many ratings belong to one project.

### 2.28. notifications

In-app notification.

Key attributes:

- `recipient_user_id`: recipient.
- `actor_user_id`: optional actor.
- `type`, `title`, `body`: notification content.
- `reference_type`, `reference_id`: related object.
- `status`, `read_at`, `created_at`: read state.

Relationships:

- Many notifications belong to one recipient user.

### 2.29. audit_logs

Operational audit record.

Key attributes:

- `actor_user_id`: actor.
- `action`: action name.
- `entity_type`, `entity_id`: affected entity.
- `before_json`, `after_json`: change data.
- `ip_address`, `user_agent`: request metadata.
- `created_at`: timestamp.

Relationships:

- Many audit logs can belong to one actor user.
- Entity reference is polymorphic.

## 3. Relationship Summary

### 3.1. Account and Profile

- `users` 1-n `user_sessions`.
- `users` 1-0..1 `admin_profiles`.
- `users` 1-0..1 `student_profiles`.
- `users` 1-0..1 `sme_profiles`.

### 3.2. Verification and Files

- `student_profiles` 1-n `student_verifications`.
- `files` 1-n `student_verifications`.
- `users` 1-n `student_verifications` as Admin reviewer.
- `users` 1-n `files` as owner.

### 3.3. SME Plan

- `subscription_plans` 1-n `sme_profiles`.

### 3.4. Project Marketplace

- `sme_profiles` 1-n `projects`.
- `student_profiles` 1-n `projects` as selected Student.
- `design_categories` 1-n `projects`.
- `projects` 1-n `project_attachments`.
- `projects` 1-n `project_applications`.
- `student_profiles` 1-n `project_applications`.
- `projects` 1-n `project_offers`.
- `student_profiles` 1-n `project_offers`.
- `project_applications` 1-n `project_offers`.
- Project status transitions are recorded in `audit_logs`.

### 3.5. Execution

- `projects` 1-n `project_submissions`.
- `project_submissions` 1-n `submission_files`.
- `project_submissions` 1-n `review_actions`.
- Revision requests and invalid file reports are stored as `review_actions`.

### 3.6. Money Movement

- `projects` 1-0..1 `escrows`.
- `escrows` 1-n `payments`.
- `escrows` 1-n `refunds`.
- `escrows` 1-n `disbursements`.
- `wallets` 1-n `disbursements`.
- `wallets` 1-n `wallet_transactions`.
- `users` 1-n `payment_methods`.
- `wallets` 1-n `withdrawal_requests`.

### 3.7. Trust and Operations

- `student_profiles` 1-n `student_portfolio_items`.
- `projects` 1-n `student_portfolio_items` as optional source project.
- `design_categories` 1-n `student_portfolio_items`.
- `student_portfolio_items` 1-n `student_portfolio_files`.
- `projects` 1-n `ratings`.
- `users` 1-n `notifications`.
- `users` 1-n `audit_logs`.

## 4. Enum Summary

- `user_role`: STUDENT, SME, ADMIN.
- `user_status`: PENDING, ACTIVE, SUSPENDED, BANNED, DELETED.
- `project_type`: OPEN, PRIVATE.
- `project_status`: DRAFT, OPEN, PRIVATE_INVITED, OFFER_SELECTED, IN_PROGRESS, SKETCH_REVIEW, REVISION_REQUESTED, FINAL_REVIEW, ADMIN_REVIEW, COMPLETED, CANCELLED.
- `offer_status`: WAITING_ACCEPTANCE, ACCEPTED, REJECTED, EXPIRED, PENDING_PAYMENT, PAYMENT_FAILED, ACTIVE.
- `payment_status`: PENDING, SUCCESS, FAILED, CANCELLED, EXPIRED.
- `escrow_status`: PENDING_PAYMENT, FUNDED, RELEASE_PENDING, RELEASED, REFUNDED, PARTIALLY_REFUNDED, CANCELLED.
- `submission_type`: SKETCH, FINAL, REVISION.
- `submission_stage`: SKETCH, FINAL.
- `submission_status`: SUBMITTED, VALID, INVALID_REPORTED, APPROVED, REVISION_REQUESTED.
- `review_action_type`: APPROVE_SKETCH, APPROVE_FINAL, REQUEST_REVISION, REPORT_INVALID_FILE, AUTO_APPROVE, ADMIN_FORCE_COMPLETE, ADMIN_CANCEL.
- `invalid_file_reason`: EMPTY_FILE, CANNOT_OPEN, WRONG_FORMAT, UNRELATED, BROKEN_LINK, OTHER.
- `portfolio_item_status`: DRAFT, PUBLIC, PRIVATE, HIDDEN.
- `wallet_status`: ACTIVE, LOCKED, CLOSED.
- `wallet_transaction_type`: DISBURSEMENT_CREDIT, WITHDRAWAL_DEBIT, WITHDRAWAL_FAILED_REVERSAL, ADMIN_ADJUSTMENT.
- `notification_status`: UNREAD, READ.
