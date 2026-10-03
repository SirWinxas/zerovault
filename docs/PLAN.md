# ZeroVault — 24-day plan

**Start:** 2026-10-02 · **Deadline:** 2026-10-26 (submission form).
Scope = MVP of a zero-knowledge password manager (web, single user). No sharing, no 2FA, no browser extension, no account recovery.

## Guiding rules

- The crypto core is built **test-first** (TDD): write the failing test, then the code.
- Hexagonal only in the API `vault`/`auth` domains; container-presentational + atomic design on the web.
- Deploy early (end of Phase 0) so "it runs in production" is never a last-day risk.
- Keep every secret out of the repo (`.env` is git-ignored; `.env.example` is committed).

## Phase 0 — Setup (Oct 2–5)

- [ ] `git init`, public repo on GitHub, MIT license, `.gitignore`.
- [ ] npm workspaces monorepo: `apps/web`, `apps/api`, `packages/shared-types`.
- [ ] `apps/web`: Vite + React + TS + Tailwind running.
- [ ] `apps/api`: Express + TS + Prisma; connect to Neon PostgreSQL.
- [ ] Vitest wired in both apps.
- [ ] First deploy skeleton live: web on Vercel, api on Railway (even a "hello world").

## Phase 1 — Crypto core + Auth (Oct 6–12)

- [ ] `crypto/` pure module (TDD):
  - [ ] PBKDF2 key derivation (auth hash + encryption key, separate salts).
  - [ ] AES-GCM encrypt/decrypt (random IV per call).
  - [ ] Tests: encrypt→decrypt == original; wrong key fails; same plaintext → different ciphertext; master password never serialized.
- [ ] API `auth` module: register (stores email, authHash, kdfSalt, params), login → JWT.
- [ ] Web register/login flow; derive keys client-side; keep encryption key in memory only.

## Phase 2 — Vault + UX (Oct 13–19)

- [ ] API `vault` module: CRUD of `VaultItem` (userId, ciphertext, iv) — server never sees plaintext.
- [ ] Web vault: list / create / edit / delete, encrypting before upload and decrypting on read.
- [ ] Password generator (length + character sets).
- [ ] Copy to clipboard with auto-clear.
- [ ] Auto-lock on inactivity (wipe key from memory).
- [ ] Atomic-design components + basic responsive layout.

## Phase 3 — Deploy, docs & submission (Oct 20–26)

- [ ] Final production deploy; smoke-test the full flow online.
- [ ] Seed a `demo@zerovault.app` account; put its URL + master password in the README.
- [ ] Finalize README (fill all TBD URLs).
- [ ] Slides (~8).
- [ ] Video (~5 min) — screen capture of the real flow; show the DB holds only ciphertext.
- [ ] Submit via the course form.
- [ ] Buffer for bugfixes.

## Delivery checklist (maps to the TFM requirements)

- [ ] Complete `README.md` (description, stack, install/run, structure, features, test account).
- [ ] Public GitHub repository.
- [ ] Deployment live, URL in README.
- [ ] Slides with a public URL.
- [ ] Video (mandatory screen capture) with a public URL.
- [ ] Test user + master password in README and in the submission form.
- [ ] Submitted before **2026-10-26**.

## Cut list (drop these first if time runs short, in this order)

1. Full offline/PWA sync → online-only is fine.
2. Auto-lock → manual lock button instead.
3. Notes field → site/username/password only.
