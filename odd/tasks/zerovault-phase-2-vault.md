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
- [x] **V2** `PrismaVaultRepository` — every query scoped by `userId` (ownership):
  create; findMany(where userId, orderBy createdAt desc); findFirst(where {id,userId});
  update via updateMany(where {id,userId}) → count 0 → null, else re-read; delete via
  deleteMany(where {id,userId}) → count>0. DI'd `PrismaVaultClient`, unit-tested with a
  fake that asserts `userId` in every where. No schema change (VaultItem already existed).
  65 api tests. DONE.
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

- 2026-10-04: V2 built by writer (TDD). Parent read the adapter: every query scoped by
  userId (create/findMany/findFirst/updateMany/deleteMany); update re-reads via
  findByIdForUser; ownership asserted in tests. Re-ran: api 65 / web 1 / crypto 15 /
  shared-types 5, typecheck clean. Committed with ODD doc in one unit.

## Next step

V3 — JWT auth middleware (verify token via JwtTokenService → `req.userId`; 401 on
missing/invalid/expired) + vault HTTP routes (`POST /vault`, `GET /vault`, `PUT /vault/:id`,
`DELETE /vault/:id`) with Zod validation + composition (PrismaVaultRepository) + error
mapping (404 for VaultItemNotFoundError) + mount in index.ts. Then Phase 2 is complete.
Minor V1 follow-ups (dedupe Create/Update schema; VaultItemDTO vs VaultItemResponse) can
ride along in V3 or later.
