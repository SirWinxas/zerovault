# ZeroVault — Phase 1: API Auth Module (TDD, Hexagonal)

**Feature:** zerovault-phase-1-auth
**Created:** 2026-10-04
**Project:** ZeroVault (TFM) — `C:\Users\danie\Desktop\zerovault`
**Depends on:** zerovault-phase-1-crypto (done, commit d8c73c3).

## Objective

Add the API `auth` module: register and login for the zero-knowledge model, with
JWT issuance. The server never sees the master password or the encryption key; it
stores only an email, a SERVER-SIDE hash of the client-derived authHash, the two
salts, and the KDF params. Built test-first, hexagonal (ports + adapters).

## Zero-knowledge auth flow (settled)

Client derives, server verifies:
- **Register** → client generates `authSalt` + `encSalt`, derives `authHash =
  deriveAuthHash(masterPw, authSalt)`, sends `{ email, authHash, authSalt, encSalt,
  kdfParams }`. Server stores `email`, `authHashHash = hash(authHash)` (server-side),
  `authSalt`, `encSalt`, `kdfParams`.
- **Login step 1** → client sends `email`, server returns `{ authSalt, kdfParams }`
  (NOT secret) so the client can derive `authHash`.
- **Login step 2** → client sends `{ email, authHash }`. Server verifies against
  `authHashHash`; on success issues a JWT and returns `{ token, encSalt, kdfParams }`
  so the client can derive the (non-extractable) encryption key.

Why `authHashHash` (hash of the authHash, server-side): a DB leak must not reveal a
value that can be replayed to log in. `encSalt`/`authSalt` are not secret.

## Architecture (hexagonal, under `apps/api/src/auth/`)

- `domain/` — `StoredUser`, `NewUser`, errors (`EmailAlreadyRegisteredError`,
  `InvalidCredentialsError`).
- `ports/` — `UserRepository`, `Hasher`, `TokenService`.
- `use-cases/` — `makeRegisterUser`, `makeLoginUser`, `makeGetAuthParams`
  (factories taking deps = dependency inversion).
- `adapters/` — `InMemoryUserRepository` (tests), `ScryptHasher` (Node built-in
  `crypto.scrypt`, salted, timing-safe verify), `JwtTokenService` (`jsonwebtoken`).
- Prisma adapter + Express routes + composition root = Slice 2 (infra).

Shared DTOs go in `@zerovault/shared-types` (Zod + inferred types): `KdfParamsSchema`,
`RegisterRequest`, `LoginRequest`, `AuthParamsResponse`, `LoginResponse`.

## TDD mode

Strict TDD: tests first → RED → minimal GREEN → REFACTOR. RED/GREEN evidence recorded.

## Tasks (sliced into work units)

- [x] **A1** Domain + ports + 3 use cases + in-memory repo + ScryptHasher +
  JwtTokenService + shared-types DTOs + full Vitest suite (19 tests). RED observed,
  GREEN, typecheck clean. Security extras by writer: JWT algorithm pinned to HS256
  (blocks alg:none/confusion), empty-secret guard, malformed-input-safe hasher.
  DONE.
- [x] **A2** Prisma schema change (User: `authHashHash`, `authSalt`, `encSalt`,
  `kdfParams`; dropped `authHash`/`kdfSalt`) + `PrismaUserRepository` + `prisma generate`.
  Atomic create: catches Prisma `P2002` → `EmailAlreadyRegisteredError` (review R4 fixed).
  DI'd `PrismaUserClient` so it is unit-tested with a fake (no live DB). 5 new tests.
  Type-only shared-types import (dist debt still deferred to A3). DONE.
- [ ] **A3** Express routes (`POST /auth/register`, `GET /auth/params`,
  `POST /auth/login`) with Zod validation + composition root wiring real adapters +
  `JWT_SECRET` in `.env.example`.
  SHOULD (review R1 + R3-timing): enumeration hardening — uniform responses/errors and
  equalized timing (dummy verify on unknown email) so `getAuthParams`/login don't reveal
  which emails exist.

### Review follow-ups (from A1 4-lens review, lineage review-5e5f34dc5defad43, APPROVED)

