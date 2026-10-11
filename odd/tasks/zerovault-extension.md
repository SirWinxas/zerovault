# ZeroVault — Browser extension + autofill (backlog F4)

- Feature id: `zerovault-extension`
- Created: 2026-10-11
- Backlog ref: F4 (odd/tasks/zerovault-backlog.md) — Prio F, Effort L. User chose the FULL extension
  with autofill (2026-10-11).
- TDD mode: strict (project). Pure logic (origin matching, login-form detection, field selection) →
  RED/GREEN with `vitest`. Extension wiring/markup is verified by a successful MV3 build + manual
  load-unpacked in Chrome (no in-browser E2E in this environment).
- Delivery: sliced into per-work-unit commits on `main` (repo is main-only). Each slice is reviewed
  (RDD) and pushed on its own. The extension does NOT deploy to Vercel; it is loaded unpacked / Web Store.

## Objective

A Chrome (MV3) browser extension that logs in with the master password, decrypts the vault
**client-side** (zero-knowledge: the service worker/popup derive the key and decrypt; the server only
ever sees ciphertext), shows the credentials for the active site, and autofills login forms.

## Decisions (fixed defaults — technical, not product)

- Package: new workspace `apps/extension`. Target: Chrome, Manifest V3.
- Auth model: the extension has its OWN login (email + master password in the popup) — Bitwarden-style.
  It reuses `@zerovault/crypto` (`deriveAuthHash`, `deriveEncryptionKey`, `decrypt`) and
  `@zerovault/shared-types`, and talks to the same API (`/auth/params`, `/auth/login`, `/vault`).
- CORS: declare the API host in `host_permissions` so the popup/service-worker fetches cross-origin
  without any backend/CORS change. API base from `VITE_API_URL` at build time (as apps/web does).
- Build tooling: Vite 7 + `@crxjs/vite-plugin` (MV3). If that does not build cleanly on Vite 7 after a
  bounded attempt, fall back to a minimal manual Vite multi-entry (popup ES, background ES module
  service worker, content script as a classic IIFE bundle). Acceptance is a loadable unpacked build.
- Session: the derived AES key lives only in the service worker's in-memory session (never persisted);
  an idle/lock timeout re-prompts for the master password. (Refined in the auth slice.)

## Slices / tasks

- [x] T1 — Slice 1 (scaffold) DONE: `apps/extension` workspace — package.json, tsconfig, Vite config,
      MV3 `manifest` (action/popup, background service worker, a content-script stub matching
      `<all_urls>`, `permissions: ["storage","activeTab","scripting"]`, `host_permissions` for the API),
      a React popup shell, background + content stubs. `npm run build -w apps/extension` produces a
      loadable `dist/` with a valid `manifest.json`. A short README on loading unpacked.
- [x] T2 — Slice 2 (popup auth + vault) DONE: popup login (email + master password) → derive authHash,
      POST /auth/login, derive encryptionKey, GET /vault, decrypt items. A pure `origin`/site-matching
      helper (map a vault item's `site` to a hostname and match the active tab) with TDD. List the
      active site's credentials with copy username/password (auto-clear like the web app). Lock button.
- [ ] T3 — Slice 3 (content script + autofill): detect login forms (username/email + password fields),
      request credentials for the page origin from the background, and fill them; handle the common
      cases (single form; basic multi-field). Pure detection/field-selection logic with TDD. Never
      expose secrets to the page beyond filling the input values on user action.
- [ ] T4 — Slice 4 (polish): idle lock/timeout, error + empty states, dark-theme parity with the web
      UI (reuse tokens), and the load-unpacked README + notes on Web Store packaging.

## Constraints

- Zero-knowledge preserved: key derivation + decryption happen in the extension; the server only sees
  ciphertext; no plaintext/credential leaves the client except filling a field on the user's action.
- No backend changes (host_permissions handles cross-origin). No secrets in logs or URLs.
- Reuse `@zerovault/crypto` / `@zerovault/shared-types`; do not cross-import apps/web internals.

## Acceptance

- Build: `npm run build -w apps/extension` succeeds and the `dist/` loads unpacked in Chrome.
- Popup logs in, lists the active site's credentials, copies them; content script autofills a login
  form on a real page (manually verified by the user). Pure logic unit-tested; `tsc`/build green.
- Zero-knowledge intact; no new backend route or CORS change.

## Checks (status)

- [x] `npm run build -w apps/extension` — Slice 1: builds; `dist/` is a valid MV3 extension (parent spot-check: built)
- [x] `npm run typecheck -w apps/extension` — clean
- [x] `npm run test -w apps/extension` — Slice 2: 8 match tests pass (parent spot-check: 8 passed)
- [ ] Manual: load unpacked in Chrome (user) — login flow not yet exercised against the live API
- [x] Sanity: `npm run build -w apps/web` still succeeds (web not broken)

## Slice 2 notes (popup auth + vault)

- Session lives ONLY in the background service worker (`{ email, token, key, items }`); the AES key is
  non-extractable and never persisted — an MV3 worker restart drops it and requires re-login (intentional).
- Messaging (types in `src/lib/messages.ts`): LOGIN / STATE / ITEMS / LOCK; background ignores messages
  whose `sender.id` is not this extension. Login errors are generic (never echo secrets).
- Popup: login form when locked; when unlocked, lists the active tab's credentials ("This site" first via
  `matchesTab`) then the rest; passwords masked + copy-only with a "copied" hint; Lock button.
- `src/vault/match.ts` (pure, 8 TDD tests): `siteHostname` normalizes scheme/path/port/www + rejects
  non-http(s); `matchesTab` = equal host or subdomain on a dot boundary.
- host_permissions tightened to `https://zerovaultweb-production.up.railway.app/*` + `http://localhost:3000/*`
  (resolves the Slice-1 wildcard-host finding). API base from `VITE_API_URL`, default prod; dev build needs
  `VITE_API_URL=http://localhost:3000`.
- Status: Slice 2 implemented + verified (build/typecheck/tests); runtime login NOT yet tested in Chrome.
  NOT yet committed (awaiting RDD review + commit).

## Progress / notes

- Slice 1 (scaffold) done via one delegated writer (sonnet). Build tooling: `@crxjs/vite-plugin` 3.0.0
  on Vite 7 (built first try; no manual fallback needed). `dist/` ignored by root `.gitignore`.
- Manifest: MV3, popup `index.html`, background service worker (module), one `<all_urls>` content-script
  stub; permissions storage/activeTab/scripting; host_permissions `https://*.up.railway.app/*` +
  `http://localhost:*/*`. Popup is a minimal React shell (sign-in placeholder). No icons yet.
- TODO (later slice): swap the wildcard Railway host for the real API host if we want to tighten it.
- Status: Slice 1 implemented + verified; NOT yet committed (awaiting RDD review + commit).
- Branch: `main` (repo convention: main-only history). Prior features: F1 `84dfc16`, F2 `e2bb10e`+`b4ac2ef`,
  F3 `41b8d3a`+`8f2da51`.
- Engram mirror: PENDING (project resolves as bitapp/claude-seo, not zerovault). Local doc is source of truth.
- Part of the F1→F5 effort (2026-10-11). User chose full extension + autofill. Done slice by slice.
