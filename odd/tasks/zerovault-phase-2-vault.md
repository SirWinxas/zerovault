# ZeroVault — Phase 2: Vault CRUD (TDD, Hexagonal)

**Feature:** zerovault-phase-2-vault
**Created:** 2026-10-04
**Project:** ZeroVault (TFM) — `C:\Users\danie\Desktop\zerovault`
**Depends on:** Phase 1 crypto + auth (complete).

## Objective

CRUD for the user's encrypted vault items over the API. The server stores only
`ciphertext` + `iv` (never plaintext). Every operation is scoped to the authenticated
`userId`: a user can only list/read/update/delete their OWN items. Hexagonal, test-first.

## Security properties (must hold)

- **Zero-knowledge**: server persists `ciphertext`/`iv` as opaque strings; no plaintext.
- **Ownership isolation (authorization)**: user A can never access/modify/delete user B's
  items. Enforced by scoping every repository method by `userId`; cross-user access
  returns `VaultItemNotFoundError` (404, not 403, to avoid leaking existence).
- The `userId` comes from the verified JWT (V3 middleware), NEVER from the request body.

## Architecture (`apps/api/src/vault/`, hexagonal)

- `domain/` — `VaultItem`, `NewVaultItem`, `VaultItemUpdate`, `VaultItemNotFoundError`.
- `ports/` — `VaultRepository` (userId-scoped methods).
- `use-cases/` — `makeCreateVaultItem`, `makeListVaultItems`, `makeUpdateVaultItem`,
  `makeDeleteVaultItem` (each takes `userId` as a first-class argument).
- `adapters/` — `InMemoryVaultRepository` (tests), `PrismaVaultRepository` (V2),
  HTTP router + JWT auth middleware (V3).
- DTOs in `@zerovault/shared-types`: `CreateVaultItemRequest`, `UpdateVaultItemRequest`,
  `VaultItemResponse`.

## Slices (work units)

- [x] **V1** domain + `VaultRepository` port (userId-scoped) + 4 use cases + in-memory
  repo + shared-types DTOs (Create/Update/Response) + Vitest suite incl. cross-user
  isolation. Ownership enforced via `owned(id,userId)`; adapter returns copies (no
  external mutation of stored state). 56 api tests / 5 shared-types. DONE.
- [ ] **V2** `PrismaVaultRepository` (userId-scoped queries; update/delete return
  not-found when the row isn't owned) + fake-Prisma unit tests.
- [ ] **V3** JWT auth middleware (verify token → `req.userId`, 401 on missing/invalid) +
  vault HTTP routes (`POST/GET/PUT/DELETE /vault`) + Zod validation + composition +
  error mapping (404 for not-found/not-owned). Wire into index.ts.

## Authorized scope

- IN (V1 now): `apps/api/src/vault/**` (domain/ports/use-cases/in-memory adapter) +
  `packages/shared-types` DTO additions, with tests. OUT (V2/V3): Prisma adapter, HTTP,
  middleware, composition.

## TDD mode

Strict TDD: tests first → RED → GREEN → REFACTOR. Evidence captured.

## Acceptance criteria (V1)

- RED observed before implementation.
- Tests green: create stores item with `userId`; list returns only the caller's items;
  update/delete succeed for owned items; update/delete of another user's item →
  `VaultItemNotFoundError`; ciphertext/iv round-trip untouched.
- `npm run typecheck` + `npm test` green at package and root.

## Progress / evidence

- 2026-10-04: Feature doc created.
- 2026-10-04: V1 built by writer (TDD). Parent review of ownership isolation: correct
  (`owned(id,userId)` gates read/update/delete; listByUser filters; create seals userId
  from the arg; cross-user → VaultItemNotFoundError; adapter returns copies). Re-ran:
  root tests api 56 / web 1 / crypto 15 / shared-types 5, typecheck clean. Committed with
  ODD doc in one unit.

## Next step

V2 — `PrismaVaultRepository` (userId-scoped queries; update/delete must return not-found
when the row isn't owned — use `updateMany`/`deleteMany` with `{ id, userId }` and check
the affected count) + fake-Prisma unit tests. Then V3 (JWT middleware + routes).
