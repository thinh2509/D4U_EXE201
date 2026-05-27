# D4U Frontend Reference

Use this reference only for D4U frontend design work.

## Brand Direction

D4U uses a light, professional creative-marketplace UI based on the logo colors: bright cyan, deep teal, charcoal, dark logo accents, and clean white surfaces.

Core colors:

- Primary cyan: `#12AEEA`
- Primary hover: `#0B9BD3`
- Deep teal: `#075D78`
- Muted teal: `#0A6F8E`
- Charcoal: `#1D2428`
- Dark logo accent: `#071014`
- Background: `#F6FAFD` or `#F8FBFE`
- Surface: `#FFFFFF`
- Soft surface: `#EEF6FA`
- Text primary: `#1D2428`
- Text secondary: `#667985`
- Text muted: `#8EA0AA`
- Border: `#D7E5EC`
- Success: `#16A34A`
- Warning: `#F59E0B`
- Error: `#DC2626`
- Info: `#0EA5E9`

Rules:

- Use cyan/teal for CTAs, links, active states, selected tabs, focus rings, and icon accents.
- Use charcoal/deep teal for headings, navigation, and high-trust payment surfaces.
- Keep the interface light and spacious.
- Do not use indigo/purple as D4U primary.
- Do not make the whole app dark; reserve dark color for logo/nav accents.

## Current MVP UX Scope

Phase 1:

- Register/login.
- Account email verification after registration.
- Google login.
- Role routing for `STUDENT`, `SME`, and `ADMIN`.
- Student profile create/update.
- Student verification by document metadata with `jpg`, `png`, `pdf`.
- Student EDU email verification.
- SME profile create/update.
- Admin list/detail/approve/reject student verifications.

Phase 2:

- AI Project Brief Assistant as a form helper.
- SME project draft/create/update/publish/cancel.
- Student open project list/detail/application.
- SME application list and offer creation.
- Student offer accept/reject when data is available.

Phase 3:

- Real payment-in provider UI for escrow funding.
- Provider payment link or QR state.
- Payment status polling/refresh after provider return.
- Backend-confirmed payment success only.
- Sketch/final submission and review UI.
- Revision request and invalid file report UI.

Phase 4:

- Internal wallet ledger.
- Disbursement summary.
- Payment method metadata.
- Withdrawal request.
- Admin/Finance manual withdrawal processing.

Phase 5:

- Basic Student Portfolio Builder.
- SME public portfolio viewing during application/offer review.
- Admin portfolio moderation.
- Ratings.
- Notifications and audit-oriented screens when APIs exist.

Phase 6:

- Paid feature package catalog and purchase.
- Entitlement status.
- AI Matching for Students and SMEs when entitlement exists.

Out of MVP:

- Dispute screens.
- Dispute appeal.
- Automatic bank payout.
- Bank KYC or bank balance sync.
- Realtime chat.
- Non-Google social login.
- AI auto-selection, auto-pricing, auto-publishing, and verification approval.

## API Rules

Use `/api/v1` as the frontend base path and Vite/Nginx proxy to backend.

Always verify endpoints from backend source before implementing.

Current/expected endpoint groups:

- Auth: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`, `/auth/email-verification/*`, `/auth/google`
- Student profile: `/students/me`
- Student verification: `/students/me/verification`, `/students/me/edu-verification/*`
- SME profile: `/smes/me`
- Admin verification: `/admin/student-verifications`
- Projects: `/projects`, `/projects/{id}`, `/projects/{id}/publish`, `/projects/{id}/cancel`
- Applications/offers: `/projects/{id}/applications`, `/projects/{id}/offers`, `/offers/{id}/accept`, `/offers/{id}/reject`
- AI brief: `/ai/project-brief-assistant`
- Payment/escrow: `/offers/{id}/payment`, `/payments/webhook`, `/projects/{id}/escrow`
- Paid features: `/feature-packages`, `/feature-package-purchases`, `/feature-package-purchases/{id}/payment`, `/me/feature-entitlements`
- AI Matching: `/ai/matching/projects`, `/ai/matching/projects/{id}/students`
- Portfolio: `/students/me/portfolio`, `/students/me/portfolio-items`, `/students/{id}/portfolio`, `/admin/portfolio-items/{id}/hide`
- Wallet: `/wallets/me`, `/wallets/me/transactions`, `/payment-methods`, `/withdrawal-requests`, `/admin/withdrawal-requests/{id}/process`

If a listed endpoint is not implemented yet, do not fake business behavior. Show a clear backend gap or adapt the UI to implemented APIs.
