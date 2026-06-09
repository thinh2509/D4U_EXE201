---

name: d4u-frontend
description: >
Build, redesign, and polish D4U frontend screens using React/Vite and TailwindCSS-first UI.
Use this skill for any D4U UI work: auth, dashboards, marketplace, project detail,
create project, workspace, submission review, escrow/payment, wallet, withdrawal,
verification, portfolio, ratings, admin screens, and role-based flows.
This skill enforces modern SaaS UI, bright D4U branding, clean layout hierarchy,
TailwindCSS utility-first implementation, responsive design, accessibility,
API-safe refactoring, and demo-ready polish.
---

---

# D4U Frontend TailwindCSS Skill

## 0 — Non-negotiable rules

D4U frontend must be **TailwindCSS-first**.

### Must do

- Use Tailwind utility classes directly in JSX/TSX.
- Use D4U Tailwind tokens from `tailwind.config.js`.
- Use reusable React components when UI repeats.
- Use `clsx`, `classnames`, or a simple `cn()` helper for variants if the project already has one.
- Keep existing logic, API calls, routes, guards, DTO mapping, auth flow, and state management unchanged unless the user explicitly asks.
- Improve both aesthetics and usability.
- Every screen must feel modern, bright, trustworthy, and demo-ready.

### Must not do

- Do not create large custom CSS files for page layout.
- Do not use CSS modules for normal cards, buttons, forms, grids, badges, tables, or page shells.
- Do not write page-specific CSS classes such as `.project-card`, `.hero-section`, `.action-panel`, `.workspace-card`.
- Do not use raw hex colors inside JSX/TSX.
- Do not use inline style except for unavoidable dynamic runtime values.
- Do not use another UI library such as Material UI, Ant Design, Chakra, Bootstrap, DaisyUI, Flowbite, or shadcn unless the project already uses it and the user explicitly asks.
- Do not generate plain white cards stacked vertically with no hierarchy.
- Do not make the UI look like a default admin template.
- Do not only change colors, border-radius, and shadows. Fix layout and hierarchy first.

---

## 1 — Design identity for D4U

D4U is a bright SaaS marketplace platform connecting SMEs and Students.

The interface must feel:

| Quality     | Meaning                                                                  |
| ----------- | ------------------------------------------------------------------------ |
| Modern      | Clean geometry, good spacing, crisp typography, smooth responsive layout |
| Fresh       | Light backgrounds, bright cyan/teal accents, friendly but professional   |
| Trustworthy | Clear status, predictable actions, no messy layout                       |
| Readable    | Strong hierarchy, good contrast, Vietnamese text fits well               |
| Operable    | Clear CTAs, accessible focus states, touch targets at least 44px         |
| SaaS-grade  | Data-dense screens are scannable, not cluttered                          |
| Demo-ready  | No placeholder/debug text, no rough UI, no broken wrapping               |

### Avoid

- Purple/indigo gradients as primary style
- Dark full-page backgrounds
- Random decorative blobs
- Too many nested cards
- Black borders
- Heavy shadows everywhere
- Debug labels like `Flow hiện tại`
- Tables for small metadata groups
- Uppercase text everywhere
- Oversized titles with tiny metadata
- Equal visual weight for all buttons

---

## 2 — Tailwind config

Use or extend this in `tailwind.config.js`.

```js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "d4u-cyan": "#12aeea",
        "d4u-cyan-hover": "#0b9bd3",
        "d4u-teal-deep": "#075d78",
        "d4u-teal-muted": "#0a6f8e",

        "d4u-charcoal": "#1d2428",
        "d4u-nav-dark": "#071014",

        "d4u-bg": "#f6fafd",
        "d4u-surface": "#ffffff",
        "d4u-soft": "#eef6fa",
        "d4u-soft-2": "#e8f5fb",

        "d4u-text-1": "#1d2428",
        "d4u-text-2": "#667985",
        "d4u-text-3": "#8ea0aa",
        "d4u-border": "#d7e5ec",

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
        btn: "10px",
        card: "16px",
        block: "20px",
        panel: "24px",
      },
      boxShadow: {
        soft: "0 8px 24px rgba(7, 93, 120, 0.08)",
        card: "0 12px 32px rgba(7, 93, 120, 0.10)",
        panel: "0 18px 48px rgba(7, 93, 120, 0.12)",
        focus: "0 0 0 3px rgba(18,174,234,0.18)",
      },
      maxWidth: {
        content: "1280px",
        form: "680px",
        panel: "360px",
      },
    },
  },
  plugins: [],
};
```

