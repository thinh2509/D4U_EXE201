---
name: d4u-frontend
description: >
  Design and implement D4U frontend screens, components, and flows.
  Use when building any React/Vite page or component for D4U: auth,
  dashboards, marketplace, project execution, payment/escrow, wallet,
  withdrawal, portfolio, AI matching, admin screens, or any role-based UI.
  Enforces D4U brand system, N-Layer API contract patterns, and MVP scope.
---

# D4U Frontend Skill

## Before writing any code

1. Read existing routes, contexts, and API clients — never re-invent what exists.
2. Confirm the backend endpoint and DTO shape before mapping UI states.
3. List the states the page must handle: loading · empty · error · forbidden · success.
4. Do not invent API endpoints. If one is missing, note the gap and adapt the UX.

---

## Brand & design tokens

### Color palette — use these CSS variables everywhere

```css
/* Core */
--d4u-cyan: #12aeea; /* primary action, links, active nav, focus rings */
--d4u-cyan-hover: #0b9bd3;
--d4u-teal-deep: #075d78; /* headings, nav accents, structure */
--d4u-teal-muted: #0a6f8e;
--d4u-charcoal: #1d2428; /* body text */
--d4u-nav-dark: #071014; /* top nav bg */

/* Surfaces */
--d4u-bg: #f6fafd;
--d4u-surface: #ffffff;
--d4u-soft: #eef6fa;

/* Text */
--d4u-text-1: #1d2428;
--d4u-text-2: #667985;
--d4u-text-3: #8ea0aa;
--d4u-border: #d7e5ec;

/* Semantic */
--d4u-success: #16a34a;
--d4u-warning: #f59e0b;
--d4u-error: #dc2626;
--d4u-info: #0ea5e9;
```

**Rules:**

- Cyan/teal = primary actions, active states, focus rings, brand accents.
- Charcoal/dark teal = structure, headings, nav.
- Keep the app light — no full-dark UI.
- Never use purple/indigo as the primary action color.
- No decorative blobs, random gradients, or single-hue blue screens.

### Typography

```
Display / headings : General Sans (fallback: system-ui)
Body / UI          : DM Sans (fallback: system-ui)
Code / metadata    : JetBrains Mono
```

| Element        | Size (desktop) | Size (mobile) | Weight |
| -------------- | -------------- | ------------- | ------ |
| Page title     | 36–40px        | 28–32px       | 600    |
| Section h2     | 24–32px        | 20–24px       | 600    |
| Card title     | 18–24px        | 16–20px       | 500    |
| Body           | 14–16px        | 14–16px       | 400    |
| Caption / meta | 12–13px        | 12px          | 400    |

Do not use viewport-relative font sizes (no `vw` units on type).

### Spacing, radius, elevation

```
Spacing grid : 4px base
Max content  : 1280px
Page padding : 16px mobile · 24px tablet · 24–32px desktop

Radii:
  chip / tag          : 9999px
  button / input      : 6px
  panel / dropdown    : 8px
  card (project/user) : 12px

Elevation:
  static card  : border-first, shadow: none or 0 1px 3px rgba(0,0,0,.06)
  hover card   : translateY(-2px), shadow: 0 4px 12px rgba(0,0,0,.10)
  focus ring   : 0 0 0 3px rgba(18,174,234,.16)
```

---

## Layout patterns

| Context          | Columns                                                 |
| ---------------- | ------------------------------------------------------- |
| Marketplace grid | 1 mobile · 2 tablet · 3 desktop · 4 large (if readable) |
| Dashboard        | 1 mobile · 2 tablet · sidebar+main desktop              |
| Forms            | Single column, max 640px wide                           |
| Admin tables     | Full width, horizontal scroll on mobile                 |

- Use cards for repeated items, panels, modals, and real framed tools. Do not nest cards.
- Filters/nav on mobile → drawer, not horizontal overflow.
- Right-side summary panel on desktop for project detail pages.

---

## Status chips

Always show text labels. Never rely on color alone.

