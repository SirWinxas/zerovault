# ZeroVault — Phase 0 Scaffold

**Feature:** zerovault-phase-0-scaffold
**Created:** 2026-10-04
**Project:** ZeroVault (TFM) — `C:\Users\danie\zerovault`
**Deadline context:** MVP submission 2026-10-26.

## Objective

Stand up the local project skeleton for ZeroVault so Phase 1 (crypto core + auth)
can begin: an npm-workspaces monorepo with a running web app, an API app, a shared
types package, and Vitest wired in every package.

## Problem / Why

The repo currently has zero commits and no code — only `README.md`, `.gitignore`,
and `docs/PLAN.md`. Nothing from Phase 0 of the plan is done. Without a working,
testable skeleton there is no foundation for the crypto-first TDD work in Phase 1.

## Stack decision (settled)

TypeScript full-stack, chosen to maximize code reuse within the deadline:
- **web:** Vite + React + TS + Tailwind. Client-side crypto via native Web Crypto API.
- **api:** Express + TS + Prisma (PostgreSQL / Neon).
- **shared-types:** DTOs + Zod schemas shared by web and api.
- Tooling: npm workspaces, Vitest.

Rationale recorded in session: Web Crypto native path + first-class JS deploy on
Vercel/Railway/Neon beat C#/Blazor on delivery risk for a 23-day MVP.

## Authorized scope

- IN: local monorepo scaffold (root + 3 packages), Tailwind, Vitest + one sanity
  test per package, a minimal correct Prisma schema (User, VaultItem), `.env.example`,
  MIT LICENSE, first conventional commit on `main`.
- OUT (needs user accounts/credentials — do NOT do yet): create GitHub public repo,
  `git push`, Vercel/Railway/Neon deploy, real DB migrations against a live database.

## TDD mode

Strict TDD enabled for the project. Phase 0 is scaffolding (no business behavior),
so the TDD deliverable here is only: Vitest runs green with one trivial sanity test
per package, establishing the baseline. Real RED→GREEN→REFACTOR starts in Phase 1
with the `crypto/` core.

## Delivery strategy

`ask-on-risk` (default). Phase 0 is mostly generated/config code, well under the
~400 authored-line slice budget → single work-unit commit, no PR slicing needed.

## Tasks

- [x] **P0-1** Monorepo root: `package.json` with workspaces, base `tsconfig`,
  `.editorconfig`, MIT `LICENSE`. Route: delegated writer. DONE (commit 99dae8e).
- [x] **P0-2** `packages/shared-types`: TS package (DTOs + Zod schemas skeleton),
  build/typecheck config. Route: delegated writer. DONE (commit 99dae8e).
- [x] **P0-3** `apps/web`: Vite + React + TS + Tailwind, dev build compiles.
  Route: delegated writer. DONE — Vite 7 / React 19 / Tailwind 4.3, build PASS.
- [x] **P0-4** `apps/api`: Express + TS + Prisma; minimal schema (User, VaultItem);
  `prisma generate` works; `.env.example` with `DATABASE_URL` placeholder.
  Route: delegated writer. DONE — Express 5 / Prisma 6.19, typecheck + generate PASS.
- [x] **P0-5** Vitest wired in web + api + shared, one passing sanity test each.
  Route: delegated writer. DONE — Vitest 3, all 3 packages green.
- [x] **P0-6** First conventional commit on `main` (local, no push).
  Route: parent inline (git state). DONE — commit `99dae8e`.

### Deferred (needs user accounts/credentials — Phase 0 deploy block)

- [ ] **P0-D1** Create public GitHub repo (MIT) and `git push`.
- [ ] **P0-D2** Deploy skeleton: web on Vercel, api on Railway, DB on Neon.

### Follow-up from review (non-blocking)

- [ ] **FU-1** `packages/shared-types`: add rejection/negative-path tests for the Zod
  schemas (invalid email fails; missing required field fails; cover
  `RegisterRequestSchema` + `VaultItemDTOSchema`). Source: review-reliability
  SUGGESTION `R3-schema-negative-paths-unproved`. Non-blocking; fold into Phase 1.

## Acceptance criteria

- `npm install` at root succeeds (workspaces resolve).
- `npm run build` for web succeeds.
- api typechecks (`tsc --noEmit`) and `prisma generate` succeeds.
- `npm test` (Vitest) passes sanity tests in web + api + shared.
- One conventional commit exists on `main`; no AI attribution; nothing pushed.

## Applicable checks (run at task closure)

- Root install, web build, api typecheck + prisma generate, vitest across packages.

## Progress / evidence

- 2026-10-04: Feature doc created. Toolchain verified: Node v25.9.0, npm 11.12.1,
  git 2.53. git identity unset → set locally (email [redacted], name
  "danie" PLACEHOLDER — update before repo goes public).
- 2026-10-04: Scaffold built by delegated writer. Parent verification PASS:
  `npm test` green (web + shared seen green on re-run), `apps/api/.env` ignored,
  key files spot-checked (schema.prisma, shared-types/index.ts, api app.ts/index.ts).
  Resolved: React 19.3, Vite 7.3.6, Tailwind 4.3.3, Express 5.2.1, Prisma 6.19.3,
  Vitest 3.2.7, TS 5.9.3, Zod 4.6.5.
- 2026-10-04: First commit `99dae8e` on `main` (conventional, no AI attribution,
  no push). `.env` not staged.
- 2026-10-04: RDD on (global). `assess` → medium / `slice_budget_reached` (noise:
  5762 lines mostly package-lock.json; trigger .editorconfig). User granted review.
  Native lifecycle (lineage `review-2593abf3585dab1a`, lens review-reliability):
  verdict APPROVED, authority burned. 1 non-blocking SUGGESTION → FU-1.

## Next step

Phase 0 local scaffold COMPLETE. Two tracks remain:
1. Phase 1 — crypto core + auth (TDD, RED→GREEN→REFACTOR). This is where review value is real.
2. Deferred deploy block (P0-D1/P0-D2) when user provides GitHub/Vercel/Railway/Neon.
