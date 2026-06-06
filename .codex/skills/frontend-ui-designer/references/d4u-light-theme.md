---
name: d4u-frontend
description: >
  Design, implement, and improve D4U frontend screens, components, and flows.
  Use when building or refining any React/Vite page or component for D4U: auth,
  dashboards, marketplace, project execution, payment/escrow, wallet, withdrawal,
  portfolio, AI matching, admin screens, or any role-based UI.
  Enforces D4U brand system (Tailwind v3), visual consistency, UX best practices,
  N-Layer API contract patterns, and MVP scope. Always improves aesthetics AND
  usability without breaking logic, routes, state management, or business flows.
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

## 2 — Tailwind config (extend this in `tailwind.config.js`)

Always use the D4U custom tokens below — never hardcode hex values in JSX.

```js
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Core brand
        "d4u-cyan": "#12aeea",
        "d4u-cyan-hover": "#0b9bd3",
        "d4u-teal-deep": "#075d78",
        "d4u-teal-muted": "#0a6f8e",
        // Neutral / structure
        "d4u-charcoal": "#1d2428",
        "d4u-nav-dark": "#071014",
        // Surfaces
        "d4u-bg": "#f6fafd",
        "d4u-surface": "#ffffff",
        "d4u-soft": "#eef6fa",
        // Text hierarchy
        "d4u-text-1": "#1d2428",
        "d4u-text-2": "#667985",
        "d4u-text-3": "#8ea0aa",
        "d4u-border": "#d7e5ec",
        // Semantic
        "d4u-success": "#16a34a",
        "d4u-warning": "#f59e0b",
        "d4u-error": "#dc2626",
        "d4u-info": "#0ea5e9",
      },
      fontFamily: {
        display: ['"General Sans"', "system-ui", "sans-serif"],
        body: ['"DM Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      borderRadius: {
        chip: "9999px",
        btn: "6px",
        drop: "8px",
        card: "12px",
        block: "16px",
      },
      boxShadow: {
        "card-hover": "0 4px 16px rgba(0,0,0,0.10)",
        panel: "0 8px 24px rgba(0,0,0,0.12)",
        modal: "0 16px 48px rgba(0,0,0,0.18)",
        focus: "0 0 0 3px rgba(18,174,234,0.16)",
      },
      maxWidth: {
        content: "1280px",
        form: "640px",
        panel: "340px",
      },
    },
  },
  plugins: [],
};
```

**Color usage rules:**

- `d4u-cyan` / `d4u-teal-*` → primary actions, active states, focus rings, brand accents only.
- `d4u-charcoal` / `d4u-nav-dark` → structure, headings, nav.
- Keep the app **light** — `bg-d4u-bg` on page, `bg-d4u-surface` on cards.
- Never use `purple` / `indigo` as primary action colors.
- No random gradients outside the brand palette.

---

## 3 — Typography classes

```
font-display  →  "General Sans"  (headings, page titles)
font-body     →  "DM Sans"       (body, labels, buttons)
font-mono     →  "JetBrains Mono" (code, metadata)
```

| Role            | Tailwind classes                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| Page title      | `font-display text-[36px] md:text-[40px] font-semibold leading-tight tracking-tight text-d4u-teal-deep` |
| Section heading | `font-display text-2xl md:text-3xl font-semibold leading-snug text-d4u-teal-deep`                       |
| Card title      | `font-body text-lg font-medium leading-snug text-d4u-text-1`                                            |
| Body text       | `font-body text-sm md:text-base font-normal leading-relaxed text-d4u-text-1`                            |
| Secondary label | `font-body text-sm text-d4u-text-2`                                                                     |
| Caption / meta  | `font-body text-xs text-d4u-text-3`                                                                     |

**Rules:**

- No `text-[Xvw]` — use px values or responsive Tailwind steps.
- `leading-relaxed` (1.625) for body, `leading-tight` (1.25) or `leading-snug` (1.375) for headings.
- Minimum contrast: 4.5:1 normal text, 3:1 large text (WCAG AA).

---

## 4 — Spacing, layout, responsive

