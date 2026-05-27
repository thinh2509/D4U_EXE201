---
name: frontend-ui-designer
description: Design and implement polished frontend UX/UI for D4U and React/Vite web apps. Use when Codex needs to create or refactor D4U screens, role-based dashboards, marketplace flows, verification UI, project/application/offer pages, real payment-in screens, internal wallet/manual withdrawal UI, paid AI Matching, Portfolio Builder, rating, responsive layouts, brand-consistent visual systems, UX prompts, or frontend implementation plans with build and browser validation.
---

# D4U Frontend UI Designer

## Overview

Use this skill to design and implement D4U frontend experiences that are modern, trustworthy, marketplace-ready, and connected to real backend workflows.

D4U is a creative marketplace where SMEs post design projects, verified students apply, deliver milestones, receive escrow-backed payments, buy paid feature packages, use AI Matching, and build basic portfolios.

Prioritize:

- Trust and payment clarity.
- Role-based workflows.
- Marketplace discovery.
- Verification transparency.
- AI as assistance, not final decision-making.
- Simple premium UI using D4U logo colors.
- API-connected loading, empty, error, success, and forbidden states.

## Current MVP Boundaries

Build only current MVP UI unless the user explicitly expands scope.

Included:

- Email/password auth, email verification, Google login.
- Student/SME/Admin role routing.
- Student profile and verification by document metadata or EDU email.
- SME profile.
- AI Project Brief Assistant.
- Project create/edit/publish/cancel/list/detail.
- Student applications and SME offers.
- Real payment-in through one selected provider for escrow and paid feature packages.
- Paid feature packages and AI Matching entitlement UI.
- Sketch/final submission, review, revision, invalid file report.
- Internal Student wallet ledger and manual Admin/Finance withdrawal processing.
- Basic Student Portfolio Builder.
- Ratings, notifications, audit-oriented operational screens when APIs exist.

Out of MVP:

- Dispute open/evidence/resolve UI.
- Dispute appeal.
- Automatic bank payout, bank KYC, or direct bank balance sync.
- Realtime chat.
- Non-Google social login.
- AI auto-selection, auto-pricing, auto-publishing, or verification approval.
- Advanced portfolio marketplace, analytics, or monetization.

## Brand System

Use D4U logo colors, not indigo/purple.

Core colors:

- Primary cyan: `#12AEEA`.
- Primary hover: `#0B9BD3`.
- Deep teal: `#075D78`.
- Muted teal: `#0A6F8E`.
- Charcoal: `#1D2428`.
- Logo dark/nav accent: `#071014`.
- Background: `#F6FAFD` or `#F8FBFE`.
- Surface: `#FFFFFF`.
- Soft surface: `#EEF6FA`.
- Text primary: `#1D2428`.
- Text secondary: `#667985`.
- Text muted: `#8EA0AA`.
- Border: `#D7E5EC`.

Semantic colors:

- Success: `#16A34A`.
- Warning: `#F59E0B`.
- Error: `#DC2626`.
- Info: `#0EA5E9`.

Rules:

- Use cyan/teal for primary actions, links, active nav, focus rings, and brand accents.
- Use dark teal/charcoal for structure, headings, and compact nav accents.
- Keep the app light; do not turn the whole UI dark.
- Do not use purple/indigo as the primary action system.
- Avoid decorative blobs, random gradients, and one-note blue screens.

## Typography

Prefer a refined SaaS/editorial type system:

- Display/headings: `General Sans` when available.
- Body/UI: `DM Sans` when available.
- Technical metadata: `JetBrains Mono`.

If fonts are not installed, use the project’s existing font stack and keep type consistent.

Type guidance:

- Page title: 36-40px desktop, 28-32px mobile.
- Section heading: 24-32px.
- Card title: 18-24px.
- Body: 14-16px.
- Caption/meta: 12-13px.
- Do not scale font size with viewport width.

## Layout

- Max content width: `1280px`.
- Mobile padding: `16px`.
- Tablet padding: `24px`.
- Desktop padding: `24px` or `32px`.
- Use a 4px spacing grid.
- Use cards for repeated items, panels, modals, and real framed tools only.
- Do not nest cards.
- Marketplace grid: 1 column mobile, 2 tablet, 3 desktop, 4 large desktop only when content remains readable.
- Mobile should use drawer filters/navigation and single-column content.

