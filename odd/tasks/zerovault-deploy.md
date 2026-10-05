# ZeroVault — Production Deploy

**Feature:** zerovault-deploy
**Created:** 2026-10-05
**Project:** ZeroVault (TFM) — `C:\Users\danie\Desktop\zerovault`
**Deadline:** 2026-10-26

## Objective

Ship the MVP to production: web on Vercel, API on Railway, PostgreSQL on Neon.
Split origins → the browser calls the API directly using `VITE_API_URL`.

## Prerequisites found during exploration (blockers)

- **CORS missing** in the API (`apps/api/src/app.ts` only mounts `express.json` +
  `/health`). Cross-origin web→api is blocked without it.
- **No Prisma migrations** (`apps/api/prisma/` has only `schema.prisma`); the
  `db:migrate` script the README mentions does not exist.
- **`tsx` + `prisma` are devDependencies** but production runs `tsx src/index.ts`
  and needs `prisma` for `migrate deploy` / `generate` → move to dependencies.

## Slices

- [x] **D1** Repo production-readiness (local). DONE (commit `009e248`):
  - [x] CORS middleware in `app.ts`, origin from `WEB_ORIGIN` (reflects any origin
        in dev/test). TDD: RED (2 failing) → GREEN. supertest simple + preflight.
  - [x] Move `tsx` + `prisma` to `apps/api` dependencies.
  - [x] API scripts: `prisma:generate`, `db:migrate`, `db:migrate:deploy`, `db:push`,
        `postinstall` (prisma generate).
  - [x] `apps/web/vercel.json`: SPA fallback rewrite (react-router).
  - [x] Env vars documented in README (`.env.example` edits blocked by tool perms on
        `.env*`; repo already tracks `apps/api/.env.example`). Added `WEB_ORIGIN`, `VITE_API_URL`.
  - [x] Verify: typecheck + build + `prisma generate` green; tests green
        (api incl. 2 new CORS, web 46, crypto 15, shared-types 5; exit 0).
- [x] **D2** GitHub repo + push. DONE: private repo `SirWinxas/zerovault` on GitHub,
      `main` pushed. Flip to public before submission (TFM requires public).
- [x] **D3** Neon DB + migration. DONE: Neon project `zerovault` (EU Frankfurt),
      Postgres 18, db `zero_know`. Initial migration authored DB-less (`migrate diff`,
      commit `e963aeb`) and applied in prod by Railway pre-deploy.
- [x] **D4** Railway API deploy. DONE: service in project `illustrious-illumination`,
      build `prisma:generate`, pre-deploy `migrate deploy` (applied init), start
      `npm start`, healthcheck `/health`. Required envs: `DATABASE_URL`, `JWT_SECRET`,
      **`AUTH_PEPPER`** (the missing one that crashed startup until added). Live:
      `https://zerovaultweb-production.up.railway.app` → `/health` returns `{"status":"ok"}`.
      Region US West (DB in EU — cross-region latency, acceptable for demo).
- [x] **D5** Vercel web deploy. DONE: https://zerovault-tawny.vercel.app (root `apps/web`,
      `VITE_API_URL` set at build). `WEB_ORIGIN` set on Railway = that URL → CORS locked;
      login re-verified OK.
- [~] **D6** Close-out:
  - [x] End-to-end smoke test online (register → login → create entry) — passes.
  - [x] README live URLs filled (web, API, repo).
  - [x] GitHub repo flipped to **PUBLIC** (secret scan clean; only `.env.example` placeholders).
  - [ ] Register `demo@zerovault.app` / `ZeroVaultDemo2026!` via the web + add a sample entry.
  - [ ] Rotate the Neon DB password (pasted in chat) and update `DATABASE_URL` on Railway.
  - [ ] Slides + video (TFM deliverables, outside deploy scope).

## TDD mode

Strict TDD for code changes (CORS): RED → GREEN → REFACTOR.

## Authorized scope

Deploy config + the three blockers above. No feature changes. H2 hardening stays separate.

## Progress / evidence

- 2026-10-05: Feature doc created. Exploration done (build setup, env wiring, blockers).

## Next step

D1 — CORS TDD first, then deps/scripts/configs; verify and commit as one work unit.