### Spacing scale (4px base)

Use Tailwind's default spacing — it is already 4px-based (`p-1 = 4px`, `p-2 = 8px`, `p-4 = 16px`, `p-5 = 20px`, `p-6 = 24px`, `p-8 = 32px`, `p-10 = 40px`…).

Do **not** use arbitrary values like `gap-[13px]` or `p-[7px]`.

### Page wrapper pattern

```jsx
<div className="min-h-screen bg-d4u-bg">
  <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* page content */}
  </div>
</div>
```

### Grid layouts

| Context                        | Classes                                                               |
| ------------------------------ | --------------------------------------------------------------------- |
| Marketplace                    | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5` |
| Dashboard widgets              | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5`                |
| Dashboard (sidebar + main)     | `flex gap-0` with `w-60 shrink-0` sidebar + `flex-1 min-w-0` main     |
| Project detail (brief + panel) | `grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6`                     |
| Forms                          | `flex flex-col gap-5 max-w-form`                                      |
| Admin tables                   | `w-full overflow-x-auto`                                              |

---

## 5 — Component classes

### Buttons

| Variant   | Classes                                                                                                                                                                                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary   | `inline-flex items-center gap-2 h-10 px-4 rounded-btn bg-d4u-cyan hover:bg-d4u-cyan-hover text-white font-body text-sm font-medium transition-colors duration-150 focus:outline-none focus:shadow-focus active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed`         |
| Secondary | `inline-flex items-center gap-2 h-10 px-4 rounded-btn border border-d4u-cyan text-d4u-cyan hover:bg-d4u-soft font-body text-sm font-medium transition-colors duration-150 focus:outline-none focus:shadow-focus active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed` |
| Ghost     | `inline-flex items-center gap-2 h-10 px-4 rounded-btn text-d4u-text-2 hover:bg-d4u-soft font-body text-sm font-medium transition-colors duration-150 focus:outline-none focus:shadow-focus`                                                                                         |
| Danger    | `inline-flex items-center gap-2 h-10 px-4 rounded-btn bg-d4u-error hover:bg-red-700 text-white font-body text-sm font-medium transition-colors duration-150 focus:outline-none focus:shadow-focus active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed`               |

Size modifiers: `h-8 px-3 text-xs` (compact) · `h-12 px-6 text-base` (large).

- Minimum touch target 44×44px — add `min-h-[44px] min-w-[44px]` on small icon buttons.
- Loading state: add `<Spinner className="w-4 h-4 animate-spin" />` inside, keep button disabled.

### Inputs & textareas

```jsx
// Input base
<input className="
  w-full h-10 px-3 rounded-btn
  border border-d4u-border
  bg-d4u-surface text-d4u-text-1 text-sm font-body
  placeholder:text-d4u-text-3
  hover:border-d4u-teal-muted
  focus:outline-none focus:border-d4u-cyan focus:shadow-focus
  disabled:bg-d4u-soft disabled:cursor-not-allowed
  transition-colors duration-150
" />

// Error state — add alongside input
<input className="... border-d4u-error focus:border-d4u-error" />
<p className="mt-1 text-xs text-d4u-error">{errorMessage}</p>
```

- Always use visible `<label>` — never placeholder-only.
- Group related fields with `<div className="flex flex-col gap-1.5">` (label + input + helper).
- Helper text: `<p className="text-xs text-d4u-text-3 mt-1">{helperText}</p>`

### Cards

```jsx
// Resting card
<div className="bg-d4u-surface border border-d4u-border rounded-card p-5">

// Interactive card (hover lift)
<div className="bg-d4u-surface border border-d4u-border rounded-card p-5
                transition-all duration-200 ease-out
                hover:-translate-y-0.5 hover:shadow-card-hover
                cursor-pointer">
```

- Do not nest cards inside cards.
- Consistent internal padding: `p-5` (default) · `p-4` (compact).

### Status chips