- [x] **FU-A-1** (R4, resilience WARNING) → DONE in A2 (atomic create, P2002 → EmailAlreadyRegisteredError, tested).
- [ ] **FU-A-2** (R1 risk + R3 reliability, enumeration) → folded into A3 (hardening).
- [ ] **FU-A-3** (R2 readability SUGGESTION) doc-comment `StoredUser.authHashHash` /
  `NewUser.authHashHash` = "server-side hash of the client authHash; never the raw value".
- [ ] **FU-A-4** (R3 reliability SUGGESTION) add tests for the two untested defensive
  branches: JWT valid-signature-but-missing/non-string-`sub`; scrypt odd-hex-length guard.

## Authorized scope

- IN (A1 now): `apps/api/src/auth/**` (domain/ports/use-cases/adapters incl. real
  scrypt + jwt) and `packages/shared-types` DTO updates, with tests. Add deps
  `jsonwebtoken` + `@types/jsonwebtoken` to `apps/api`.
- OUT (A2/A3, later): Prisma schema/adapter, Express routes, composition root.

## Acceptance criteria (A1)

- RED observed before implementation.
- Tests green: register creates user (authHash stored only as a server-side hash,
  never plaintext); duplicate email → EmailAlreadyRegistered; login OK → token +
  encSalt + kdfParams; wrong authHash → InvalidCredentials; unknown email →
  InvalidCredentials (same error); getAuthParams returns authSalt+kdfParams;
  ScryptHasher hash/verify incl. salt randomness + timing-safe; JwtTokenService
  sign/verify round-trip + rejects tampered token; register→login end-to-end.
- `npm run typecheck` + `npm test` green at package and root.

## Notes / follow-ups

- User enumeration: login-step-1 (`getAuthParams`) and login errors can reveal which
  emails exist. MVP accepts this; hardening = deterministic fake salt for unknown
  emails + uniform errors. Tracked, not done now.
- authHash is already high-entropy (600k PBKDF2); server-side scrypt is defense in
  depth against replay on DB leak.
- **shared-types resolution debt (MUST fix in A3):** A1 made `@zerovault/shared-types`
  `exports`/`main`/`types` point to `./src/index.ts`. This works now because apps/api
  imports from it are TYPE-ONLY (erased at build). A3 will import a runtime Zod value
  (`RegisterRequestSchema`) in the Express routes; then the built `apps/api/dist` under
  plain Node cannot load a `.ts` file. Fix in A3: build shared-types to `dist` and point
  `exports` back at `dist` (+ wire the build), or run the api via `tsx` in production.

## Progress / evidence

- 2026-10-04: Feature doc created.
- 2026-10-04: A1 built by writer (TDD). Parent security review of register/login use
  cases + ScryptHasher + JwtTokenService: CORRECT (authHash never stored raw; uniform
  InvalidCredentials; timing-safe + malformed-safe verify; JWT HS256 pinned). Parent
  re-ran root `npm test` → api 19, web 1, crypto 15, shared-types 3 all green; root
  `npm run typecheck` clean. shared-types resolution debt logged above.

- 2026-10-04: A1 committed `0325d34` (`feat(api): ...`). RDD assess=HIGH (hot_path/auth),
  user GRANTED. 4-lens native review (risk/resilience/readability/reliability, lineage
  review-5e5f34dc5defad43) → APPROVED, authority burned, NO blocking corrections. 6
  advisory findings recorded as FU-A-1..4 (R4→A2, enumeration→A3, 2 minor suggestions).

- 2026-10-04: A2 built by writer (TDD). Parent review of PrismaUserRepository: correct
  (atomic create, P2002→EmailAlreadyRegisteredError, type-only shared-types import, DI'd
  for DB-less testing). Re-ran: prisma generate OK, root tests api 24 / web 1 / crypto 15 /
  shared-types 3, typecheck clean. Committed with the ODD doc in one work unit.

## Next step

A3 — Express routes (`POST /auth/register`, `GET /auth/params`, `POST /auth/login`) with
Zod validation + composition root (wire real adapters, `JWT_SECRET`) + FIX shared-types
dist resolution (first runtime Zod import) + enumeration hardening (FU-A-2). Needs a live
DB (Neon) only for end-to-end run, not for route unit tests. Deferred deploy block pending.
