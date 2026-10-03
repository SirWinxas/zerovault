# ZeroVault — Phase 1: Crypto Core (TDD)

**Feature:** zerovault-phase-1-crypto
**Created:** 2026-10-04
**Project:** ZeroVault (TFM) — `C:\Users\danie\Desktop\zerovault`
**Depends on:** zerovault-phase-0-scaffold (done, commits 9e06700 + 8d18086).

## Objective

Build the pure, framework-agnostic crypto core (`packages/crypto`) that makes
ZeroVault zero-knowledge: derive keys from the master password client-side and
encrypt/decrypt vault data with AES-GCM. The master password and the encryption
key never leave the client and are never serialized. Built strictly test-first.

## Why

This is the security heart of the product. Everything else (auth, vault CRUD,
web UI) depends on this being correct and provably zero-knowledge. TDD here is
non-negotiable: the cryptographic contract must be externally asserted.

## Design (settled)

- Runtime: **Web Crypto API** (`globalThis.crypto.subtle`) — native in Node 25
  (so Vitest node env can run it) and in browsers (same code ships to `apps/web`).
- KDF: **PBKDF2-HMAC-SHA256, 600_000 iterations** (OWASP 2023 guidance). Argon2id
  noted as a future hardening (needs WASM; out of scope now).
- **Separate salts**: one for the encryption key, one for the auth hash, so a
  server-side authHash leak cannot derive the encryption key.
- Encryption key: **AES-256-GCM**, `extractable: false`, usages `encrypt`/`decrypt`.
- IV: **12 random bytes per encryption** (never reused).
- Transport/storage encoding: **base64** for salts, IV, ciphertext, authHash.

### API surface (`packages/crypto/src/index.ts`)

- `DEFAULT_KDF_PARAMS: { iterations: 600000, hash: "SHA-256" }`
- `generateSalt(bytes=16): Uint8Array` · `generateIv(): Uint8Array` (12 bytes)
- `toBase64(bytes): string` · `fromBase64(b64): Uint8Array`
- `deriveEncryptionKey(masterPassword, salt, params?): Promise<CryptoKey>` (non-extractable)
- `deriveAuthHash(masterPassword, salt, params?): Promise<string>` (base64; separate salt)
- `encrypt(key, plaintext): Promise<{ ciphertext: string; iv: string }>`
- `decrypt(key, { ciphertext, iv }): Promise<string>`

## TDD mode

Strict TDD. Order: write failing tests → observe RED → minimal implementation →
GREEN → REFACTOR. RED and GREEN evidence recorded; no invented evidence.

## Tasks

- [x] **P1-1** `packages/crypto` skeleton (package.json `@zerovault/crypto`,
  tsconfig with DOM lib, vitest config). DONE.
- [x] **P1-2 (RED)** Crypto contract tests written first; RED observed — 15 tests
  failed ("generateSalt is not a function", etc.) with only interfaces present. DONE.
- [x] **P1-3/P1-4 (GREEN+REFACTOR)** `src/index.ts` implemented; 15/15 GREEN.
  NOTE/deviation: writer produced the tidy implementation in ONE pass (combined
  GREEN+REFACTOR), so there was no separate minimal-GREEN run before refactor. The
  test-first invariant held (RED captured before any implementation). DONE.
- [ ] **P1-5** Work-unit commit (conventional) incl. this ODD doc; then RDD
  assess/consent (crypto = expect medium/high → relay consent to user).

## Authorized scope

- IN: `packages/crypto` pure module + its tests only.
- OUT (later Phase 1 tasks, not now): API `auth` module, JWT, web register/login,
  wiring `@zerovault/crypto` into `apps/web`, schema change for separate salts.

## Acceptance criteria

- All crypto tests green in Vitest; RED was observed before implementation.
- Encryption key non-extractable; no plaintext/master-password/key material serialized.
- `npm run typecheck` and `npm test` pass for the package and at root.

## Notes / follow-ups

- User.kdfSalt (single) in the Prisma schema must become TWO salts (auth + enc)
  when the auth module is built; the crypto core stays salt-agnostic.
- Server should additionally hash the received authHash server-side (auth module).

## Progress / evidence

- 2026-10-04: Feature doc created. Design settled. Delegated TDD to one writer.
- 2026-10-04: `packages/crypto` built test-first. RED captured (15 failing), then
  15/15 GREEN. Parent security review of `src/index.ts`: CORRECT — non-extractable
  AES-256-GCM key (deriveKey extractable=false), non-extractable PBKDF2 base key,
  separate salts, random 12-byte IV per encrypt, no Buffer (cross-env), TextDecoder
  fatal=true. Parent read the test file: all critical properties genuinely asserted
  (key.extractable===false + exportKey rejects; wrong-key rejects; GCM tamper
  rejects; fresh-IV; determinism; auth-hash salt/pw/iteration sensitivity).
  Parent re-ran tests: 15/15 PASS. `typecheck` clean at package + root.
  Extras added by writer: tamper test, unicode round-trip, algorithm/usages checks.
  Minor optional hardening (not blocking): `Object.freeze(DEFAULT_KDF_PARAMS)`.

## Next step

P1-5: work-unit commit (crypto package + this doc + package-lock), then RDD
assess/consent. After that, the rest of Phase 1: API `auth` module + web login flow
(separate features), where `@zerovault/crypto` gets wired in.