```jsx
const chipVariants = {
  warning: 'bg-amber-50  text-amber-800',
  success: 'bg-green-50  text-green-800',
  error:   'bg-red-50    text-red-800',
  neutral: 'bg-slate-100 text-slate-600',
  info:    'bg-sky-50    text-sky-800',
}

<span className={`
  inline-flex items-center gap-1.5 px-2.5 py-0.5
  rounded-chip text-xs font-medium whitespace-nowrap
  ${chipVariants[variant]}
`}>
  {label}
</span>
```

| Status values                                                                                          | Variant   |
| ------------------------------------------------------------------------------------------------------ | --------- |
| `PENDING` `UNDER_REVIEW` `WAITING_ACCEPTANCE` `PENDING_PAYMENT` `REVISION_REQUESTED` `RELEASE_PENDING` | `warning` |
| `ACTIVE` `VERIFIED` `OPEN` `ACCEPTED` `FUNDED` `RELEASED` `COMPLETED` `APPROVED` `PUBLIC`              | `success` |
| `REJECTED` `FAILED` `INVALID_REPORTED` `BANNED` `SUSPENDED`                                            | `error`   |
| `DRAFT` `PRIVATE` `CANCELLED` `DELETED` `REFUNDED` `HIDDEN`                                            | `neutral` |
| `PRIVATE_INVITED` `IN_PROGRESS` `SKETCH_REVIEW` `FINAL_REVIEW` `AI_MATCHED`                            | `info`    |

Always show text — never rely on color alone. Do not add `DISPUTED` — out of MVP scope.

### Navigation

**Top nav:**

```jsx
<nav className="h-16 bg-d4u-nav-dark border-b border-white/10 flex items-center px-4 sm:px-6 lg:px-8">
```

Active link: `text-d4u-cyan border-b-2 border-d4u-cyan`
Default link: `text-white/70 hover:text-white transition-colors`

**Sidebar:**

```jsx
<aside className="w-60 shrink-0 bg-d4u-surface border-r border-d4u-border min-h-screen">
```

Active item: `bg-d4u-soft border-l-[3px] border-d4u-cyan text-d4u-teal-deep font-medium`
Default item: `text-d4u-text-2 hover:bg-d4u-soft hover:text-d4u-text-1 transition-colors`

Mobile nav: drawer (slide-in sheet) — never horizontal overflow.

### Tables

```jsx
<div className="w-full overflow-x-auto rounded-card border border-d4u-border">
  <table className="w-full text-sm">
    <thead>
      <tr className="bg-d4u-soft border-b border-d4u-border">
        <th className="px-4 py-2.5 text-left text-xs font-medium text-d4u-text-2 uppercase tracking-wider">
          {header}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-t border-d4u-border hover:bg-d4u-soft transition-colors">
        <td className="px-4 py-3 text-d4u-text-1">{cell}</td>
      </tr>
    </tbody>
  </table>
</div>
```

- Sticky header on tall tables: add `sticky top-0 z-10` to `<thead>`.
- Paginate or "load more" when rows > 25.
- Empty table: centered `<EmptyState>` inside the table frame.

### Loading skeletons

```jsx
// Skeleton base — match the shape of real content
<div className="animate-pulse bg-d4u-soft rounded h-4 w-3/4" />
<div className="animate-pulse bg-d4u-soft rounded h-4 w-1/2 mt-2" />

// Skeleton card
<div className="bg-d4u-surface border border-d4u-border rounded-card p-5 animate-pulse">
  <div className="h-5 bg-d4u-soft rounded w-2/3 mb-3" />
  <div className="h-4 bg-d4u-soft rounded w-full mb-2" />
  <div className="h-4 bg-d4u-soft rounded w-4/5" />
</div>
```

---

## 6 — Page state checklist

Every page and data-fetching component must handle **all 5 states**:

| State       | Implementation                                                   |
| ----------- | ---------------------------------------------------------------- |
| `loading`   | `<LoadingSkeleton>` matching content shape — not a spinner alone |
| `empty`     | `<EmptyState>` with icon, short message, and one clear CTA       |
| `error`     | Inline error message + retry button                              |
| `forbidden` | `<ForbiddenState>` — never show partial data                     |
| `success`   | Render data; toast on successful mutations (auto-dismiss 4s)     |

