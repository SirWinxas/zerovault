# ZeroVault — Landing page improvements

- Feature id: `zerovault-landing-improvements`
- Created: 2026-10-11
- TDD mode: strict (project). Applied to LOGIC only (e.g. a demo-access helper);
  marketing/markup/copy/meta is presentational — verified by `tsc --noEmit`, `vite build`,
  and live visual readback (project convention, same as `zerovault-sales-landing`).
- Test runner: `vitest run` (web), `tsc --noEmit`, `vite build`.
- Delivery: ask-on-risk (default). Forecast: mostly small presentational additions; expected
  well under ~400 authored lines total.

## Objective

Raise the landing (`/`) from "explains the concept" to "shows and lets you try the product,"
and add trust + conversion elements fitting a zero-knowledge password manager delivered as a TFM.

## Scope (frontend only)

- In: landing copy/markup, new sections (how-it-works, FAQ), footer, trust markers, demo access,
  real app preview, HTML meta/OG tags, small a11y + privacy polish.
- Out: backend changes, real payment, auth logic changes beyond an optional demo-access helper.

## Constraints

- Keep the current dark cool-gray/indigo theme and component style (tokens only for color).
- No unverified competitor claims (prefer an FAQ over a comparison table unless facts are sourced).
- GitHub link assumes the repo is made PUBLIC before submission (currently private).

## Tasks

- [x] T1 — Quick wins: added `aria-hidden` to the decorative marquee; the `winxe` handle was
      removed as part of T8 (hand-drawn card replaced). (#6, #7)
- [x] T2 — Footer with real links: How it works, Pricing, FAQ, Log in, Create vault, GitHub. (#5)
- [x] T3 — "How it works" 3-step section (01/02/03) between hero and "How it stays private". (#9)
- [x] T4 — FAQ section (`id="faq"`): 5 `<details>` accordions after Pricing. (#3)
- [x] T5 — Open-source trust marker: GitHub link in nav + "built as a Master's thesis" hero line. (#4)
- [x] T6 — HTML meta + Open Graph/Twitter tags in `apps/web/index.html` + title. (#8)
- [x] T7 — "Try the demo" (#1): approach A chosen — `/login?demo=1` prefills the demo account and
      shows the credentials in a visible note. New `src/lib/demo.ts`; AuthForm `initialEmail`/
      `initialPassword` props; LoginPage reads the `demo` param. Covered by a new LoginPage test.
- [x] T8 — Real app preview (#2): the hand-drawn hero card now renders the REAL `VaultItemCard`
      component with sample data, inert (`<ul aria-hidden inert>`) — authentic and theme-synced,
      no screenshot or prod login needed.

## Decisions (resolved)

1. **Demo access (#1/#2)**: RESOLVED — user chose option A (2026-10-11): prefill `/login?demo=1`
   with the demo account and show the credentials in a visible note. Demo creds are intentionally
   public (shared throwaway demo). T8 preview uses the real `VaultItemCard` component instead of a
   screenshot, so no prod login was needed.

## Acceptance

- Landing keeps the dark theme; all new sections are responsive and legible.
- No personal handles in public copy; decorative marquee not read by screen readers.
- `index.html` has a proper description + OG/Twitter tags.
- `vitest run` green; `tsc --noEmit` and `vite build` succeed.

## Checks (status)

- [x] `npm run test -w apps/web` — 61 tests pass (added the demo-prefill LoginPage test)
- [x] `npm run typecheck -w apps/web` — clean
- [x] `npm run build -w apps/web` — OK
- [x] Live visual readback: hero + real preview, How it works, How it stays private, pricing,
      FAQ, CTA band, footer, and `/login?demo=1` all verified on the dark theme

## Progress / notes (update)

- Implemented via one delegated writer; verified by parent (test spot-check + live screenshots).
- Committed as `1c4b2dc` on `main` (7 files, +314/-31) and pushed (`766e603..1c4b2dc`).
- Deployed: Vercel rebuilt from the push; verified by Vite CSS content-hash match
  (local `index-CgTOMfg1.css` == live `assets/index-CgTOMfg1.css`).
- Files: `apps/web/index.html`, `src/lib/demo.ts` (new), `src/components/molecules/AuthForm.tsx`,
  `src/pages/LoginPage.tsx`, `src/pages/LoginPage.test.tsx`, `src/pages/LandingPage.tsx`.

## Review (RDD) and follow-up

- RDD review on `1c4b2dc` candidate: medium risk, 1 lens (`review-reliability`), APPROVED advisory-only.
- R3-001 (WARNING) FIXED in follow-up: demo mode now uses `params.get("demo") === "1"` instead of
  `params.has("demo")`, so `?demo=0`/`?demo=false` no longer enable the prefill. Added two LoginPage
  tests (`?demo=0` stays empty; no param stays empty). Suite now 63 tests green.
- R3-002 (SUGGESTION) DEFERRED: `AuthForm` seeds demo values only as initial `useState`; stale values
  if the query changes while mounted. Low impact; revisit if client-side nav into/out of demo is added.
- R3-003 (SUGGESTION) DEFERRED: no landing-page test covers the inert real `VaultItemCard` preview.
  Follow-up test idea for later.

## Progress / notes

- Branch: `main` (repo convention: main-only history). Prior landing/redesign commits:
  5f012fc (landing), f9a1ba3 (redesign), 2e8b89b (dark theme), 766e603 (legibility).