| Status value(s)                                                                                        | Variant |
| ------------------------------------------------------------------------------------------------------ | ------- |
| `PENDING` `UNDER_REVIEW` `WAITING_ACCEPTANCE` `PENDING_PAYMENT` `REVISION_REQUESTED` `RELEASE_PENDING` | warning |
| `ACTIVE` `VERIFIED` `OPEN` `ACCEPTED` `FUNDED` `RELEASED` `COMPLETED` `APPROVED` `PUBLIC`              | success |
| `REJECTED` `FAILED` `INVALID_REPORTED` `BANNED` `SUSPENDED`                                            | error   |
| `DRAFT` `PRIVATE` `CANCELLED` `DELETED` `REFUNDED` `HIDDEN`                                            | neutral |
| `PRIVATE_INVITED` `IN_PROGRESS` `SKETCH_REVIEW` `FINAL_REVIEW` `AI_MATCHED`                            | info    |

Do not add `DISPUTED` chip — out of MVP scope.

---

## Role navigation

### Guest

Browse Projects · Pricing · Login · Register

### Student

Dashboard · Browse Projects · Applications · Offers · My Projects · Portfolio · Wallet · Profile · Verification · Ratings

### SME

Dashboard · My Projects · Applications · Offers · AI Brief · AI Matching · Billing / Packages · Profile · Ratings

### Admin

Dashboard · Verifications · Portfolio Moderation · Withdrawals · Users · Audit Logs

---

## Route map

```
Public
  /                           Home
  /login                      Login
  /register                   Register
  /verify-email               Email verification
  /projects                   Marketplace
  /pricing                    Packages

Student  (prefix /student)
  /dashboard
  /profile
  /verification
  /projects                   Applied projects
  /applications
  /offers
  /my-projects
  /portfolio
  /wallet
  /ratings

SME  (prefix /sme)
  /dashboard
  /profile
  /projects
  /projects/new
  /projects/:id/edit
  /projects/:id/applications
  /offers
  /ai-brief
  /ai-matching
  /billing
  /ratings

Shared
  /projects/:id               Project detail
  /projects/:id/execution     Milestone dashboard
  /projects/:id/submissions   Submission history
  /projects/:id/rating        Rate counterpart

Admin  (prefix /admin)
  /dashboard
  /verifications
  /verifications/:id
  /portfolio
  /withdrawals
  /users
  /audit-logs
```

---

## Component library (use existing first, create if missing)

```
AppShell              RoleBasedNav          PageHeader
SectionHeader         StatusChip            EmptyState
LoadingSkeleton       ProjectCard           StudentCard
ApplicationCard       OfferCard             VerificationCard
WalletSummaryCard     PortfolioItemCard     DashboardStatCard
ProjectTimeline       PaymentSummary        EscrowStatusPanel
FileMetadataUploader  ConfirmDialog         DataTable
FilterBar             MobileFilterDrawer
```

---

## Page-level patterns

### Auth pages

- Light, centered or split layout. D4U logo visible.
- Google OAuth button when configured.
- Clear role selector: Student vs SME.
- Email verification state with resend/confirm flow.

### Student dashboard

Priority sections: verification status · recommended projects · pending offers · active projects · wallet summary.
Primary CTA: **Browse Projects**.

### SME dashboard

Priority sections: subscription/package limits · draft/open projects · pending payments · AI Brief entry.
Primary CTA: **Create Project**.

### Admin dashboard

Show pending counts: verifications · withdrawals · portfolio moderation · recent audit events.

### Marketplace

Search + filter toolbar · project cards · empty state with CTA.
Project card must show: title · company · category · budget · deadline · status chip · brief preview · confidentiality/portfolio badges.

### Project detail

Desktop: brief area (left/main) + summary panel (right).
Summary: budget · deadlines · SME/company · category · usage purpose · revision limit · confidentiality · portfolio permission.
Student CTA: Apply. SME owner CTA: Edit / Publish / Cancel.

### AI Brief Assistant

- Position AI as a helper, not a chatbot.
- Show editable suggestion fields: title · brief · usage purpose · deliverables · category hint · deadline notes.
- Always display: "AI suggestions are editable and are never published automatically."

### AI Matching (paid — entitlement required)

- Show entitlement requirement before allowing access.
- Results show: match score · reasons · missing-data warnings.
- Never imply AI can auto-apply, auto-select, auto-price, or auto-publish.

### Payment & escrow screens

- Show: amount · platform fee · provider name · QR or link · escrow explanation.
- "Project starts only after escrow is confirmed by the payment provider."
- Never show "sandbox" label in production.
- UI must wait for backend-confirmed status — never trust client-side success flag.
- Offer flow state machine: `PENDING_ACCEPTANCE` → Student accept/reject → `ACCEPTED` → SME pays → `PENDING_PAYMENT` → webhook → `ACTIVE` → project `IN_PROGRESS`.
- Do not show SME payment button until Student has accepted the offer.