Radii:

- Chips: 9999px or 4px depending on density.
- Buttons/inputs: 6px.
- Panels/dropdowns: 8px.
- Project/profile cards: 12px.

Elevation:

- Static cards: border-first, minimal shadow.
- Hover cards: lift `-2px` with subtle shadow.
- Focus ring: `0 0 0 3px rgba(18,174,234,0.16)`.

## Components

Use existing project components first. If missing, create reusable components:

- `AppShell`
- `RoleBasedNav`
- `PageHeader`
- `SectionHeader`
- `StatusChip`
- `EmptyState`
- `LoadingSkeleton`
- `ProjectCard`
- `StudentCard`
- `ApplicationCard`
- `OfferCard`
- `VerificationCard`
- `WalletSummaryCard`
- `PortfolioItemCard`
- `DashboardStatCard`
- `ProjectTimeline`
- `PaymentSummary`
- `EscrowStatusPanel`
- `FileMetadataUploader`
- `ConfirmDialog`
- `DataTable`
- `FilterBar`
- `MobileFilterDrawer`

## Status Chips

Always show text labels; do not rely on color alone.

Use these mappings:

- `PENDING`, `UNDER_REVIEW`, `WAITING_ACCEPTANCE`, `PENDING_PAYMENT`, `REVISION_REQUESTED`, `RELEASE_PENDING`: warning.
- `ACTIVE`, `VERIFIED`, `OPEN`, `ACCEPTED`, `FUNDED`, `RELEASED`, `COMPLETED`, `APPROVED`, `PUBLIC`: success.
- `REJECTED`, `FAILED`, `INVALID_REPORTED`, `BANNED`, `SUSPENDED`: error.
- `DRAFT`, `PRIVATE`, `CANCELLED`, `DELETED`, `REFUNDED`, `HIDDEN`: neutral.
- `PRIVATE_INVITED`, `IN_PROGRESS`, `SKETCH_SUBMITTED`, `FINAL_SUBMITTED`, `AI_MATCHED`: info or primary.

Do not add `DISPUTED` UI for MVP.

## Role Navigation

Guest:

- Home if requested.
- Browse Projects.
- Pricing/Packages when paid features are in scope.
- Login.
- Register.

Student:

- Dashboard.
- Browse Projects.
- Applications.
- Offers.
- My Projects.
- Portfolio.
- Wallet.
- Profile.
- Verification.
- Ratings.

SME:

- Dashboard.
- My Projects.
- Applications.
- Offers.
- AI Brief Assistant.
- AI Matching.
- Billing/Packages.
- Profile.
- Ratings.

Admin:

- Dashboard.
- Student Verifications.
- Portfolio Moderation.
- Withdrawals.
- Users.
- Audit Logs.

## Page Patterns

Auth:

- Login/register should be clean, light, centered or split-layout.
- Use the D4U logo on a light or carefully framed surface.
- Include Google login when configured.
- Show email verification state and friendly resend/confirm flows.
- Role selection must be clear for Student vs SME.

Student dashboard:

- Verification status.
- Recommended/open projects.
- Applications.
- Pending offers.
- Active projects.
- Portfolio completion.
- Wallet summary.
- Primary CTA: Browse Projects.

SME dashboard:

- Company profile status.
- Subscription/package limits.
- Draft/open projects.
- Applications.
- Pending payments/offers.
- AI brief assistant entry.
- AI Matching entry when entitlement exists.
- Primary CTA: Create Project.

Admin dashboard:

- Pending verification count.
- Pending withdrawal count.
- Portfolio moderation count.
- Recent audit events.
- Recent verification requests.

Marketplace:

- Search/filter toolbar.
- Project cards with title, SME/company, category, budget, deadline, status, brief preview, portfolio/confidentiality badges, and CTA.
- Empty state with one clear CTA.

Project detail:

- Main brief area plus right-side summary panel on desktop.
- Show budget, deadline timeline, SME/company, category, usage purpose, deliverables, confidentiality, portfolio permission, revision limit.
- Student CTA: Apply.
- SME owner CTA: Edit, Publish, Cancel.

AI Project Brief Assistant:

