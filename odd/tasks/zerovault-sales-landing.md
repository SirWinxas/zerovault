# ZeroVault — Sales landing (pricing + demo checkout)

- Feature id: `zerovault-sales-landing`
- Created: 2026-10-10
- TDD mode: strict (project). Applied to logic only (`plans.ts`); marketing/checkout JSX is
  presentational (verified by typecheck + build + visual readback), matching the project's
  convention of TDD on the crypto core, not on presentational pages.
- Test runner: `vitest run` (web workspace), `tsc --noEmit` typecheck, `vite build`.

## Objective

Turn the landing (`/`) into a product + sales page: explain ZeroVault and let a visitor pick a
plan and go through a **demo checkout** (no real payment, no API/DB change). UI is wired so a real
payment provider (Stripe Payment Link / Checkout) can be plugged in later at the CTA/checkout
boundary.

## Scope (frontend only)

- In: pricing section on the landing, a shared plan catalog, a demo checkout route.
- Out: real payment processing, backend endpoints, webhooks, premium tier enforcement, legal/VAT.

## Why / decisions

- Chosen level: "Landing de venta, sin cobro real" (user, 2026-10-10). Frontend only; does not
  touch the deployed API.
- Default pricing (adjustable): Free €0 · Premium €1.99/mo (€19/yr) · Teams €3.99/user/mo
  (€39/user/yr). ~20% annual discount.
- Checkout is clearly labelled DEMO (no charge). After "purchase", the real next step is
  `/register` (create the vault), since account creation is the actual product action.

## Route declaration (ODD)

- Route: **direct inline** (full context already loaded: theme tokens, existing LandingPage,
  RegisterPage, router). Entangled with pre-existing uncommitted WIP in `App.tsx` and
  `LandingPage.tsx`, so no clean sub-file commit is possible; commit decision surfaced to user.

## Tasks

- [x] T1 — `src/lib/plans.ts` + `src/lib/plans.test.ts`: plan catalog + price helpers (TDD, 8 tests).
- [x] T2 — `src/components/organisms/PricingSection.tsx`: billing toggle + plan cards.
- [x] T3 — `src/pages/CheckoutPage.tsx`: order summary + demo payment form + success state.
- [x] T4 — wire `LandingPage.tsx` (nav "Pricing" + "See plans" + section) and `App.tsx` (`/checkout`).
- [x] T5 — `src/pages/CheckoutPage.test.tsx`: routing/summary/demo-submit (6 tests). Closes the
  review's `R3-checkout-untested-routing` advisory finding.

## Acceptance

- Landing shows a pricing block with a monthly/annual toggle and Free/Premium/Teams.
- Paid CTAs route to `/checkout?plan=...&billing=...`; Free routes to `/register`.
- Checkout shows the right plan/price, a visible DEMO notice, and a success panel → `/register`.
- `vitest run` green for `plans.test.ts`; `tsc --noEmit` and `vite build` succeed.

## Checks (status)

- [x] `npm run test -w apps/web` — 13 files, 60 tests passing (incl. 8 plans + 6 checkout).
- [x] `npm run typecheck -w apps/web` — clean.
- [x] `npm run build -w apps/web` — `tsc --noEmit` + `vite build` OK (65 modules).

## Gentle AI review (RDD)

- RDD switch: on (global). Candidate = whole uncommitted worktree (design-refresh WIP + this
  feature): 18 files, 1158 lines, risk **medium** → one consolidated lens (`review-reliability`).
- Consent: user granted (2026-10-10). Lineage `review-1d34c9142644c7e7`.
- Outcome: **approved**, authority burned (`gentle-ai.review-acknowledged/v1`). All 4 findings
  advisory / non-blocking:
  - `R3-checkout-untested-routing` (mine, WARNING) → fixed by T5.
  - `R3-checkout-demo-card-inputs` (mine, SUGGESTION) → expected demo behavior, no change.
  - `R3-button-classname-override` (pre-existing WIP, WARNING) → not this feature; left for owner.
  - `R3-auth-heading-hierarchy` (pre-existing WIP, SUGGESTION) → not this feature; left for owner.
- Delivery (commit/push/PR) remains the owner's decision under ordinary repo policy (review is
  informational and does not authorize delivery).

## Project memory

ZeroVault's project memory is a file, not an Engram project (Engram returns `ambiguous_project`
here — cwd resolves to bitapp/claude-seo). Recorded in
`C:\Users\danie\Desktop\zerovault-info\claude-memory-zerovault.md` (updated 2026-10-11).
GitHub repo: https://github.com/SirWinxas/zerovault (private).

## Git note

Changes are entangled with pre-existing uncommitted WIP in `App.tsx`/`LandingPage.tsx`, so no clean
feature-only commit is possible. Not committed automatically; left to the owner.