### Wallet & withdrawal (Student)

- Make clear: D4U wallet is an internal ledger, not a bank account.
- Show: available balance · pending · locked · currency · wallet status · transaction history · withdrawal requests.
- Withdrawal form: amount input (min 50 000 VND) · bank account selector · fee preview (5 000 VND fixed) · net amount.
- Add note: "Admin/Finance manually processes the transfer outside D4U. You will be notified when complete."
- Do not design automatic bank payout.

### Admin withdrawal screen

- Table: request ID · student name · amount · bank · created at · status chip · actions.
- Actions: Mark Success (requires confirmation modal) · Mark Failed (requires reason input).
- Success modal: confirm amount, debit warning, optional note.
- Failed modal: mandatory reason field, note that wallet will not be debited and student can retry.

### Submission & review

Student submits: Sketch · Final · Revision with description + file metadata.
SME review actions (separate buttons): Approve · Request Revision · Report Invalid File.
Do not add Open Dispute — out of MVP.

### Portfolio Builder

- Student: create/edit items (title · description · category · role · tools · skills · link · visibility · featured flag · file metadata).
- Only allow attaching completed D4U project output when `isConfidential = false` AND `allowStudentPortfolio = true`.
- SME: read-only view of public portfolio during application/offer review.
- Admin: Hide button on any public item.

### Rating page

- Only render after project `COMPLETED`.
- Show rating deadline (7 days after completion).
- 1–5 star selector + comment textarea (max 500 chars).
- Hide form once rating submitted for this project.

---

## Form rules

- Use visible labels — no placeholder-only fields.
- Group related fields into named sections.
- Show helper text for budget, deadlines, file extension, and revision limit fields.
- Validate client-side where reasonable (extension check, min/max budget, date ordering) before API call.
- Surface backend validation errors near the relevant field.
- Always use `ConfirmDialog` for destructive actions (cancel project, hide portfolio item, mark withdrawal failed).

Allowed file extensions in MVP: `jpg` · `png` · `pdf`

---

## API integration rules

```js
// Never hardcode host in page components
baseURL: "/api/v1";
```

- Inject access token in every authenticated request.
- On `401`: attempt refresh token → retry original request once.
- On refresh failure: clear session → redirect to `/login`.
- On `403`: render `<ForbiddenState>` component.
- On `404`: render `<NotFoundState>` or treat as "not yet created" (e.g. empty wallet, no portfolio).
- Map field-level validation errors from backend `errors[]` to form fields when available.

### State checklist for every page/component

| State     | Required handling                              |
| --------- | ---------------------------------------------- |
| loading   | `<LoadingSkeleton>` matching the content shape |
| empty     | `<EmptyState>` with one clear CTA              |
| error     | Inline error with retry option                 |
| forbidden | `<ForbiddenState>` — do not show partial data  |
| success   | Render data; toast on mutation success         |

---

## MVP scope boundary

**In scope:**
Email/password auth · Google OAuth · Student/SME/Admin role routing · Student profile & verification (document + EDU email) · SME profile & subscription · AI Project Brief Assistant · Project CRUD & publish · Applications · Offers · PayOS escrow payment · Sketch/Final/Revision submission · SME review actions · Disbursement & wallet · Manual Admin withdrawal processing · Basic Portfolio Builder · Ratings · In-app notifications (5 core events) · Admin audit log views.

**Out of scope — do not build:**
Dispute UI · Dispute appeal · Automatic bank payout or KYC · Real-time chat · Non-Google social login · AI auto-selection / auto-pricing / auto-publishing / verification approval · Advanced portfolio marketplace or analytics · Mid-project cancel partial-refund UI (Outcome 2).

---

## QA checklist before finishing

- [ ] `npm run build` passes with no errors.
- [ ] `npm run lint` passes (or known pre-existing issues only).
- [ ] Dev server starts; key routes open without console errors.
- [ ] Desktop and mobile checked — no overflow, no truncation.
- [ ] Vietnamese text fits in all buttons, cards, and form labels.
- [ ] All 5 states verified: loading · empty · error · forbidden · success.
- [ ] Role-based redirects work for protected routes.
- [ ] Offer payment button hidden until Student has accepted.
- [ ] Wallet balance never shown as negative.
- [ ] File upload rejects non-jpg/png/pdf extensions with a clear message.
- [ ] Any missing backend endpoint is noted as a gap, not silently skipped.
