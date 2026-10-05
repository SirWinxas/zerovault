# ZeroVault — Improvements Backlog

**Feature:** zerovault-improvements
**Created:** 2026-10-05
**Project:** ZeroVault (TFM) — `C:\Users\danie\Desktop\zerovault`
**Status:** backlog (not started). Deploy is complete; these are enhancements.
**TDD:** strict for all code changes (RED → GREEN → REFACTOR).

Overlap note: some items also appear in `zerovault-hardening.md` (H2). Do the version
here and tick both; don't duplicate work.

## Priority A — quick wins before submission (high value / low cost)

- [ ] **I1 — CI (GitHub Actions).** No `.github/workflows` exists. Add `ci.yml` running
      `npm ci` → `npm run typecheck` → `npm test` on push/PR to `main` (Node 20/22).
      Shows automated quality gates. ~20 lines, no code risk.
- [ ] **I2 — API client timeout.** `apps/web/src/lib/api-client.ts` `fetch` has no
      `AbortController`/timeout → a slow/cold API hangs the UI with no feedback.
      Add a configurable timeout that aborts and surfaces a clean error. (= H2 FU-W-1.) TDD.
- [ ] **I3 — Security headers (helmet).** `apps/api/src/app.ts` only mounts `cors`+`json`.
      Add `helmet` (CSP, HSTS, X-Content-Type-Options, frameguard…). XSS is THE threat for a
      client-side-crypto manager (it can read the in-memory AES key), so this is on-thesis. TDD
      (assert headers present via supertest).
- [ ] **I4 — Railway region EU.** Infra only (no code). Service is in US West, Neon in EU
      Frankfurt → every query crosses the Atlantic (~150 ms). Move Railway service to an EU
      region to cut login latency.

## Priority B — security depth (great for the defense)

- [ ] **I5 — Master-password strength meter (zxcvbn).** At register
      (`apps/web/src/pages/RegisterPage.tsx` / `components/molecules/AuthForm.tsx`). There is
      NO account recovery by design, so a weak master = lost/compromised vault. Warn + optionally
      block very weak passwords. UX + security.
- [ ] **I6 — AAD in AES-GCM.** `packages/crypto/src/index.ts` `encrypt`/`decrypt` use no
      `additionalData`, so a malicious server could swap/relocate ciphertexts undetected.
      Bind each item with AAD.
      **Design decision first:** AAD must be known at encrypt time and stable.
        - Item `id` is server-generated AFTER encrypt on create → not available. Options:
          (a) client-generate the item id (UUID) and send it, making id usable as AAD; or
          (b) use a value the client already holds. Note the web does not currently decode
              `userId` from the JWT (it stores only the token), so userId isn't readily available
              client-side — resolve this before choosing.
      Ripples: `encrypt`/`decrypt` signatures → `apps/web/src/vault/vault-service.ts`; possibly
      the create flow and `VaultItem` model. TDD in `packages/crypto` first.

## Priority C — future work (memoria: "trabajo futuro")

- [ ] **I7 — Argon2id KDF (WASM).** Replace/offer PBKDF2-SHA256 (600k) with Argon2id
      (memory-hard, OWASP-preferred). Web Crypto lacks it → `argon2-browser` (WASM). Store the
      chosen algo + params per user (schema already has `kdfParams` JSON — extend it). Even a
      written analysis adds maturity.
- [ ] **I8 — Shared rate-limit store.** Current limiter is in-memory per-instance (H1 note);
      with >1 replica it doesn't share state → use Redis (e.g. `rate-limit-redis`).
- [ ] **I9 — Recovery mechanism without breaking zero-knowledge.** Recovery code / recovery key,
      or an encrypted vault export the user stores themselves. Biggest UX gap of the model.
- [ ] **I10 — Feature set.** 2FA (TOTP), credential sharing (encrypt to recipient public key),
      PWA/offline (was in the cut-list), vault search/filter + categories/tags, show/hide
      password toggle, copy-username.
- [ ] **I11 — Repo hygiene.** Crypto-alias cleanup (align `@zerovault/crypto` exports→src, drop
      the Vite alias in `vite.config.ts`; = H2) and pin the package manager version in
      `package.json` (`packageManager` field — Railpack warned about it).

## Suggested order

I1 → I2 → I3 → I6 (the four with best value/effort for the TFM), then I4/I5, then C as future work.