### Color rules

- Primary actions: `bg-d4u-cyan hover:bg-d4u-cyan-hover`.
- Headings: `text-d4u-teal-deep` or `text-d4u-text-1`.
- Page background: `bg-d4u-bg`.
- Cards: `bg-d4u-surface`.
- Borders: `border-d4u-border`.
- Do not use raw hex colors in JSX/TSX.
- Do not use random Tailwind colors as primary colors unless semantic, such as red for danger or amber for warning.

---

## 3 — Strict CSS policy

### Allowed CSS only for

- Tailwind imports
- Font-face declarations
- Global reset if already required
- Third-party library overrides
- Complex keyframes that Tailwind cannot express

### Not allowed CSS for

- Page layout
- Cards
- Buttons
- Forms
- Tables
- Badges
- Sidebar
- Header
- Dashboard widgets
- Project detail
- Workspace
- Admin verification
- Admin withdrawal

Bad:

```css
.project-header {
  padding: 32px;
  border-radius: 24px;
  background: #fff;
}

.action-button {
  height: 44px;
  border-radius: 8px;
}
```

Good:

```tsx
<section className="rounded-panel border border-d4u-border bg-d4u-surface p-6 shadow-soft">
  <button className="inline-flex min-h-[44px] items-center justify-center rounded-btn bg-d4u-cyan px-4 text-sm font-semibold text-white transition-colors hover:bg-d4u-cyan-hover focus:outline-none focus:shadow-focus">
    Publish
  </button>
</section>
```

### Refactor rule

When improving an existing screen:

1. Inspect current JSX/TSX and CSS.
2. Move page-specific CSS into Tailwind classes.
3. Delete unused CSS.
4. Keep only global CSS that is truly global.
5. Do not create new CSS files for the screen.
6. If custom CSS is unavoidable, add a short comment explaining why.

---

## 4 — Typography system

### Page title

```tsx
className =
  "font-display text-3xl font-semibold leading-tight tracking-tight text-d4u-teal-deep sm:text-4xl";
```

### Section heading

```tsx
className =
  "font-display text-xl font-semibold leading-snug text-d4u-text-1 sm:text-2xl";
```

### Card title

```tsx
className = "font-body text-base font-semibold leading-snug text-d4u-text-1";
```

### Body text

```tsx
className = "font-body text-sm leading-6 text-d4u-text-1";
```

### Muted text

```tsx
className = "font-body text-sm leading-6 text-d4u-text-2";
```

### Caption / metadata

```tsx
className = "font-body text-xs font-medium text-d4u-text-3";
```

### Rules

- No text smaller than `text-xs`.
- Do not use `text-[vw]`.
- Long Vietnamese titles must have `max-w-*` and `leading-tight`.
- Do not uppercase long Vietnamese labels.
- Use uppercase only for short eyebrow labels.

---

## 5 — Page shell pattern

Every page should use:

```tsx
<div className="min-h-screen bg-d4u-bg text-d4u-text-1">
  <div className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    {/* page content */}
  </div>
</div>
```

Rules:

- Use `gap-6` or `gap-8` between sections.
- Prefer parent `gap-*` over scattered `mt-*`.
- Avoid arbitrary spacing like `gap-[13px]`, `p-[17px]`.
- Desktop content should not be full-width if it hurts readability.

---

## 6 — Modern page header pattern

Use for Project Detail, Workspace, Admin screens, Wallet, Verification, Withdrawals.

