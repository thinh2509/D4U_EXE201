---
name: frontend-ui-designer
description: Design and implement polished frontend UX/UI for D4U and React/Vite web apps. Use when Codex needs to create, refactor, review, or plan D4U screens, role-based dashboards, marketplace flows, verification UI, project/application/offer pages, PayOS payment-in and escrow screens, internal wallet/manual withdrawal UI, paid AI Matching, Portfolio Builder, ratings, notifications, responsive layouts, brand-consistent visual systems, or frontend implementation plans with build and browser validation.
---

# D4U Frontend UI Designer

Use this skill to build D4U frontend work that is role-aware, API-connected, MVP-safe, and visually consistent with the current React/Vite app.

## Repository Baseline

- Frontend stack: React 18, Vite, React Router, Axios, Ant Design, `@ant-design/icons`.
- Main app paths: `FE/src/App.jsx`, `FE/src/components`, `FE/src/pages`, `FE/src/services`, `FE/src/styles.css`.
- Use Ant Design components and icons first because the repo already standardizes on them.
- Prefer existing components before adding new ones: `AppLayout`, `PageHeader`, `StatusBadge`, `StateViews`, `ProjectCard`, `UserMenu`, service modules in `FE/src/services`.
- Use `/api/v1` through the existing Axios client. Never hardcode backend hosts in page components.

## Required Workflow

Before designing or implementing:

1. Inspect current routes, shells, components, service modules, and relevant backend controllers/DTOs.
2. Read `references/d4u-light-theme.md` when the task touches D4U UI, routes, API endpoints, status labels, responsive layout, or MVP boundaries.
3. Confirm the real backend contract from source before wiring a screen. Do not invent API shape.
4. Map each feature to role, route, endpoint, request/response, loading, empty, error, forbidden, success, and navigation states.
5. Reuse existing visual patterns and CSS variables before introducing new styles.
6. Validate with build, lint if configured, and browser checks when feasible.

## UX Priorities

- Make payment, escrow, verification, withdrawal, and review flows clear and trustworthy.
- Keep dashboards and operational screens dense, scannable, and work-focused.
- Use real loading, empty, error, forbidden, and success states.
- Keep Vietnamese text readable on desktop and mobile; check buttons, cards, tables, and drawers for overflow.
- Use visible labels for forms, concise helper text for complex fields, and confirmation dialogs for destructive actions.
- Use status text plus color; never rely on color alone.

## MVP Guardrails

Build only MVP UI unless the user explicitly expands scope.

Do not add:

- Dispute workflow or dispute appeal UI.
- Realtime chat.
- Non-Google social login.
- Automatic bank payout, bank KYC, or direct bank balance sync.
- AI auto-selection, auto-pricing, auto-publishing, auto-apply, auto-invite, or verification approval.
- Advanced portfolio marketplace, analytics, or monetization.

Payment UI must wait for backend/provider-confirmed status. Do not treat client-side query parameters or provider return pages as proof of payment success.

## Implementation Guidance

- Put route-level screens under the existing role folders: `pages/student`, `pages/sme`, `pages/admin`, or `pages/shared`.
- Put API calls in `FE/src/services/*Api.js`; keep page components focused on state and presentation.
- Use `getApiErrorMessage` for backend errors and `StateViews` for reusable error/empty states where suitable.
- Keep shared UI reusable only when it serves more than one screen or matches an established local pattern.
- Avoid nested cards and decorative-only gradients/blobs. Cards should frame repeated items, panels, modals, and real tools.
- Use responsive constraints for tables, toolbars, cards, buttons, and drawers so layout does not shift or overflow.

## Validation Checklist

Before finishing frontend changes:

- Run `npm run build` from `FE`.
- Run `npm run lint` when it is configured and practical.
- Start the dev server and inspect key routes in browser when feasible.
- Check desktop and mobile viewports.
- Verify role redirects and protected routes when auth is involved.
- Verify API-connected loading, empty, error, forbidden, success, and refresh states.
- Report backend/server dependencies that were not running.

## Reference

For D4U colors, CSS variables, route matrix, exact endpoint groups, status mappings, and page patterns, read `references/d4u-light-theme.md`.
