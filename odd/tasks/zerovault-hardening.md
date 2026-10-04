# ZeroVault — Hardening & Test Backlog

**Feature:** zerovault-hardening
**Created:** 2026-10-04
**Project:** ZeroVault (TFM) — `C:\Users\danie\Desktop\zerovault`
**Depends on:** full app complete (backend + web).

## Objective

Close the non-blocking follow-ups surfaced by the RDD reviews, prioritised by impact,
before/alongside deploy. Keep everything TDD'd and reviewed.

## Slices

- [x] **H1** Backend hardening. DONE:
  - **Rate-limiting (FU-A-7)**: `express-rate-limit` 8.7 — `createAuthRateLimiter` applied in
    `buildAuthRouter` before the auth routes (default 20/min/IP, 429 TooManyRequests; in-memory
    per-instance store noted). Cuts the login scrypt-amplification DoS.
  - **Pagination/cap (FU-V-1)**: `listByUser(userId,{limit,offset})`; list use case clamps
    limit→[1,100] default 50, offset≥0; in-memory slices sorted desc, Prisma take/skip;
    `GET /vault?limit&offset` Zod-coerced (400 on bad values). Response stays an array →
    no web change. 89 api tests (155 total). DONE.
- [ ] **H2** Web resilience + test gaps: FU-W-1 (api-client timeout/AbortController),
  FU-W-2 (register two-phase 409 UX), FU-W-3/5/6/7 + FU-A-4/6 + FU-V-2/3 tests, crypto-alias
  cleanup (align `@zerovault/crypto` exports→src, drop the Vite alias).

## H1 design (settled)

- **Rate-limit**: `express-rate-limit` middleware applied in the auth router composition,
  BEFORE the routes. Defaults: `windowMs 60_000`, `max 20` per IP; over-limit → `429
  { error: "TooManyRequests" }`. Configurable via params. In-memory store (single-instance
  MVP; note it does not share state across instances).
- **Pagination**: `VaultRepository.listByUser(userId, { limit, offset })`. The list use case
  clamps `limit` to `[1, 100]` (default 50) and `offset >= 0` (default 0). In-memory slices
  the sorted array; Prisma uses `take`/`skip` with `orderBy createdAt desc`. `GET /vault`
  reads optional `?limit`/`?offset` (Zod-coerced); response stays `VaultItemResponse[]`.
  Web `vault-service.list()` keeps calling `GET /vault` (gets the default first page) — no
  web change in H1.

## Authorized scope

- IN (H1): `apps/api/**` only (auth composition + rate-limit middleware; vault port +
  in-memory & Prisma adapters + list use case + router + composition), with tests. Add
  `express-rate-limit`. OUT: web changes (H2), the other follow-ups (H2).

## TDD mode

Strict TDD: tests first → RED → GREEN → REFACTOR.

## Acceptance criteria (H1)

- RED before implementation.
- Rate-limit: a limiter with a low `max` returns 429 after the threshold (supertest).
- Pagination: `listByUser` respects limit/offset (in-memory); the use case clamps limit to
  the cap; `GET /vault?limit&offset` passes through; existing vault tests still pass.
- `npm run typecheck` + `npm test` green at root; `prisma generate` still OK.

## Progress / evidence

- 2026-10-04: Feature doc created.
- 2026-10-04: H1 built by writer (TDD). Parent reviewed rate-limit wiring + pagination clamp.
  Re-ran: api 89 / web 46 / crypto 15 / shared-types 5, typecheck clean, prisma generate OK.
  Committed with ODD doc in one unit.

## Next step

H2 — web resilience + test gaps: FU-W-1 (api-client AbortController/timeout), FU-W-2 (register
two-phase 409 UX), FU-W-3/5/6/7 + FU-A-4/6 + FU-V-2/3 tests, crypto-alias cleanup. Then the
deploy block + TFM deliverables remain.