---

## 7 — Page-level design patterns

### Auth pages

```jsx
// Centered card layout
<div className="min-h-screen bg-d4u-bg flex items-center justify-center px-4">
  <div className="w-full max-w-[440px] bg-d4u-surface rounded-card border border-d4u-border p-8 shadow-panel">
```

- D4U logo at top of card.
- Google OAuth button with Google icon, full-width, secondary variant.
- Role selector: two visual cards (Student / SME), not a plain `<select>`.
- Email verification: progress step indicator + resend/confirm flow.

### Dashboards

Structure: `PageHeader` (title + primary CTA) → stat cards row → content sections.

```jsx
// Stat card
<div className="bg-d4u-surface border border-d4u-border rounded-card p-5">
  <p className="text-xs font-medium text-d4u-text-2 uppercase tracking-wider">
    {label}
  </p>
  <p className="mt-2 text-3xl font-semibold text-d4u-teal-deep font-display">
    {value}
  </p>
  <p className="mt-1 text-xs text-d4u-text-3">{delta}</p>
</div>
```

Section order by urgency:

- **Student:** verification status → recommended projects → pending offers → active projects → wallet.
- **SME:** package limits → draft/open projects → pending payments → AI Brief entry.
- **Admin:** pending counts (verifications, withdrawals, portfolio) → recent audit events.

### Marketplace

```jsx
// Toolbar
<div className="flex flex-col sm:flex-row gap-3 mb-6">
  <input className="flex-1 h-10 ..." placeholder="Tìm kiếm project..." />
  <FilterBar />  {/* desktop */}
  <MobileFilterDrawer />  {/* mobile */}
</div>

// Grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
  {projects.map(p => <ProjectCard key={p.id} project={p} />)}
</div>
```

`ProjectCard` must show: title · company · category · budget · deadline · `<StatusChip>` · brief preview (2-line clamp) · confidentiality/portfolio badges.

### Project detail

```jsx
<div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
  <main>{/* brief, description, deliverables */}</main>
  <aside className="lg:sticky lg:top-24 self-start">
    {/* budget, deadlines, SME info, usage, revision limit, badges */}
    {/* Student CTA: Apply | SME owner: Edit / Publish / Cancel */}
  </aside>
</div>
```

### AI Brief Assistant

```jsx
<div className="bg-d4u-soft border border-d4u-border rounded-card p-4 mb-6 flex gap-3">
  <InfoIcon className="text-d4u-cyan mt-0.5 shrink-0" />
  <p className="text-sm text-d4u-text-2">
    Gợi ý của AI có thể chỉnh sửa và không bao giờ được đăng tự động.
  </p>
</div>
```

Frame as a form with editable suggestion fields — not a chat interface.

### Payment & escrow

```jsx
<p className="text-sm text-d4u-text-2 bg-d4u-soft rounded-card p-4 border border-d4u-border">
  Project chỉ bắt đầu sau khi escrow được xác nhận bởi đơn vị thanh toán.
</p>
```

- Offer state machine: `PENDING_ACCEPTANCE` → accept/reject → `ACCEPTED` → SME pays → `PENDING_PAYMENT` → webhook → `ACTIVE`.
- **Hide SME payment button** until Student has accepted the offer (`status !== 'ACCEPTED'`).
- Never trust client-side success flag — wait for backend-confirmed status.

### Wallet & withdrawal (Student)

```jsx
<p className="text-xs text-d4u-text-2 bg-amber-50 border border-amber-200 rounded-card px-4 py-3">
  D4U Wallet là sổ cái nội bộ, không phải tài khoản ngân hàng.
</p>
```

- Show: available balance · pending · locked · currency · status · transaction history · withdrawal requests.
- Withdrawal form: amount (min 50,000 VND) · bank selector · fee preview (5,000 VND) · net amount.
- Wallet balance must never display as negative.

### Admin withdrawal screen

Table columns: request ID · student name · amount · bank · created at · status chip · actions.