```tsx
<section className="overflow-hidden rounded-panel border border-d4u-border bg-d4u-surface shadow-soft">
  <div className="relative p-6 sm:p-8">
    <div className="absolute inset-0 bg-gradient-to-br from-d4u-soft via-white to-sky-50" />

    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-d4u-text-2">
            {eyebrow}
          </span>
          <StatusChip status={status} />
        </div>

        <h1 className="max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-d4u-teal-deep sm:text-4xl">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-d4u-text-2">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  </div>
</section>
```

Rules:

- Header should be compact, not huge.
- Title must not dominate the entire viewport.
- Badge belongs near entity title.
- Metadata should not be squeezed into tiny boxes.
- Primary action should be visible above the fold.

---

## 7 — Metadata strip pattern

Use for category, budget, deadline, publish status, role, payment, escrow.

```tsx
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
  {items.map((item) => (
    <div
      key={item.label}
      className="flex min-w-0 items-start gap-3 rounded-2xl border border-d4u-border bg-white/80 p-4 shadow-sm"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-d4u-soft text-d4u-teal-deep">
        <item.icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-d4u-text-3">
          {item.label}
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-d4u-text-1">
          {item.value || "Chưa có"}
        </p>
      </div>
    </div>
  ))}
</div>
```

Rules:

- Do not create tiny cards that break Vietnamese text.
- Use `truncate` for long values.
- Keep metadata close to the page title or inside a clear section.
- Do not force metadata into the far right if it becomes cramped.

---

## 8 — Main + sidebar layout

Use for detail pages.

```tsx
<div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
  <main className="flex min-w-0 flex-col gap-6">{/* main sections */}</main>

  <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
    {/* action / summary / timeline panels */}
  </aside>
</div>
```

Rules:

- Main content must include `min-w-0`.
- Sidebar width should usually be `320px–360px`.
- Sidebar should be sticky on desktop if useful.
- On mobile, sidebar goes below content.
- Sidebar must not contain debug notes.

---

## 9 — Section card pattern

```tsx
<section className="rounded-panel border border-d4u-border bg-d4u-surface shadow-soft">
  <div className="border-b border-d4u-border px-5 py-4 sm:px-6">
    {eyebrow && (
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-d4u-text-3">
        {eyebrow}
      </p>
    )}

    <h2 className="mt-1 text-lg font-semibold text-d4u-text-1">{title}</h2>

    {description && (
      <p className="mt-1 text-sm leading-6 text-d4u-text-2">{description}</p>
    )}
  </div>

  <div className="p-5 sm:p-6">{children}</div>
</section>
```

Rules:

- Each section card has one purpose.
- Do not nest too many cards.
- Use a section header instead of random labels.
- Do not use empty giant cards for short content.

---

## 10 — Info grid pattern

Use instead of tables for small metadata groups.

```tsx
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
  {items.map((item) => (
    <div
      key={item.label}
      className={cn(
        "rounded-2xl bg-d4u-soft/70 p-4 ring-1 ring-d4u-border/60",
        item.fullWidth && "sm:col-span-2",
      )}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-d4u-text-3">
        {item.label}
      </p>

      <div className="mt-2 text-sm font-semibold text-d4u-text-1">
        {item.value || <span className="text-d4u-text-3">Chưa có</span>}
      </div>
    </div>
  ))}
</div>
```

Rules:

- Use for 4–8 fields.
- For long text like `Mục đích sử dụng`, use `sm:col-span-2`.
- Do not use tables for account/profile/project metadata unless it is a large list.
- Format date consistently: `dd/MM/yyyy · HH:mm`.
- Format VND consistently: `100.000 đ`.

---

## 11 — Button system

### Primary

```tsx
className =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-btn bg-d4u-cyan px-4 text-sm font-semibold text-white transition-colors hover:bg-d4u-cyan-hover focus:outline-none focus:shadow-focus disabled:cursor-not-allowed disabled:opacity-50";
```

### Secondary

```tsx
className =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-btn border border-d4u-border bg-white px-4 text-sm font-semibold text-d4u-text-1 transition-colors hover:bg-d4u-soft focus:outline-none focus:shadow-focus disabled:cursor-not-allowed disabled:opacity-50";
```

### Soft

