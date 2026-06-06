---
name: d4u-frontend
description: >
  Design, implement, and improve D4U frontend screens, components, and flows.
  Use when building or refining any React/Vite page or component for D4U: auth,
  dashboards, marketplace, project execution, payment/escrow, wallet, withdrawal,
  portfolio, AI matching, admin screens, or any role-based UI.
  Enforces D4U brand system, visual consistency, UX best practices, N-Layer API
  contract patterns, and MVP scope. Always improves aesthetics AND usability
  without breaking logic, routes, state management, or business flows.
---

# D4U Frontend Skill

## 0 — Before writing any code

1. Read existing routes, contexts, and API clients — never re-invent what exists.
2. Confirm the backend endpoint and DTO shape before mapping UI states.
3. List every state the page must handle: `loading · empty · error · forbidden · success`.
4. Do not invent API endpoints. If one is missing, note the gap and adapt the UX gracefully.
5. Never break business logic, route guards, auth flows, or state management while improving UI.

---

## 1 — Design philosophy for D4U

D4U is a SaaS/product platform for real users (SMEs, students, admins). The interface must feel:

| Quality         | What it means in practice                                                          |
| --------------- | ---------------------------------------------------------------------------------- |
| **Modern**      | Clean geometry, purposeful whitespace, crisp typography — not dated or cluttered   |
| **Trustworthy** | Consistent brand colors, clear hierarchy, no visual noise that confuses            |
| **Readable**    | Adequate contrast, generous line-height, information structured top-down           |
| **Operable**    | Touch targets ≥ 44px, keyboard-accessible, CTAs always visible and obvious         |
| **SaaS-grade**  | Data-dense when needed, scannable tables, well-structured dashboards               |
| **Demo-ready**  | Polished enough for real users on first visit — no rough edges or placeholder text |

**Avoid:** purple gradients, decorative blobs, generic "AI slop" patterns, full-dark backgrounds, illegible icon-only buttons, inconsistent spacing.

---

## 2 — Brand & design tokens

Use **only** these CSS variables. Never hardcode hex colors in component styles.

```css
/* ── Core brand ─────────────────────────────── */
--d4u-cyan: #12aeea; /* primary action, links, active nav, focus rings */
--d4u-cyan-hover: #0b9bd3;
--d4u-teal-deep: #075d78; /* headings, nav accents, structural elements */
--d4u-teal-muted: #0a6f8e;

/* ── Neutral / structure ────────────────────── */
--d4u-charcoal: #1d2428; /* body text */
--d4u-nav-dark: #071014; /* top nav background */

/* ── Surface ────────────────────────────────── */
--d4u-bg: #f6fafd; /* page background */
--d4u-surface: #ffffff; /* card, panel, modal surfaces */
--d4u-soft: #eef6fa; /* subtle highlight rows, hover states */

/* ── Text hierarchy ─────────────────────────── */
--d4u-text-1: #1d2428; /* primary text */
--d4u-text-2: #667985; /* secondary / labels */
--d4u-text-3: #8ea0aa; /* captions, placeholders */
--d4u-border: #d7e5ec; /* borders, dividers */

/* ── Semantic ───────────────────────────────── */
--d4u-success: #16a34a;
--d4u-warning: #f59e0b;
--d4u-error: #dc2626;
--d4u-info: #0ea5e9;

/* ── Derived / aliases (compute at :root) ───── */
--d4u-cyan-10: rgba(18, 174, 234, 0.1);
--d4u-cyan-16: rgba(18, 174, 234, 0.16);
--d4u-teal-10: rgba(7, 93, 120, 0.1);
```

**Color usage rules:**

- Cyan/teal → primary actions, active states, focus rings, brand accents only.
- Charcoal/dark teal → structure, headings, nav, serious UI chrome.
- Keep the app **light** — `--d4u-bg` as page background, `--d4u-surface` for cards.
- Never use purple/indigo as a primary action color.
- No random gradients unrelated to the brand palette.

---

## 3 — Typography

```
Display / headings : "General Sans", system-ui, sans-serif
Body / UI labels   : "DM Sans", system-ui, sans-serif
Code / metadata    : "JetBrains Mono", monospace
```

| Role            | Desktop | Mobile  | Weight |
| --------------- | ------- | ------- | ------ |
| Page title      | 32–40px | 26–32px | 600    |
| Section heading | 22–28px | 18–22px | 600    |
| Card title      | 16–20px | 15–18px | 500    |
| Body text       | 14–16px | 14–15px | 400    |
| Caption / meta  | 12–13px | 12px    | 400    |

