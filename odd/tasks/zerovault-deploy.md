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

- [ ] **D1** Repo production-readiness (local):
  - [ ] CORS middleware in `app.ts`, origin from `WEB_ORIGIN` (defaults to reflect
        any origin in dev/test). TDD.
  - [ ] Move `tsx` + `prisma` to `apps/api` dependencies.
  - [ ] API scripts: `prisma:generate`, `db:migrate:deploy` (`prisma migrate deploy`),
        `db:push`.
  - [ ] `apps/web/vercel.json`: SPA fallback rewrite (react-router) + build wiring.
  - [ ] `.env.example` files: API `WEB_ORIGIN`, web `VITE_API_URL`.
  - [ ] Verify: typecheck + test + build green; local prod boot `/health` ok.
- [ ] **D2** Public GitHub repo + push (gh, account SirWinxas).
- [ ] **D3** Neon DB → `DATABASE_URL`; generate initial migration locally, commit.
- [ ] **D4** Railway API deploy: env (`DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN`),
        build `prisma generate`, release `prisma migrate deploy`, start `npm start`,
        healthcheck `/health`. → API URL.
- [ ] **D5** Vercel web deploy: root `apps/web`, `VITE_API_URL`=API URL. → web URL.
        Then set `WEB_ORIGIN`=web URL on Railway and redeploy.
- [ ] **D6** Smoke-test online, seed `demo@zerovault.app`, fill README TBDs.

## TDD mode

Strict TDD for code changes (CORS): RED → GREEN → REFACTOR.

## Authorized scope

Deploy config + the three blockers above. No feature changes. H2 hardening stays separate.

## Progress / evidence

- 2026-10-05: Feature doc created. Exploration done (build setup, env wiring, blockers).

## Next step

D1 — CORS TDD first, then deps/scripts/configs; verify and commit as one work unit.