```tsx
className =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-btn bg-d4u-soft px-4 text-sm font-semibold text-d4u-teal-deep transition-colors hover:bg-d4u-soft-2 focus:outline-none focus:shadow-focus disabled:cursor-not-allowed disabled:opacity-50";
```

### Danger outline

```tsx
className =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-btn border border-red-200 bg-white px-4 text-sm font-semibold text-d4u-error transition-colors hover:bg-red-50 focus:outline-none focus:shadow-focus disabled:cursor-not-allowed disabled:opacity-50";
```

### Rules

- One primary CTA per section.
- Secondary actions must not compete with primary CTA.
- Danger action must be visually distinct.
- Disabled action must explain why.
- All buttons need hover and focus states.
- Touch target must be at least 44px.

---

## 12 — Status chip system

```tsx
const chipVariants = {
  warning: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  success: "bg-green-50 text-green-800 ring-1 ring-green-200",
  error: "bg-red-50 text-red-800 ring-1 ring-red-200",
  neutral: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  info: "bg-sky-50 text-sky-800 ring-1 ring-sky-200",
};

<span
  className={cn(
    "inline-flex items-center gap-1.5 rounded-chip px-3 py-1 text-xs font-semibold whitespace-nowrap",
    chipVariants[variant],
  )}
>
  {label}
</span>;
```

### Status mapping

| Status                                                                                                      | Variant |
| ----------------------------------------------------------------------------------------------------------- | ------- |
| `PENDING`, `UNDER_REVIEW`, `WAITING_ACCEPTANCE`, `PENDING_PAYMENT`, `REVISION_REQUESTED`, `RELEASE_PENDING` | warning |
| `ACTIVE`, `VERIFIED`, `OPEN`, `ACCEPTED`, `FUNDED`, `RELEASED`, `COMPLETED`, `APPROVED`, `PUBLIC`           | success |
| `REJECTED`, `FAILED`, `INVALID_REPORTED`, `BANNED`, `SUSPENDED`                                             | error   |
| `DRAFT`, `PRIVATE`, `CANCELLED`, `DELETED`, `REFUNDED`, `HIDDEN`                                            | neutral |
| `PRIVATE_INVITED`, `IN_PROGRESS`, `SKETCH_REVIEW`, `FINAL_REVIEW`, `AI_MATCHED`                             | info    |

Rules:

- Always show text, not color alone.
- Use consistent chip size.
- Do not scatter many badges randomly.

---

## 13 — Action panel pattern

```tsx
<section className="rounded-panel border border-d4u-border bg-d4u-surface p-5 shadow-soft">
  <h2 className="text-base font-semibold text-d4u-text-1">Thao tác</h2>

  <div className="mt-4 flex flex-col gap-3">
    {primaryAction}
    {secondaryActions}
    {dangerAction}
  </div>
</section>
```

Action hierarchy example for Project Detail:

1. Publish — primary
2. Xem ứng tuyển — secondary
3. Sửa dự án — secondary
4. Hủy dự án — secondary/neutral
5. Xóa — danger outline

Rules:

- Do not make all buttons look equal.
- Put the most important action first.
- Destructive actions go last.
- Use confirm dialog for destructive actions.

---

## 14 — Helper card pattern

Do not show developer/debug notes.

Bad:

```tsx
<p>Flow hiện tại</p>
```

Good:

```tsx
<div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
  <div className="flex gap-3">
    <Info className="mt-0.5 h-4 w-4 shrink-0 text-d4u-info" />
    <div>
      <h3 className="text-sm font-semibold text-d4u-teal-deep">
        Điều kiện chuyển sang execution
      </h3>
      <p className="mt-1 text-sm leading-6 text-d4u-text-2">
        Project chỉ vào execution sau khi offer được chấp nhận và PayOS xác nhận
        escrow thành công.
      </p>
    </div>
  </div>
</div>
```

Rules:

- Write for users, not developers.
- Helper cards should explain next conditions clearly.
- Keep content short.

---

## 15 — Empty, loading, error, forbidden states

Every page must handle:

| State     | UI                                              |
| --------- | ----------------------------------------------- |
| loading   | Skeleton that matches real layout               |
| empty     | Icon + short message + one CTA                  |
| error     | Inline error + retry button                     |
| forbidden | Full forbidden state, no partial sensitive data |
| success   | Render data clearly                             |

### Empty state

```tsx
<div className="flex flex-col items-center justify-center rounded-panel border border-dashed border-d4u-border bg-white p-8 text-center">
  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-d4u-soft text-d4u-teal-deep">
    <Inbox className="h-6 w-6" />
  </div>
  <h3 className="mt-4 text-base font-semibold text-d4u-text-1">
    Chưa có dữ liệu
  </h3>
  <p className="mt-1 max-w-sm text-sm leading-6 text-d4u-text-2">
    Dữ liệu mới sẽ xuất hiện tại đây khi có cập nhật.
  </p>
</div>
```

---

## 16 — Anti-boring UI checklist

The UI is not acceptable if:

- It is only white cards stacked vertically.
- It has many pale boxes with no hierarchy.
- It uses oversized title and tiny metadata.
- All buttons have equal visual weight.
- It has too many borders.
- It has empty whitespace without purpose.
- It shows debug/helper text as raw developer notes.
- It uses tables for small detail information.
- Status badges are scattered randomly.
- Vietnamese text wraps badly.
- The screen looks like a default admin dashboard.

Before finishing, ask:

- Is the primary decision obvious in 3 seconds?
- Is the main CTA above the fold?
- Is the title balanced with metadata?
- Are cards grouped by purpose?
- Can a new user understand what to do next?
- Does it look better than a default admin template?
- Is CSS thuần removed or minimized?
- Is the screen Tailwind-first?

If not, redesign again.

---

# Screen-specific patterns

## 17 — Project Detail pattern

Use this exact structure for `/projects/:id`.

```tsx
<div className="min-h-screen bg-d4u-bg text-d4u-text-1">
  <div className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <ProjectDetailHero />

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <main className="flex min-w-0 flex-col gap-6">
        <ProjectBriefSection />
        <ProjectMetadataSection />
      </main>

      <ProjectActionSidebar />
    </div>
  </div>
</div>
```

### Hero must contain

- Eyebrow: `PROJECT DETAIL`
- Status chip beside title
- Title with max width
- Short metadata row:
  - Project type
  - Category
  - Review deadline

- Optional compact stats:
  - Budget
  - Publish status
  - Applications count

Do not squeeze tiny stat cards into the far right of a huge title.

### Brief section

Use:

- Eyebrow: `BRIEF DỰ ÁN`
- Title: `Nội dung SME đang yêu cầu Student thực hiện`
- Brief text with good line-height
- Usage purpose block if available

### Metadata section

Use `InfoGrid` with:

- Status
- Budget
- Project type
- Publish time
- Sketch deadline
- Final deadline
- Review deadline
- Usage purpose full width

### Action sidebar

Order:

1. Publish
2. Xem ứng tuyển
3. Sửa dự án
4. Hủy dự án
5. Xóa

Helper card:

- Title: `Điều kiện chuyển sang execution`
- Content: `Project chỉ vào execution sau khi offer được chấp nhận và PayOS xác nhận escrow thành công.`

Do not show `Flow hiện tại`.

---

## 18 — Create Project / AI Brief pattern

Use a two-column layout.

```tsx
<div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
  <ProjectInfoForm />
  <AiBriefAssistant />
</div>
```

Rules:

- Left side: project basics, budget, deadlines.
- Right side: AI brief assistant.
- AI card must feel special but not like a chatbot.
- Use clear form sections:
  - Thông tin cơ bản
  - Brief & mục tiêu
  - Ngân sách & deadline

- Form labels must be visible.
- No placeholder-only fields.
- CTA `Gợi ý bằng AI` must be clear.
- AI suggestion is editable and never published automatically.

---

## 19 — Workspace / Submission Review pattern

Structure:

1. Header
2. Compact progress stepper
3. Next action card
4. Submission cards
5. Timeline sidebar
6. Project summary sidebar