**Rules:**

- No `vw` units on typography — use `px` or `clamp()`.
- Line-height: 1.6 for body, 1.3 for headings, 1.4 for UI labels.
- Letter-spacing: -0.01em to -0.02em for headings, 0 for body.
- Minimum contrast: 4.5:1 for normal text, 3:1 for large text (WCAG AA).

---

## 4 — Spacing, layout, radius, elevation

### Spacing

```
Base unit: 4px
Scale:  4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96px
```

Use the scale consistently. Do not invent arbitrary gaps (e.g., `gap: 13px`).

### Layout

```
Max content width : 1280px
Page padding      : 16px (mobile) · 24px (tablet) · 32px (desktop)
Sidebar width     : 240–260px (desktop)
Right summary panel: 300–340px
```

| Context           | Columns                                                       |
| ----------------- | ------------------------------------------------------------- |
| Marketplace grid  | 1 (mobile) · 2 (tablet) · 3 (desktop) · 4 (large if readable) |
| Dashboard widgets | 1 (mobile) · 2 (tablet) · 2–3 (desktop)                       |
| Forms             | Single column, max-width 640px                                |
| Admin tables      | Full width, horizontal scroll on mobile                       |

### Border radius

```
Chip / tag / badge  : 9999px
Button / input      : 6px
Dropdown / tooltip  : 8px
Card / panel / modal: 12px
Page section block  : 16px
```

### Elevation (shadow system)

```css
/* Resting card — border first */
box-shadow: none;
border: 1px solid var(--d4u-border);

/* Hover card */
transform: translateY(-2px);
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
transition:
  transform 180ms ease,
  box-shadow 180ms ease;

/* Raised panel (dropdown, popover) */
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

/* Focus ring */
outline: none;
box-shadow: 0 0 0 3px var(--d4u-cyan-16);

/* Modal overlay */
box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
```

---

## 5 — Component standards

### Buttons

| Variant   | Use case               | Style                                                  |
| --------- | ---------------------- | ------------------------------------------------------ |
| Primary   | Main CTA               | bg `--d4u-cyan`, white text, hover `--d4u-cyan-hover`  |
| Secondary | Supporting action      | border `--d4u-cyan`, `--d4u-cyan` text, transparent bg |
| Ghost     | Tertiary / nav actions | no border, `--d4u-text-2` text                         |
| Danger    | Destructive            | bg `--d4u-error`, white text                           |

```css
/* Base button */
height: 40px; /* default; compact = 32px; large = 48px */
padding: 0 16px;
border-radius: 6px;
font-size: 14px;
font-weight: 500;
font-family: "DM Sans", system-ui;
cursor: pointer;
transition:
  background 150ms ease,
  box-shadow 150ms ease,
  transform 80ms ease;

/* Active press */
&:active {
  transform: scale(0.98);
}
```

- Minimum touch target: 44×44px (use padding to expand if needed).
- Always show a visible focus ring.
- Disabled state: 50% opacity, `cursor: not-allowed`.
- Loading state: spinner inside button, button disabled, label unchanged.

### Inputs & forms

```css
/* Input base */
height: 40px;
padding: 0 12px;
border: 1px solid var(--d4u-border);
border-radius: 6px;
font-size: 14px;
color: var(--d4u-text-1);
background: var(--d4u-surface);
transition:
  border-color 150ms ease,
  box-shadow 150ms ease;

&:hover {
  border-color: var(--d4u-teal-muted);
}
&:focus {
  border-color: var(--d4u-cyan);
  box-shadow: 0 0 0 3px var(--d4u-cyan-16);
}
&.error {
  border-color: var(--d4u-error);
}
```

- Always use visible `<label>` — never placeholder-only.
- Group related fields in named `<fieldset>` or named section blocks.
- Show helper text below inputs for budget, dates, file types, revision limits.
- Error messages appear immediately below the relevant field, in `--d4u-error` color.
- Use `ConfirmDialog` for all destructive actions.

Allowed upload extensions in MVP: `jpg · png · pdf`. Reject others with a clear message.

### Cards

```css
/* Base card */
background: var(--d4u-surface);
border: 1px solid var(--d4u-border);
border-radius: 12px;
padding: 20px;
transition:
  transform 180ms ease,
  box-shadow 180ms ease;

/* Hover (interactive cards only) */
&:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}
```

- Do not nest cards inside cards.
- Cards must have a clear primary piece of information (title, number, status).
- Use consistent internal padding — 20px default, 16px for compact variants.

### Status chips

Always show **text labels** — never rely on color alone.

