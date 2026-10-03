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

- [ ] **P0-1** Monorepo root: `package.json` with workspaces, base `tsconfig`,
  `.editorconfig`, MIT `LICENSE`. Route: delegated writer.
- [ ] **P0-2** `packages/shared-types`: TS package (DTOs + Zod schemas skeleton),
  build/typecheck config. Route: delegated writer.
- [ ] **P0-3** `apps/web`: Vite + React + TS + Tailwind, dev build compiles.
  Route: delegated writer.
- [ ] **P0-4** `apps/api`: Express + TS + Prisma; minimal schema (User, VaultItem);
  `prisma generate` works; `.env.example` with `DATABASE_URL` placeholder.
  Route: delegated writer.
- [ ] **P0-5** Vitest wired in web + api + shared, one passing sanity test each.
  Route: delegated writer.
- [ ] **P0-6** First conventional commit on `main` (local, no push).
  Route: parent inline (git state).

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
  git 2.53. git identity unset → to be set locally before P0-6.

## Next step

Delegate P0-1..P0-5 to one bounded writer; parent verifies, then P0-6 commit.