- **Mark Success** → `<ConfirmDialog>` with amount, debit warning, optional note.
- **Mark Failed** → modal with mandatory reason field.

### Submission & review

Student submits: Sketch · Final · Revision — description + file metadata.
SME actions (separate buttons): **Approve** · **Request Revision** · **Report Invalid File**.
Do not add Open Dispute — out of MVP.

### Portfolio Builder

- Attach D4U output only when `isConfidential === false && allowStudentPortfolio === true`.
- SME: read-only view during application/offer review.
- Admin: **Hide** button on public items.

### Rating page

- Render only after project `COMPLETED`.
- Countdown if < 48h to deadline: `text-d4u-error`.
- Star selector: visual `★` icons (1–5) + `<textarea maxLength={500}>` + live char counter.
- Hide form once rating submitted.

---

## 8 — UI improvement checklist (refactoring/beautifying)

### Spacing & rhythm

- [ ] All gaps use Tailwind spacing scale (multiples of 4px). No arbitrary `gap-[13px]`.
- [ ] Card internal padding: `p-5` default, `p-4` compact.
- [ ] Section-to-section: `mb-8` to `mb-12`.
- [ ] No orphaned elements with inconsistent margins.

### Typography

- [ ] Page titles use `font-display font-semibold` in `text-d4u-teal-deep`.
- [ ] Body uses `font-body text-sm leading-relaxed text-d4u-text-1`.
- [ ] Clear visual hierarchy: heading → subheading → body → caption.
- [ ] No text smaller than `text-xs` (12px) except chart axis labels.

### Color & contrast

- [ ] All text meets WCAG AA (use `text-d4u-text-1` or `text-d4u-charcoal` for primary content).
- [ ] Only `bg-d4u-cyan` / `hover:bg-d4u-cyan-hover` for primary actions.
- [ ] No raw hex values in JSX — always Tailwind token classes.
- [ ] Hover and focus states visually distinct from default.

### Layout & structure

- [ ] Clear visual hierarchy: header → content → actions.
- [ ] Primary CTA above the fold on desktop.
- [ ] Related elements grouped (proximity) — use `gap` inside a flex/grid wrapper, not scattered `mt-`.
- [ ] No overflow or truncated text at 375px (mobile).
- [ ] Vietnamese text fits in buttons, badges, and form labels — test with longest strings.

### Components

- [ ] Consistent `rounded-btn` buttons, `rounded-card` cards, `rounded-chip` chips everywhere.
- [ ] Status chips use correct variant.
- [ ] Form fields have visible `<label>` — no placeholder-only inputs.
- [ ] Destructive actions wrapped in `<ConfirmDialog>`.
- [ ] Empty states have icon + message + CTA.
- [ ] Loading skeletons match content shape.

### Interactions

- [ ] All interactive elements have `hover:` states.
- [ ] All focusable elements have `focus:shadow-focus focus:outline-none`.
- [ ] Touch targets `min-h-[44px] min-w-[44px]`.
- [ ] Transitions: `transition-colors duration-150` or `transition-all duration-200`.
- [ ] Toasts on successful mutations, auto-dismiss 4s.

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
- `401` → refresh token → retry once → on failure: clear session, redirect `/login`.
- `403` → render `<ForbiddenState>` — never show partial data.
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
- [ ] Desktop (1280px+) and mobile (375px) — no overflow, no truncation.
- [ ] Vietnamese text fits in all buttons, cards, badges, and form labels.
- [ ] All 5 states verified: loading · empty · error · forbidden · success.
- [ ] Role-based redirects work for all protected routes.
- [ ] SME payment button hidden until Student has accepted the offer.
- [ ] Wallet balance never shown as negative.
- [ ] File upload rejects non-jpg/png/pdf with a clear message.
- [ ] No raw hex values in JSX — only Tailwind token classes from config.
- [ ] Any missing backend endpoint is noted as a gap comment, not silently skipped.
- [ ] Touch targets `min-h-[44px]` on all interactive elements.
- [ ] Focus rings `focus:shadow-focus focus:outline-none` on all focusable elements.