| Status values                                                                                          | Variant | Colors                       |
| ------------------------------------------------------------------------------------------------------ | ------- | ---------------------------- |
| `PENDING` `UNDER_REVIEW` `WAITING_ACCEPTANCE` `PENDING_PAYMENT` `REVISION_REQUESTED` `RELEASE_PENDING` | warning | bg `#fef3c7`, text `#92400e` |
| `ACTIVE` `VERIFIED` `OPEN` `ACCEPTED` `FUNDED` `RELEASED` `COMPLETED` `APPROVED` `PUBLIC`              | success | bg `#dcfce7`, text `#14532d` |
| `REJECTED` `FAILED` `INVALID_REPORTED` `BANNED` `SUSPENDED`                                            | error   | bg `#fee2e2`, text `#991b1b` |
| `DRAFT` `PRIVATE` `CANCELLED` `DELETED` `REFUNDED` `HIDDEN`                                            | neutral | bg `#f1f5f9`, text `#475569` |
| `PRIVATE_INVITED` `IN_PROGRESS` `SKETCH_REVIEW` `FINAL_REVIEW` `AI_MATCHED`                            | info    | bg `#e0f2fe`, text `#0c4a6e` |

```css
/* Chip base */
display: inline-flex;
align-items: center;
gap: 6px;
padding: 3px 10px;
border-radius: 9999px;
font-size: 12px;
font-weight: 500;
white-space: nowrap;
```

Do not add `DISPUTED` chip — out of MVP scope.

### Navigation

**Top nav** (`--d4u-nav-dark` background):

- D4U logo left; role-based links center/right; user avatar menu far right.
- Active link: `--d4u-cyan` underline or highlight.
- Height: 64px desktop, 56px mobile.

**Sidebar** (dashboard layouts):

- Background: `--d4u-surface`, border-right `--d4u-border`.
- Width: 240–260px, collapsible to icon-only on medium viewports.
- Active item: `--d4u-soft` background, `--d4u-cyan` left border accent (3px), `--d4u-teal-deep` text.

**Mobile nav:** drawer (slide-in), never horizontal overflow.

### Tables (Admin & data views)

```css
/* Table wrapper */
overflow-x: auto;
border: 1px solid var(--d4u-border);
border-radius: 12px;

/* th */
background: var(--d4u-soft);
color: var(--d4u-text-2);
font-size: 12px;
font-weight: 500;
text-transform: uppercase;
letter-spacing: 0.05em;
padding: 10px 16px;

/* td */
padding: 12px 16px;
color: var(--d4u-text-1);
border-top: 1px solid var(--d4u-border);
font-size: 14px;

/* Row hover */
tr:hover td {
  background: var(--d4u-soft);
}
```

- Sticky header on tall tables.
- Show pagination or "load more" when rows > 25.
- Empty table state: centered `<EmptyState>` inside the table frame.

---

## 6 — Page state checklist

Every page and data-fetching component must handle **all 5 states**:

| State       | Implementation                                                           |
| ----------- | ------------------------------------------------------------------------ |
| `loading`   | `<LoadingSkeleton>` that matches the content shape (not a spinner alone) |
| `empty`     | `<EmptyState>` with an icon, short message, and one clear CTA            |
| `error`     | Inline error message with a retry button                                 |
| `forbidden` | `<ForbiddenState>` — never show partial data                             |
| `success`   | Render data; show a toast on successful mutations                        |

---

## 7 — Page-level design patterns

### Auth pages

- Light, centered layout (max-width 440px) or left-text / right-form split.
- D4U logo visible at top.
- Google OAuth button when configured.
- Clear role selector: Student vs SME (visual cards, not just a dropdown).
- Email verification state: progress indicator + resend/confirm flow.

### Dashboards (Student / SME / Admin)

**Structure:** `PageHeader` (title + primary CTA) → summary stat cards → main content sections.

- Stat cards: large number, label, optional delta indicator.
- Sections ordered by urgency: action-required items first.
- Student: verification status → recommended projects → pending offers → active projects → wallet.
- SME: package limits → draft/open projects → pending payments → AI Brief entry.
- Admin: pending counts (verifications, withdrawals, portfolio moderation) → recent audit events.

### Marketplace

- Search bar + filter toolbar at top (sticky on scroll).
- `ProjectCard` grid below.
- Project card must show: title · company · category · budget · deadline · status chip · brief preview · confidentiality/portfolio badges.
- Empty state: friendly message + "Create Project" CTA for SME, "Adjust filters" for Student.

### Project detail