- Present AI as a helper, not a chatbot-first product.
- Show editable suggestions for title, brief, usage purpose, deliverables, category hint, and deadline notes.
- Include a clear note that AI suggestions are editable and never published automatically.

Paid packages and AI Matching:

- Show package catalog by role.
- Show price, duration, entitlements, limits, and active status.
- Payment CTA should create provider payment link/QR through backend.
- AI Matching pages must show entitlement requirement, match score, reasons, and missing-data warnings.
- Never imply AI can auto-apply, auto-invite, auto-select, auto-price, or auto-publish.

Payment and escrow:

- Make payment-in screens feel trustworthy.
- Show amount, fee if visible, provider, QR/link state, payment status, and escrow explanation.
- State that project starts only after escrow is funded.
- Do not show “sandbox” in production UI; show mock/sandbox only in development environments.
- Do not trust client-side payment success; the UI must wait for backend/provider-confirmed status.

Wallet and withdrawal:

- Make clear the Student wallet is an internal D4U ledger.
- Show available, pending, locked balance, currency, wallet status, transactions, and withdrawal history.
- Withdrawal request UI collects bank/payment method metadata.
- Explain that Admin/Finance manually processes transfer outside the system in MVP.
- Do not design automatic bank payout or bank balance sync.

Portfolio Builder:

- Student can create/edit portfolio items with title, description, category, role, tools, skills, link, visibility, featured flag, and file metadata.
- Allow attaching completed D4U project output only when confidentiality and `allowStudentPortfolio` permit it.
- SME can view public portfolio while reviewing applications/offers.
- Admin can hide inappropriate public portfolio items.

Review/submission:

- Student submits Sketch, Final, and Revision with description and file metadata.
- SME can approve, request revision, or report invalid file.
- Do not include Open Dispute in MVP review actions.

Rating:

- Simple 1-5 rating with max 500-character comment.
- Show rating deadline when available.

## Forms

- Use visible labels, not placeholder-only fields.
- Group related fields into sections.
- Show helper text for complex fields.
- Validate budget, deadline, file extension, and required fields before API calls where reasonable.
- Surface backend validation errors near fields or in concise messages.
- Use confirmation dialogs for destructive actions.

Allowed verification/portfolio file extensions in MVP:

- `jpg`
- `png`
- `pdf`

## Backend Integration

Never hardcode backend host in page components. Prefer:

```js
baseURL: '/api/v1'
```

Before implementing a page:

1. Inspect existing routes, contexts, API clients, and components.
2. Confirm the backend controller/DTO/API contract.
3. Map route, role, endpoint, request, response, loading, empty, error, forbidden, and success states.
4. Do not invent APIs. If the endpoint is missing, adapt the UX or state the backend gap.

Handle:

- Access token injection.
- Refresh token retry on `401`.
- Logout when refresh fails.
- `403` as forbidden UI.
- `404` as not found or not-created state.
- Field-level validation errors when possible.

## Suggested Routes

Public:

- `/`
- `/login`
- `/register`
- `/verify-email`
- `/projects`
- `/pricing`

Student:

- `/student/dashboard`
- `/student/profile`
- `/student/verification`
- `/student/projects`
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
- `/sme/projects/:id/edit`
- `/sme/projects/:id/applications`
- `/sme/offers`
- `/sme/ai-brief`
- `/sme/ai-matching`
- `/sme/billing`
- `/sme/ratings`

Shared:

- `/projects/:id`
- `/projects/:id/execution`
- `/projects/:id/submissions`
- `/projects/:id/rating`

Admin:

- `/admin/dashboard`
- `/admin/verifications`
- `/admin/verifications/:id`
- `/admin/portfolio`
- `/admin/withdrawals`
- `/admin/users`
- `/admin/audit-logs`

## QA Checklist

Before finishing frontend work:

- Run build.
- Run lint if configured.
- Start the dev server when feasible.
- Open key routes in browser.
- Check desktop and mobile for overflow.
- Verify Vietnamese text fits in buttons/cards/forms.
- Verify loading, empty, error, success, and forbidden states.
- Verify role redirects and protected routes when auth is involved.
- Report any backend/server dependency that was not running.

## Reference

For D4U-specific colors, components, and scope boundaries, read `references/d4u-light-theme.md`.
