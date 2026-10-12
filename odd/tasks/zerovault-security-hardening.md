# ZeroVault — Security hardening from the full-project review (2026-10-12)

- Feature id: `zerovault-security-hardening`
- Created: 2026-10-12
- Source: consolidated 4-area review (crypto+API, web client, extension, architecture+tests).
  Scope here = DEFECTS (security + correctness). Structural improvements (CI/lint, extracting shared
  client packages, atomic-design refactor, README) are NOT in this feature — see "Deferred".
- TDD mode: strict (project). Every logic fix gets a RED test first; markup/config verified by
  `tsc --noEmit`, build, and the suites.
- Test runners: `vitest run` per workspace; `tsc --noEmit`; `vite build` (web/extension).
- Delivery: per-work-unit commit on `main` (main-only repo), each reviewed (RDD) and pushed.

## Objective

Close the review's HIGH findings and the MEDIUM ones that are real bugs, without breaking existing
users or the zero-knowledge model: the server keeps seeing only ciphertext; account existence stays
unobservable; autofill never leaks a credential to the wrong origin.

## Decisions (fixed)

- **Register becomes enumeration-neutral (HIGH #1).** `/auth/register` returns the SAME response
  whether or not the email exists and does equivalent scrypt work on the "exists" path (timing parity,
  like `login` already does). Consequence: registering an existing email silently no-ops and the
  follow-up login fails with the generic error; the web client shows a generic "could not complete
  registration — if you already have an account, log in". This upholds the thesis invariant.
- **KDF policy enforced on BOTH sides (HIGH #2).** Server `KdfParamsSchema`: `iterations` in
  `[600000, 10_000_000]`, `hash === "SHA-256"`; decoy uses the same policy. Clients (web + extension)
  refuse to derive with out-of-policy params (defense against a malicious/compromised server).
- **Autofill gate (HIGH #3):** add `tldts` (public-suffix list) to the extension. Fill only when
  page host === credential host, OR page is a subdomain of the credential host AND the credential
  host is a registrable domain (not a public suffix / IP). Require `https:` (http only for
  localhost/127.0.0.1); compare port when the credential site specifies one.
- **Popup gets labels only (HIGH #4):** `ITEMS` returns `{id, site, username}`; new background
  `FILL {id, tabId}` and `COPY {id, field}` resolve the single credential in the background (origin
  check against the real `tab.url` happens there; content script keeps its gate as defense in depth).
- **Email normalized** (trim + lowercase) at the API boundary and in the decoy salt. CAVEAT: any
  pre-existing account registered with uppercase letters would no longer match (none known besides
  the lowercase demo account) — documented, acceptable for this project.
- **AAD for AES-GCM (backlog S2)** is a stored-data format change; it is T4, done LAST with a legacy
  fallback (try AAD decrypt, fall back to no-AAD, re-seal on next update) and re-confirmed before start.

## Work units / tasks

- [x] T1 — WU-A API + shared-types DONE (120 API + 7 shared-types tests; register → uniform `201 {}`;
      `createApp({env})` factory w/ Helmet, trust-proxy, CORS fail-closed, 400/404/500 handlers;
      `requireSecret(…,32)`; `normalizeEmail`; `VaultEntrySchema` + KDF bounds exported): enumeration-neutral register (+ timing parity, update the test
      that codified the 409); `KdfParamsSchema` floor/ceiling + decoy policy; `JWT_SECRET`/`AUTH_PEPPER`
      min 32 chars fail-fast; `trust proxy` (env `TRUST_PROXY_HOPS`, default 1 in production); Helmet;
      CORS fail-closed in production (require `WEB_ORIGIN`); email normalization; app-level JSON/404
      error handler; `VaultEntrySchema` (zod) added to `@zerovault/shared-types` for T2/T3.
- [x] T2 — WU-B web DONE (144 web tests; `auth/kdf-policy.ts` assertKdfPolicy before every derive;
      register mode: confirm field + `isWeak` block + `new-password`; generic register-failure copy;
      clipboard single timer; `VaultEntrySchema.safeParse` → decryptError; 401 → lock; CSP + headers in
      `vercel.json`, only external origin = the Railway API): client-side KDF policy check in `auth-service`; register mode gets confirm-password
      + weak-password block (reuse `isWeak`) + `autoComplete="new-password"`; generic register-failure
      message; clipboard single-timer fix (`clearTimeout` on each copy); `JSON.parse` → `VaultEntrySchema`
      safeParse (bad blob → `decryptError`, never a crash); 401 → lock + redirect; CSP + security headers
      in `vercel.json`.
- [x] T3 — WU-C extension DONE (43 ext tests; `tldts` public-suffix `shouldFill` + https/loopback/port/IP
      rules; `ITEMS` → labels only; background `FILL{id,tabId}`/`COPY{id,field}` resolve the single credential
      against the real `tab.url`; visible/same-form field check; `VaultEntrySchema.safeParse`; client KDF
      policy): `tldts`-based `shouldFill` (+ https/port rules) with lookalike/public-suffix
      tests; `ITEMS` labels-only; background `FILL`/`COPY` by id with origin check on real `tab.url`;
      content script requires visible/enabled/non-readonly fields (prefer inside a `<form>`); `JSON.parse`
      → `VaultEntrySchema`; client-side KDF policy check in `session.ts`.
- [ ] T4 — WU-D AAD: bind ciphertext to `{userId, itemId}` via AES-GCM `additionalData` with legacy
      fallback + re-seal; crypto tests; web + extension decrypt paths. (Re-confirm before start.)

## Deferred (improvements, not defects — from the same review)

CI/lint/format (GitHub Actions, ESLint, Prettier) · extract shared `VaultEntry`/api-client/auth-flow
packages (web↔extension duplication) · content script via `activeTab`+`executeScript` instead of
`<all_urls>` · extension clipboard clear via offscreen doc · `chrome.idle` lock · demo-account reset /
read-only · API tests included in `tsc` · README refresh · `isWeak` → zxcvbn · logger abstraction.

## Checks (status)

- [ ] `npm run test -w apps/api` · `npm run typecheck -w apps/api`
- [ ] `npm run test -w packages/shared-types` (if present) · `npm run typecheck -w packages/shared-types`
- [ ] `npm run test -w apps/web` · `npm run typecheck -w apps/web` · `npm run build -w apps/web`
- [ ] `npm run test -w apps/extension` · `npm run typecheck -w apps/extension` · `npm run build -w apps/extension`

## Progress / notes

- Branch: `main`. Prior: F1–F5 complete (`84dfc16`…`126fb95`).
- Engram: mirrored via CLI `engram save --project zerovault` (MCP cwd=HOME cannot auto-resolve).