Desktop: 2-column layout — brief (main, ~65%) + summary panel (right, ~35%).
Summary panel: budget · deadlines · SME/company · category · usage purpose · revision limit · confidentiality · portfolio permission.
Student CTA: **Apply**. SME owner CTAs: **Edit / Publish / Cancel**.

### AI Brief Assistant

- Frame AI as a helper tool, not a chat interface.
- Show clearly-labeled editable fields: title · brief · usage purpose · deliverables · category hint · deadline notes.
- Persistent notice: _"AI suggestions are editable and are never published automatically."_

### AI Matching (entitlement-gated)

- Show entitlement requirement before allowing access (do not render the UI silently).
- Results: match score percentage · reasons list · missing-data warnings.
- Never imply AI can auto-apply, auto-select, auto-price, or auto-publish.

### Payment & escrow

- Display: amount · platform fee · provider name · QR or payment link · escrow explanation.
- Notice: _"Project starts only after escrow is confirmed by the payment provider."_
- Offer state machine strictly enforced in UI: `PENDING_ACCEPTANCE` → accept/reject → `ACCEPTED` → SME pays → `PENDING_PAYMENT` → webhook → `ACTIVE`.
- Hide SME payment button until Student has accepted the offer.
- Never show "sandbox" label in production. Never trust client-side success flag.

### Wallet & withdrawal (Student)

- Clear notice: _"D4U Wallet là sổ cái nội bộ, không phải tài khoản ngân hàng."_
- Show: available balance · pending · locked · currency · wallet status · transaction history · withdrawal requests.
- Withdrawal form: amount (min 50,000 VND) · bank account selector · fee preview (5,000 VND fixed) · net amount.
- Notice: _"Admin/Finance sẽ xử lý chuyển khoản thủ công. Bạn sẽ được thông báo khi hoàn tất."_
- Wallet balance must never display as negative.

### Admin withdrawal screen

Table: request ID · student name · amount · bank · created at · status chip · actions.

- **Mark Success**: confirmation modal (confirm amount, debit warning, optional note).
- **Mark Failed**: modal with mandatory reason field; note that wallet is not debited and student can retry.

### Submission & review

Student submits: Sketch · Final · Revision with description + file metadata.
SME review actions (separate buttons): **Approve** · **Request Revision** · **Report Invalid File**.
Do not add Open Dispute — out of MVP.

### Portfolio Builder

- Student: create/edit items (title · description · category · role · tools · skills · link · visibility · featured flag · file metadata).
- Attach D4U project output only when `isConfidential = false` AND `allowStudentPortfolio = true`.
- SME: read-only view during application/offer review.
- Admin: **Hide** button on any public item.

### Rating page

- Render only after project `COMPLETED`.
- Show rating deadline (7 days after completion, countdown if < 48h left).
- 1–5 star selector with visual stars + comment textarea (max 500 chars, counter shown).
- Hide the form once the rating has been submitted for this project.

---

## 8 — UI improvement checklist (use when refactoring/beautifying)

When improving an existing screen, run through these in order:

### Spacing & rhythm

- [ ] All gaps use the 4px scale (4, 8, 12, 16, 20, 24, 32, 40...).
- [ ] Consistent internal card padding (20px default).
- [ ] Section-to-section spacing: 32–48px.
- [ ] No orphaned elements with mismatched margins.

### Typography

- [ ] Page title uses `General Sans`, 32–40px, weight 600.
- [ ] Body uses `DM Sans`, 14–16px, weight 400, line-height 1.6.
- [ ] Text hierarchy is clear: heading → subheading → body → caption, in that order.
- [ ] No text smaller than 12px anywhere except chart axis labels.

### Color & contrast

- [ ] All text meets WCAG AA contrast (4.5:1 normal, 3:1 large).
- [ ] Primary actions use `--d4u-cyan` only.
- [ ] No random color values outside the token palette.
- [ ] Hover and focus states are visually distinct from default.

### Layout & structure

- [ ] Page has a clear visual hierarchy: header → content → actions.
- [ ] CTAs are prominent and above the fold on desktop.
- [ ] Related elements are visually grouped (proximity principle).
- [ ] Responsive: no overflow, no truncated text on mobile (375px viewport).
- [ ] Vietnamese text fits in all buttons, badges, and form labels.

### Components

- [ ] Consistent border-radius across all cards, buttons, inputs.
- [ ] Status chips use the correct variant colors.
- [ ] Form fields have visible labels (not placeholder-only).
- [ ] Destructive actions use `ConfirmDialog`.
- [ ] Empty states have an icon, message, and at least one CTA.
- [ ] Loading skeletons match the content shape they replace.

