# ZeroVault — Vault search + tags (backlog F3)

- Feature id: `zerovault-search-tags`
- Created: 2026-10-11
- Backlog ref: F3 (odd/tasks/zerovault-backlog.md) — Prio C, Effort M.
- TDD mode: strict (project). The filter is LOGIC → RED/GREEN/REFACTOR with `vitest`. Form/card/page
  markup is presentational → verified by `tsc --noEmit`, `vite build`, and component tests.
- Test runner: `vitest run` (web), `tsc --noEmit`, `vite build`.
- Delivery: ask-on-risk; push cadence per-feature (user chose push-now). Forecast: one pure filter
  module + an optional `tags` entry field + form/card/page wiring; aim < ~400 lines.

## Objective

Make a growing vault navigable: free-form tags on entries, a text search box, and tag-chip
filtering — all **client-side** over the already-decrypted items, so the zero-knowledge model is
untouched (tags live inside the encrypted blob; nothing new leaves the client).

## Scope (frontend only)

- In: optional `tags?: string[]` on `VaultEntry`; a pure `vault/vault-filter.ts` (query + tag filter);
  a search box + tag-filter chips on `VaultPage`; a tags input in `VaultItemForm`; tag chips shown
  on `VaultItemCard`. Tokens-only styling, dark theme.
- Out: backend changes; a fixed/predefined category taxonomy (we use free-form tags); and
  show/hide-password + copy-username (ALREADY implemented in `VaultItemCard`, not part of F3).

## Constraints

- 100% client-side over the in-memory `DecryptedVaultItem[]`; no new API call; `VaultEntry` is
  serialized/encrypted as today, so `tags` is zero-knowledge and backward compatible (optional).
- Keep the dark theme and component style (tokens only). Accessible search + filter controls.
- Self-contained; no new dependency.

## Decision (resolved)

**Tags model (2026-10-11):** chose **free-form tags** (user types a comma-separated list; parsed to a
de-duplicated, trimmed, lower-cased `string[]`) over a fixed category taxonomy. Rationale: flexible,
standard in password managers, and no server-side taxonomy to maintain. **Search** = case-insensitive
substring match over site, username and tags. **Tag filter** = when one or more tag chips are
selected, an item must contain ALL selected tags (AND narrowing); search text and tag filter combine
(both must match).

## Tasks

- [x] T1 — `apps/web/src/vault/vault-filter.ts` (NEW, pure): `parseTags(input: string): string[]`
      (split on commas, trim, drop empties, lower-case, de-dupe, keep order); `filterVaultItems(items,
      { query, tags }): DecryptedVaultItem[]` (case-insensitive substring over site/username/tags AND
      item contains every selected tag); `allTags(items): string[]` (sorted unique tags for the chips).
- [x] T2 — `apps/web/src/vault/vault-filter.test.ts` (NEW, RED-first): query matches site/username/tag;
      case-insensitivity; multi-tag AND; empty query+no tags returns all; `parseTags` dedupe/trim/empty;
      `allTags` sorted-unique; `decryptError` items (empty fields) handled.
- [x] T3 — `VaultEntry` gains optional `tags?: string[]` (apps/web/src/vault/vault-entry.ts). Add a
      vault-service test that `tags` survives create→list (encrypt→decrypt round-trip).
- [x] T4 — `VaultItemForm`: a "Tags (comma-separated)" field; `parseTags` on submit; include `tags`
      only when non-empty; pre-fill from `initial.tags` (joined by ", ").
- [x] T5 — `VaultItemCard`: render tags as small chips (tokens-only) when present; never affects the
      password/TOTP area.
- [x] T6 — `VaultPage`: a search input + a row of tag-filter chips (from `allTags(items)`), filtering
      `items` via `filterVaultItems` before passing to `VaultList`; show a clear empty-filter state.
      Add a focused component/page test for the search+tag filtering if feasible without heavy mocks.

## Acceptance

- Typing in search narrows the list by site/username/tag; selecting tag chips narrows further (AND);
  clearing both restores the full list. Tags round-trip through encrypt/decrypt.
- Tags only inside the ciphertext; no new network request; no plaintext leaves the client.
- Keeps the dark theme; responsive, legible, accessible. `vitest run` green; `tsc`/`vite build` OK.

## Checks (status)

- [x] `npm run test -w apps/web` — 122 passed (108 existing + 12 filter/round-trip/card + 2 form tags); parent spot-check: 122 passed
- [x] `npm run typecheck -w apps/web` — clean
- [x] `npm run build -w apps/web` — built OK
- [x] ZK readback (parent): tags live only inside the ciphertext (vault-service round-trip test asserts
      the tag text is absent from the request body); `vault-filter.ts` is a pure in-memory filter.

## Progress / notes

- Implemented via one delegated writer (sonnet), TDD strict (RED = missing module, filter tests GREEN).
- Parent addition: 2 `VaultItemForm` tags tests (parse/dedupe/lower-case on submit; omit when empty) —
  preempts the form-coverage gap the F2 review flagged for the analogous TOTP field.
- Writer deviations (accepted): empty-filter status line "No items match your search."; no VaultPage
  component test (heavy mocks; filter covered by unit tests); a selected tag whose items are all
  deleted stays active with its chip gone (minor edge).
- Status: F3 committed+pushed as `41b8d3a`. Follow-up (review findings) implemented, pending its commit.
- Branch: `main` (repo convention: main-only history). Prior: F1 `84dfc16`, F2 `e2bb10e` + follow-up `b4ac2ef`.

## Follow-up — RDD review findings on 41b8d3a (resolved)

- WARNING R3-stale-selected-tag — FIXED: `VaultPage` now derives `activeTags = selectedTags ∩ allTags(items)`
  and filters with it, so a selected tag whose last item is gone is ignored (no stuck empty list).
- SUGGESTION R3-tag-case-mismatch — FIXED (TDD): `filterVaultItems` lower-cases both selected and item
  tags for the AND check; added a case-insensitive tag-filter test (RED first).
- SUGGESTION R3-page-filter-untested — DEFERRED: a VaultPage integration test needs heavy session/vault
  mocks; the filter + form are unit-tested and the stale-tag case is now robust by construction.
- Checks after follow-up: `npm run test -w apps/web` 123 passed; typecheck clean; build OK.
- Context: `VaultEntry = { site, username, password, totp? }`; whole entry is JSON-serialized and
  AES-GCM encrypted in `vault-service.seal` → adding `tags?` is ZK + backward compatible. `VaultList`
  is a pure presentational list (no existing filter); `VaultPage` holds `items` state.
- Engram mirror: PENDING (project resolves as bitapp/claude-seo, not zerovault). Local doc is source
  of truth. Part of the F1→F5 effort (2026-10-11).
