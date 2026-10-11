# ZeroVault — Password health dashboard (backlog F1)

- Feature id: `zerovault-password-health`
- Created: 2026-10-11
- Backlog ref: F1 (odd/tasks/zerovault-backlog.md) — Prio B, Effort M, ★ recommended for the TFM.
- TDD mode: strict (project). Health analysis is LOGIC → RED/GREEN/REFACTOR with `vitest`.
  Dashboard markup is presentational → verified by `tsc --noEmit`, `vite build`, and the
  health unit tests + a component render test.
- Test runner: `vitest run` (web), `tsc --noEmit`, `vite build`.
- Delivery: ask-on-risk (default). Forecast: one small pure-logic module + one UI organism +
  VaultPage wiring; expected well under ~400 authored lines.

## Objective

Give the signed-in user an at-a-glance view of the security health of their vault, computed
**entirely on the client** over the already-decrypted items, so the zero-knowledge model is
untouched (the server never sees plaintext, passwords, or health results).

## Scope (frontend only)

- In: a pure `vault/health.ts` module (weak + reused detection + summary), unit tests, a
  `VaultHealth` organism rendered on `VaultPage`, and the wiring. Tokens-only styling, dark theme.
- Out: backend changes, any new network call, zxcvbn dependency (that is backlog S3), and the
  "old / stale password" dimension (see decision below).

## Constraints

- 100% client-side over the in-memory `DecryptedVaultItem[]` already held by `VaultPage`.
  No new API call, no data-model change, no plaintext or derived signal leaves the client.
- Keep the current dark cool-gray/indigo theme and component style (tokens only for color).
- Self-contained heuristics (no new dependency); deterministic so they are unit-testable.
- Never render or log actual passwords in the dashboard — only counts and per-item flags.

## Decision (resolved)

**"Old / stale password" dimension (2026-10-11):** chose **Option 1** — ship F1 v1 with
**weak + reused** only. "Old" needs a last-changed timestamp the client does not have today
(`DecryptedVaultItem` has no date; the API returns `{ id, ciphertext, iv }`). Rationale: reuse
is the highest-impact finding and age is the weakest signal (NIST SP 800-63B deprecates periodic
rotation without cause). If "old" is wanted later, implement it as an **encrypted `lastChanged`
field inside the vault entry blob** (stays zero-knowledge), never by exposing the server's
`updatedAt` (that would leak per-item modification timing to the server).

## Health heuristics (v1)

- **weak(password)** = any of: length < 12; fewer than 3 of {lowercase, uppercase, digit, symbol};
  or the password is in a small bundled common-passwords set (~top 100). Empty password is weak.
- **reused** = a non-empty password whose exact value appears in 2+ items → every sharing item is
  flagged reused. Comparison is case-sensitive, exact.
- Items with `decryptError` are excluded from analysis and surfaced only as an "unreadable" count.
- Summary = totals: `{ total, weak, reused, okay }` where `okay` = items with no flag.

## Tasks

- [x] T1 — `apps/web/src/vault/health.ts`: pure `analyzeVaultHealth(items)` → per-item flags
      (`{ id, site, username, weak, reused }`) + `summary`. `isWeak` exported; reuse detection is an
      internal count map (no separate `findReused` export — minor deviation, same behavior).
- [x] T2 — `apps/web/src/vault/health.test.ts`: 11 RED-first unit tests (weak by length/charset/common,
      reused across items, decryptError excluded, empty vault, summary counts).
- [x] T3 — `apps/web/src/components/organisms/VaultHealth.tsx`: dashboard card (summary chips +
      per-item flags), tokens-only, dark theme, accessible; shows nothing sensitive (no passwords).
      + 2 render tests in `VaultHealth.test.tsx` (counts shown; no password text appears).
- [x] T4 — Wired `<VaultHealth items={items} />` into `VaultPage` after the error block and before
      the "New item" area, rendered only when `!loading`, fed by the same in-memory `items`.

## Acceptance

- Dashboard reflects weak + reused correctly over the decrypted items, client-side only.
- No password value is rendered, logged, or sent anywhere; no new network request appears.
- Keeps the dark theme; responsive and legible; a11y (labelled, not noisy to screen readers).
- `vitest run` green; `tsc --noEmit` and `vite build` succeed.

## Checks (status)

- [x] `npm run test -w apps/web` — 78 passed (65 existing + 13 new); parent spot-check re-run: 78 passed
- [x] `npm run typecheck -w apps/web` — clean
- [x] `npm run build -w apps/web` — built OK
- [x] ZK readback (parent): `health.ts` returns only booleans/counts (password used only as internal
      map key); `VaultHealth.tsx` renders site/username/flags/counts, never a password.

## Progress / notes

- Implemented via one delegated writer (sonnet), TDD strict (RED = missing module, then GREEN).
- Minor deviations from plan: empty vault with no unreadable items renders no card; unreadable items
  get a "N items could not be analyzed" line; no separate `findReused` export.
- Status: all source changes implemented and verified; NOT yet committed (awaiting user go + RDD review).
- Branch: `main` (repo convention: main-only history).
- Context (codegraph): `VaultPage` holds `items: DecryptedVaultItem[]` from `vault.list()` and
  renders `VaultList`→`VaultItemCard`. `DecryptedVaultItem = { id, site, username, password,
  decryptError? }` (apps/web/src/vault/vault-entry.ts). No timestamps on the client.
- Engram mirror: PENDING — `mem_save` returns `ambiguous_project` (offers bitapp/claude-seo, not
  zerovault). Local doc is the source of truth until the project resolves in Engram.
- Part of the F1→F5 effort requested 2026-10-11; features implemented one at a time.
