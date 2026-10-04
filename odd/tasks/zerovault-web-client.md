# ZeroVault — Web Client (React)

**Feature:** zerovault-web-client
**Created:** 2026-10-04
**Project:** ZeroVault (TFM) — `C:\Users\danie\Desktop\zerovault`
**Depends on:** full backend (crypto + auth + vault) complete.

## Objective

The React web app: register/login deriving keys client-side, and a vault UI that
encrypts before upload and decrypts on read. The master password and the AES key
never leave the browser and live only in memory (never localStorage/sessionStorage).

## Zero-knowledge client flow (settled)

- **Register**: client `generateSalt()` × 2 (authSalt, encSalt); `deriveAuthHash(mp, authSalt)`;
  `deriveEncryptionKey(mp, encSalt)` (kept in memory); `POST /auth/register { email, authHash,
  authSalt, encSalt, kdfParams }`; then establish the session.
- **Login**: `GET /auth/params?email` → `{ authSalt, kdfParams }`; `deriveAuthHash(mp, authSalt)`;
  `POST /auth/login { email, authHash }` → `{ token, encSalt, kdfParams }`;
  `deriveEncryptionKey(mp, encSalt)`; hold `{ token, encryptionKey }` in memory only.
- **Vault item** plaintext = JSON `{ site, username, password }` → `encrypt(key, JSON)` →
  `{ ciphertext, iv }` sent to the API; `decrypt(key, …)` on read. Server never sees plaintext.

## Architecture

- `apps/web` React + Vite + TS + Tailwind. Container/presentational split + atomic design
  (atoms/molecules/organisms). Crypto via `@zerovault/crypto`; DTO types via `@zerovault/shared-types`.
- Encryption key held in an in-memory session store (React context), wiped on lock/logout.
- Dev: Vite proxy `/api` → `http://localhost:3000` (no CORS needed in dev). Prod: `VITE_API_URL`
  + API CORS (deploy-time backend follow-up).

## Slices (work units)

- [x] **W1** Auth foundation. DONE: `lib/api-client` (Bearer + ApiError + 204); in-memory
  `session-store` (closure, no web storage) + `SessionContext`/`useSession`; `auth-service`
  (login: params→deriveAuthHash→login→deriveEncryptionKey→session; register: 2 salts→
  register→login); atoms (Button/TextField) + molecule (AuthForm) + Login/Register/Vault
  pages + `use-auth-submit` hook; react-router with protected `/vault`; Vite `/api` proxy.
  Keys MEMORY-ONLY — 3 tests prove no `setItem`; crypto tests run in node env. 16 web tests
  (117 total). DONE.
  - DEVIATION/FU-W-crypto-alias: `@zerovault/crypto` `main` points to unbuilt `dist`, so web
    aliases it to `packages/crypto/src` in vite.config + tsconfig paths. Works; follow-up =
    align crypto `exports`→src (like shared-types) and drop the alias.
- [x] **W2** Vault UI. DONE: `vault/vault-service` (encrypt entry JSON before POST/PUT,
  decrypt on list; API only sees {ciphertext,iv}; `requireKey` throws when locked) +
  `VaultItemForm`/`VaultItemCard` (show/hide password) + `VaultList` + `VaultPage` (loads
  list, create/edit/delete reload after, Lock button). Key from in-memory session only.
  6 new tests incl. a "no plaintext in payload" assertion + create→list round-trip (node
  env). 123 tests total. DONE. (Deviations: delete has no confirm; reload-after-write
  instead of optimistic — both fine for MVP.)
- [ ] **W3** Extras: password generator, copy-to-clipboard with auto-clear, auto-lock on
  inactivity (wipe key), responsive polish.

## Testing notes

- Web Crypto (`crypto.subtle`) is reliable in Vitest's **node** environment (Node 25), not
  always in jsdom. Crypto-exercising tests use `// @vitest-environment node`; DOM/component
  tests use jsdom.
- Keys in memory only — a test must confirm nothing sensitive is written to localStorage.

## Authorized scope

- IN (W1): `apps/web/**` + minimal shared wiring. OUT: vault UI (W2), extras (W3), CORS/deploy.

## Acceptance criteria (W1)

- RED before implementation (where TDD applies to logic).
- Tests green: api-client attaches Bearer + parses errors; register/login flow derives keys,
  calls the right endpoints, stores token + key in memory (never localStorage); session lock
  wipes the key. `npm run build -w apps/web` + `npm run typecheck` + `npm test` green at root.

## Progress / evidence

- 2026-10-04: Feature doc created.
- 2026-10-04: W1 built by writer (TDD on logic). Parent reviewed session-store + auth-service:
  correct — keys memory-only (closure, lock wipes), master password never stored, encryptionKey
  is a non-extractable CryptoKey in memory, zero-knowledge flow matches the API. Re-ran:
  web build OK, root tests api 81 / web 16 / crypto 15 / shared-types 5, typecheck clean.
  Committed with ODD doc in one unit. Crypto-alias deviation logged above.

- 2026-10-04: W2 built by writer (TDD). Parent reviewed vault-service: plaintext encrypted
  before any POST/PUT (API only sees {ciphertext,iv}), decrypt on read, key from memory,
  requireKey gates locked. Re-ran: web build OK, root api 81 / web 22 / crypto 15 /
  shared-types 5, typecheck clean. Committed with ODD doc in one unit.

## Status: the app is usable end-to-end (login + encrypted vault CRUD) pending a live DB.

## Next step

W3 — password generator + copy-to-clipboard with auto-clear + auto-lock on inactivity (wipe
key) + responsive polish. Also fold in W1 follow-ups: FU-W-1 (api-client timeout/AbortController),
FU-W-2 (register two-phase 409 UX), FU-W-3 (test use-auth-submit). Then: deploy block (needs
accounts) + hardening backlog (rate-limiting, pagination) + TFM deliverables (slides, video,
README, demo account). Deadline 2026-10-26.