### Interactions

- [ ] All interactive elements have hover states.
- [ ] All focusable elements have a visible focus ring (`--d4u-cyan-16` glow).
- [ ] Touch targets ≥ 44px.
- [ ] Transitions: 150–200ms ease (never janky or missing).
- [ ] Toasts appear on successful mutations and auto-dismiss after 4s.

---

## 9 — Role navigation

| Role    | Nav items                                                                                                                 |
| ------- | ------------------------------------------------------------------------------------------------------------------------- |
| Guest   | Browse Projects · Pricing · Login · Register                                                                              |
| Student | Dashboard · Browse Projects · Applications · Offers · My Projects · Portfolio · Wallet · Profile · Verification · Ratings |
| SME     | Dashboard · My Projects · Applications · Offers · AI Brief · AI Matching · Billing/Packages · Profile · Ratings           |
| Admin   | Dashboard · Verifications · Portfolio Moderation · Withdrawals · Users · Audit Logs                                       |

---

## 10 — Route map

```
Public
  /                           Home
  /login                      Login
  /register                   Register
  /verify-email               Email verification
  /projects                   Marketplace
  /pricing                    Packages
  /projects/:id               Project detail

Student  (/student)
  /dashboard · /profile · /verification · /projects · /applications
  /offers · /my-projects · /portfolio · /wallet · /ratings

SME  (/sme)
  /dashboard · /profile · /projects · /projects/new · /projects/:id/edit
  /projects/:id/applications · /offers · /ai-brief · /ai-matching
  /billing · /ratings

Shared
  /projects/:id/execution     Milestone dashboard
  /projects/:id/submissions   Submission history
  /projects/:id/rating        Rate counterpart

Admin  (/admin)
  /dashboard · /verifications · /verifications/:id
  /portfolio · /withdrawals · /users · /audit-logs
```

---

## 11 — API integration rules

```js
baseURL: "/api/v1"; // never hardcode host in page components
```

- Inject access token in every authenticated request.
- `401` → attempt refresh token → retry once → on failure: clear session, redirect `/login`.
- `403` → render `<ForbiddenState>` — do not show partial data.
- `404` → render `<NotFoundState>` or treat as "not yet created" (empty wallet, no portfolio).
- Map field-level errors from backend `errors[]` to form fields.

---

## 12 — Component library (use existing first, create if missing)

```
AppShell              RoleBasedNav          PageHeader
SectionHeader         StatusChip            EmptyState
LoadingSkeleton       ConfirmDialog         DataTable
FilterBar             MobileFilterDrawer    ProjectCard
StudentCard           ApplicationCard       OfferCard
VerificationCard      WalletSummaryCard     PortfolioItemCard
DashboardStatCard     ProjectTimeline       PaymentSummary
EscrowStatusPanel     FileMetadataUploader
```

---

## 13 — MVP scope boundary

**In scope:**
Email/password auth · Google OAuth · Student/SME/Admin role routing · Student profile & verification · SME profile & subscription · AI Project Brief Assistant · Project CRUD & publish · Applications · Offers · PayOS escrow payment · Sketch/Final/Revision submission · SME review actions · Disbursement & wallet · Manual Admin withdrawal processing · Basic Portfolio Builder · Ratings · In-app notifications (5 core events) · Admin audit log views.

**Out of scope — do not build:**
Dispute UI · Dispute appeal · Automatic bank payout or KYC · Real-time chat · Non-Google social login · AI auto-selection / auto-pricing / auto-publishing / verification approval · Advanced portfolio marketplace or analytics · Mid-project cancel partial-refund UI.

---

## 14 — QA checklist before finishing

- [ ] `npm run build` passes with no errors.
- [ ] `npm run lint` passes (or only known pre-existing issues).
- [ ] Dev server starts; key routes open without console errors.
- [ ] Desktop (1280px+) and mobile (375px) checked — no overflow, no truncation.
- [ ] Vietnamese text fits in all buttons, cards, badges, and form labels.
- [ ] All 5 states verified: loading · empty · error · forbidden · success.
- [ ] Role-based redirects work for all protected routes.
- [ ] SME payment button hidden until Student has accepted the offer.
- [ ] Wallet balance never shown as negative.
- [ ] File upload rejects non-jpg/png/pdf with a clear message.
- [ ] No hardcoded hex colors — only CSS variables used.
- [ ] Any missing backend endpoint is noted as a gap comment, not silently skipped.
- [ ] Touch targets ≥ 44px on all interactive elements.
- [ ] Focus rings visible on all focusable elements.