Rules:

- Next action must be obvious.
- Submission cards show Sketch/Final clearly.
- Attachment UI must not look like an input.
- Timeline uses soft red for overdue and soft blue/green for active.
- Sidebar sticky on desktop.
- Do not use heavy card nesting.

---

## 20 — Admin Withdrawal pattern

Structure:

1. Header
2. Stat cards
3. Filters
4. Master-detail layout
5. Manual refund section

Rules:

- Left: request queue.
- Right: selected request detail.
- Amount to transfer must be visually prominent.
- Bank transfer info uses copyable info rows.
- Warning must not contradict completed status.
- Empty refund table should become EmptyState if no rows.
- This screen should feel like a Finance Operations Dashboard.

---

## 21 — Admin Verification pattern

Structure:

1. Header with Quay lại / Duyệt / Từ chối
2. Left document viewer
3. Right review panel
4. Checklist / decision area

Rules:

- Document viewer must be professional.
- Account/profile info should be info cards, not table.
- Long email must truncate cleanly.
- Add privacy-aware UI for demo if needed.
- Decision buttons must be obvious.
- Reject should use danger outline.
- Approve should use primary.

---

## 22 — Marketplace pattern

```tsx
<div className="flex flex-col gap-6">
  <MarketplaceHeader />
  <MarketplaceToolbar />
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {projects.map((project) => (
      <ProjectCard key={project.id} project={project} />
    ))}
  </div>
</div>
```

Project card must show:

- Title
- Category
- Budget
- Deadline
- Status chip
- Brief preview, two-line clamp
- CTA

Cards should be scannable and modern.

---

## 23 — Dashboard pattern

Structure:

1. Header with role-specific CTA
2. Important status alert
3. Stat cards
4. Main sections ordered by urgency

Urgency order:

### Student

1. Verification status
2. Recommended projects
3. Pending offers
4. Active projects
5. Wallet

### SME

1. Package/subscription state
2. Draft/open projects
3. Pending payments
4. AI Brief entry
5. Active projects

### Admin

1. Pending verification count
2. Pending withdrawal count
3. Portfolio moderation
4. Recent audit events

---

## 24 — Forms

### Input

```tsx
<input className="h-11 w-full rounded-btn border border-d4u-border bg-white px-3 text-sm text-d4u-text-1 placeholder:text-d4u-text-3 transition-colors hover:border-d4u-teal-muted focus:border-d4u-cyan focus:outline-none focus:shadow-focus disabled:cursor-not-allowed disabled:bg-d4u-soft" />
```

### Textarea

```tsx
<textarea className="min-h-32 w-full resize-y rounded-btn border border-d4u-border bg-white px-3 py-3 text-sm leading-6 text-d4u-text-1 placeholder:text-d4u-text-3 transition-colors hover:border-d4u-teal-muted focus:border-d4u-cyan focus:outline-none focus:shadow-focus disabled:cursor-not-allowed disabled:bg-d4u-soft" />
```

Rules:

- Always use visible label.
- Helper text below input.
- Error text below input.
- Do not rely on placeholder as label.
- Group fields using `flex flex-col gap-1.5`.

---

## 25 — Tables

Use tables only for large lists.

