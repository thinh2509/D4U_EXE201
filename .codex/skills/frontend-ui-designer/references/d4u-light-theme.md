# D4U Frontend Reference

Use this reference for D4U React/Vite frontend work. Verify current source before implementation; this file is a navigation aid, not a substitute for reading the repo.

## Source Map

- Routes: `FE/src/App.jsx`
- Layout/nav/page titles: `FE/src/components/AppLayout.jsx`
- API client: `FE/src/services/apiClient.js`
- API modules: `FE/src/services/*Api.js`
- Shared UI: `FE/src/components`, `FE/src/pages/shared`
- Styles/tokens: `FE/src/styles.css`
- Backend contracts: `D4U.Api/Controllers`, `D4U.Api/Application/Features/*/*Dtos.cs`

## Brand And CSS Tokens

D4U is a light creative-marketplace UI using cyan, teal, charcoal, white surfaces, and restrained shadows.

Use current CSS variables from `FE/src/styles.css` when possible:

- `--primary: #12AEEA`
- `--primary-strong: #0B9BD3`
- `--primary-soft: #E7F8FE`
- `--cyan: #12AEEA`
- `--cyan-bright: #48C8F2`
- `--teal: #075D78`
- `--charcoal: #1D2428`
- `--ink: #1D2428`
- `--muted: #64748B`
- `--muted-strong: #334155`
- `--surface: #ffffff`
- `--surface-soft: #F8FAFC`
- `--surface-tint: #F1F5F9`
- `--border: #D7E5EC`
- `--border-soft: #E8F1F5`
- `--warning: #F59E0B`
- `--success: #10B981`
- `--danger: #EF4444`
- `--radius-sm: 12px`
- `--radius-md: 18px`
- `--radius-lg: 24px`
- `--shadow-xs`, `--shadow-sm`, `--shadow-md`, `--ring`

Rules:

- Use cyan/teal for CTAs, links, active nav, selected tabs, focus rings, and icon accents.
- Use charcoal/deep teal for headings, navigation, and trust-heavy payment/withdrawal surfaces.
- Keep the app light. Do not make the whole UI dark.
- Do not use purple/indigo as the primary system.
- Avoid decorative blobs, unrelated gradients, and one-note blue pages.

## Current Routes

Public:

- `/`
- `/login`
- `/register`
- `/verify-email`
- `/payment/success`
- `/payment/cancel`
- `/forbidden`

Student:

- `/student/dashboard`
- `/student/profile`
- `/student/verification`
- `/student/projects`
- `/student/projects/:projectId`
- `/student/applications`
- `/student/offers`
- `/student/my-projects`
- `/student/portfolio`
- `/student/wallet`
- `/student/ratings`

SME:

- `/sme/dashboard`
- `/sme/profile`
- `/sme/projects`
- `/sme/projects/new`
- `/sme/projects/:projectId`
- `/sme/projects/:projectId/edit`
- `/sme/projects/:projectId/applications`
- `/sme/applications`
- `/sme/offers`
- `/sme/ai-brief`
- `/sme/ai-matching`
- `/sme/billing`
- `/sme/ratings`

Admin:

- `/admin/dashboard`
- `/admin/verifications`
- `/admin/verifications/:verificationId`
- `/admin/student-verifications` redirects to `/admin/verifications`
- `/admin/student-verifications/:verificationId`
- `/admin/portfolio`
- `/admin/withdrawals`
- `/admin/users`
- `/admin/audit-logs`

Shared protected:

- `/projects/:projectId/execution`
- `/projects/:projectId/submissions`
- `/projects/:projectId/rating`

## Endpoint Groups

Use `baseURL: '/api/v1'` through `apiClient`.

Auth:

- `/auth/register`
- `/auth/login`
- `/auth/refresh`
- `/auth/logout`
- `/auth/me`
- `/auth/email-verification/*`
- `/auth/google`

Profiles and verification:

- `/students/me`
- `/students/me/verification`
- `/students/me/edu-verification/*`
- `/smes/me`
- `/admin/student-verifications`
- `/admin/student-verifications/{id}`
- `/admin/student-verifications/{id}/document`
- `/admin/student-verifications/{id}/approve`
- `/admin/student-verifications/{id}/reject`

Projects, applications, offers, workspace:

- `/projects`
- `/projects/{id}`
- `/projects/{id}/publish`
- `/projects/{id}/cancel`
- `/projects/{id}/applications`
- `/projects/{id}/offers`
- `/students/me/applications`
- `/students/me/offers`
- `/students/me/projects`
- `/smes/me/applications`
- `/smes/me/offers`
- `/offers/{id}/accept`
- `/offers/{id}/reject`
- `/projects/{id}/workspace`
- `/projects/{id}/submissions`
- `/projects/{id}/submissions/{submissionId}/approve`
- `/projects/{id}/submissions/{submissionId}/revision`
- `/projects/{id}/submissions/{submissionId}/invalid-file`

Payments and money movement:

- `/offers/{id}/payment`
- `/payments/{id}/return-status`
- `/payments/webhook`
- `/wallets/me`
- `/wallets/me/transactions`
- `/payment-methods`
- `/payment-methods/me`
- `/withdrawal-requests`
- `/withdrawal-requests/me`
- `/admin/withdrawal-requests`
- `/admin/withdrawal-requests/{id}/process`
- `/admin/refunds/pending`
- `/admin/refunds/{id}/complete`

Ratings and notifications:

- `/projects/{id}/ratings`
- `/ratings/me`
- `/notifications`
- `/notifications/{id}/read`
- `/notifications/read-all`

AI, packages, portfolio:

- `/ai/project-brief-assistant`
- `/feature-packages`
- `/feature-package-purchases`
- `/feature-package-purchases/{id}/payment`
- `/me/feature-entitlements`
- `/ai/matching/projects`
- `/ai/matching/projects/{id}/students`
- `/students/me/portfolio`
- `/students/me/portfolio-items`
- `/students/me/portfolio-items/{id}`
- `/students/me/portfolio-items/{id}/publish`
- `/students/me/portfolio-items/{id}/unpublish`
- `/students/{id}/portfolio`
- `/admin/portfolio-items/{id}/hide`

If an endpoint is missing in backend source, do not fake the business behavior. Adapt the UX to existing APIs or report the backend gap.

## Status Mapping

Always show text labels. Use existing `StatusBadge` and `FE/src/constants/status.js` first.

- Warning: `PENDING`, `UNDER_REVIEW`, `WAITING_ACCEPTANCE`, `PENDING_PAYMENT`, `PAYMENT_FAILED`, `REVISION_REQUESTED`, `RELEASE_PENDING`, `REFUND_PENDING`, `PROCESSING`.
- Success: `ACTIVE`, `VERIFIED`, `OPEN`, `ACCEPTED`, `FUNDED`, `RELEASED`, `COMPLETED`, `APPROVED`, `PUBLIC`, `SUCCESS`.
- Error: `REJECTED`, `FAILED`, `INVALID_REPORTED`, `BANNED`, `SUSPENDED`, `STUDENT_ABANDONED`.
- Neutral: `DRAFT`, `PRIVATE`, `CANCELLED`, `DELETED`, `REFUNDED`, `HIDDEN`, `EXPIRED`.
- Info/primary: `PRIVATE_INVITED`, `OFFER_SELECTED`, `IN_PROGRESS`, `SKETCH_SUBMITTED`, `FINAL_SUBMITTED`, `ADMIN_REVIEW`, `AI_MATCHED`.

Do not add `DISPUTED` UI for MVP.

## Page Patterns

App shell:

- Use `AppLayout` for role nav, header context, mobile drawer, and protected content.
- Add role routes in `App.jsx`, nav entries and page titles in `AppLayout.jsx`.
- Keep role workspaces utilitarian and scannable, not marketing-heavy.

Tables and operational screens:

- Prefer `Card` with `table-card`, AntD `Table`, clear refresh action, empty text, and horizontal scroll for wide data.
- For dense admin workflows, use a list/detail workbench pattern like withdrawals rather than many nested cards.

Forms:

- Use AntD `Form`, visible labels, grouped sections, helper text for business rules, and `getApiErrorMessage`.
- Validate budget, deadlines, required fields, and allowed file extensions before API calls where practical.
- Allowed MVP file extensions for verification, portfolio, and submissions: `jpg`, `png`, `pdf`.

Project marketplace:

- Cards should include title, SME/company, category, budget, deadline, status, brief preview, confidentiality/portfolio permission, and one primary CTA.
- Student CTA: apply or view application state.
- SME owner CTA: edit, publish, cancel, view applications, open workspace.

Execution workspace:

- Use `/projects/:projectId/execution` as the shared Student/SME workspace.
- Show escrow/payment state, offer state, submission timeline, next action, and role-specific actions.
- Student submits Sketch, Final, and revisions with description and file metadata.
- SME approves, requests revision, or reports invalid file.
- Do not include dispute actions.

Payment and escrow:

- Show amount, currency, provider, checkout link/QR state, and backend payment status.
- Explain that project starts only after escrow is funded.
- Provider return pages should guide back to workspace and refresh backend status.
- Do not show sandbox/mock wording in production UI.

Wallet and withdrawal:

- State that Student wallet is an internal D4U ledger.
- Show available, pending/locked balances, transaction history, payment methods, withdrawal request form, and withdrawal history.
- Admin/Finance manually processes transfer outside the system in MVP.
- Do not design automatic bank payout or bank balance sync.

Notifications:

- Use in-app notifications only.
- Notification UI should support unread count, newest-first list, mark one read, mark all read, refresh, and role-aware navigation from `referenceType`/`type`.
- No realtime requirement unless explicitly requested.

Ratings:

- Simple 1-5 rating with optional public comment up to backend limit.
- Show rating deadline when available.
- Link rating actions from completed project workspace.

Portfolio:

- Student creates and manages basic portfolio items.
- Attach completed D4U output only when project confidentiality and `allowStudentPortfolio` permit it.
- SME can view public portfolio during application/offer review.
- Admin can hide inappropriate public portfolio items.

AI and paid features:

- AI Brief Assistant is a form helper, not a chatbot-first flow.
- AI Matching must show entitlement requirement, match score, reasons, and missing-data warnings when API supports it.
- Never imply AI can auto-apply, auto-invite, auto-select, auto-price, auto-publish, or approve verification.