```tsx
<div className="overflow-hidden rounded-panel border border-d4u-border bg-white shadow-soft">
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-d4u-soft">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-d4u-text-2">
            Header
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-d4u-border">
        <tr className="transition-colors hover:bg-d4u-soft/60">
          <td className="px-4 py-4 text-d4u-text-1">Value</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

Rules:

- Do not use tables for two-column metadata.
- Add empty state for no rows.
- Paginate or load more when rows exceed 25.

---

## 26 — API integration rules

```js
baseURL: "/api/v1";
```

Rules:

- Never hardcode API host inside page components.
- Inject access token in authenticated requests.
- `401`: refresh token, retry once, then clear session and redirect login.
- `403`: render ForbiddenState.
- `404`: render NotFoundState or empty state depending on feature.
- Backend field errors map to form fields.
- Never invent endpoints.
- If endpoint is missing, note the gap and adapt UI gracefully.

---

## 27 — MVP scope boundary

In scope:

- Email/password auth
- Google OAuth
- Role routing: Student, SME, Admin
- Student profile and verification
- SME profile and subscription/package
- AI Project Brief Assistant
- Project CRUD and publish
- Applications
- Offers
- PayOS escrow payment
- Sketch / Final / Revision submission
- SME review actions
- Disbursement and wallet
- Manual Admin withdrawal processing
- Basic Portfolio Builder
- Ratings
- In-app notifications for core events
- Admin audit logs

Out of scope:

- Dispute UI
- Dispute appeal
- Automatic bank payout
- KYC automation
- Real-time chat
- Non-Google social login
- AI auto-selection
- AI auto-pricing
- AI auto-publishing
- AI verification approval
- Advanced portfolio marketplace
- Advanced analytics
- Mid-project cancel partial-refund UI

Do not build out-of-scope screens unless the user explicitly asks.

---

## 28 — Implementation workflow for Codex / Claude

When asked to improve UI:

1. Inspect current route, component, CSS, API client, state, and DTO usage.
2. Identify screen type:
   - Project Detail
   - Create Project
   - Workspace
   - Admin Withdrawal
   - Admin Verification
   - Wallet
   - Dashboard
   - Marketplace
   - Auth

3. Identify the main user decision on that screen.
4. Rebuild layout around that decision.
5. Remove or reduce page-specific CSS.
6. Convert styling to Tailwind utility classes.
7. Extract reusable components only if it improves clarity.
8. Preserve all existing logic/API/state.
9. Handle loading, empty, error, forbidden, success states.
10. Check responsive at desktop and mobile.
11. Run:
    - `npm run build`
    - `npm run lint` if available

12. Report:
    - Files changed
    - UI improvements made
    - Logic/API unchanged
    - Any remaining limitations

Do not return only a plan. Implement the changes.

---

## 29 — QA checklist before finishing

- [ ] `npm run build` passes.
- [ ] `npm run lint` passes or known existing issues are reported.
- [ ] No new page-specific CSS for layout/components.
- [ ] No raw hex values in JSX/TSX.
- [ ] No inline style unless unavoidable.
- [ ] Tailwind classes use D4U tokens.
- [ ] Desktop 1280px+ works.
- [ ] Mobile 375px works.
- [ ] Vietnamese text does not wrap badly.
- [ ] Buttons have hover/focus/disabled states.
- [ ] Touch targets are at least 44px.
- [ ] Loading/empty/error/forbidden/success states exist.
- [ ] Destructive actions use confirm dialog.
- [ ] Status chips use correct variants.
- [ ] Primary CTA is obvious.
- [ ] UI does not look like a default admin dashboard.
- [ ] UI feels modern, bright, structured, and demo-ready.

---

## 30 — Prompt template to use with this skill

Use this prompt when asking Codex/Claude to improve a screen:

```text
Áp dụng skill d4u-frontend TailwindCSS-first.

Nhiệm vụ:
Redesign lại màn hình hiện tại để UI hiện đại, sáng, sáng tạo, bố cục rõ ràng và demo-ready hơn.

Yêu cầu bắt buộc:
- Không đổi logic/API/state/route.
- Không dùng CSS thuần cho layout/page/component.
- Không tạo page-specific CSS mới.
- Nếu có CSS thuần cũ cho màn này, hãy chuyển sang Tailwind utility classes trong JSX/TSX.
- Không dùng UI library khác.
- Không dùng raw hex trong JSX.
- Không dùng inline style trừ khi bất khả kháng.
- Dùng D4U Tailwind tokens từ tailwind.config.js.
- Tập trung sửa layout balance, visual hierarchy, spacing, typography, card structure và action hierarchy.
- Không chỉ đổi màu, bo góc, shadow.
- UI phải nhìn như SaaS product hiện đại, không giống admin dashboard cũ.

Sau khi sửa:
- Chạy npm run build.
- Chạy npm run lint nếu có.
- Báo lại files changed, thay đổi UI chính, và xác nhận logic/API không đổi.
```
