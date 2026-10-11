# ZeroVault — TOTP generator (backlog F2)

- Feature id: `zerovault-totp`
- Created: 2026-10-11
- Backlog ref: F2 (odd/tasks/zerovault-backlog.md) — Prio C, Effort M.
- TDD mode: strict (project). TOTP + Base32 are LOGIC → RED/GREEN/REFACTOR with `vitest`,
  using RFC 6238 / RFC 4648 test vectors. Form/card markup is presentational → verified by
  `tsc --noEmit`, `vite build`, and the unit/component tests.
- Test runner: `vitest run` (web), `tsc --noEmit`, `vite build`.
- Delivery: ask-on-risk (default). Push cadence for F1–F5: per-feature (user chose push-now).
  Forecast: one pure TOTP module + an optional entry field + form/card wiring; aim < ~400 lines.

## Objective

Let a vault item optionally hold a TOTP (2FA) secret and show the current 6-digit code with a
countdown, generated **entirely on the client**. The secret is stored INSIDE the encrypted entry
blob, so the zero-knowledge model is untouched (the server still only sees `{ ciphertext, iv }`).

## Scope (frontend only)

- In: a pure `vault/totp.ts` (Base32 decode + RFC 6238 TOTP + remaining-seconds), unit tests,
  an optional `totp` field on `VaultEntry`, a TOTP input in `VaultItemForm`, and a live code +
  countdown + copy in `VaultItemCard`. Tokens-only styling, dark theme.
- Out: backend changes, `otpauth://` URI parsing and non-standard params (see decision), QR-code
  scanning/import, and storing TOTP as a separate item kind.

## Constraints

- 100% client-side; the secret lives only inside the AES-GCM ciphertext (never in plaintext,
  never in a URL/log). No new API call; `VaultEntry` is serialized/encrypted as today.
- Backward compatible: `totp` is OPTIONAL; existing entries without it keep working, and the
  decrypt-error fallback item simply has no `totp`.
- Self-contained (no new dependency). Web Crypto `crypto.subtle` HMAC-SHA1 for the code.
- Keep the current dark theme and component style (tokens only for color).

## Decision (resolved)

**TOTP input/params (2026-10-11):** chose **Base32 secret with standard params (SHA-1, 6 digits,
30s period)**. Rationale: covers ~99% of real services, matches Effort M, keeps the logic small
and fully testable against RFC 6238 vectors. Accept the secret leniently (strip spaces, upper-case,
tolerate missing padding) and validate it is Base32 before storing; reject invalid input with an
inline error. Full `otpauth://` URI support (custom digits/period/algorithm, e.g. Steam, 8 digits,
SHA-256) is a documented FUTURE extension, not in F2.

## TOTP spec (v1)

- Algorithm: RFC 6238, HMAC-SHA1, 6 digits, 30s time step, Unix time, dynamic truncation (RFC 4226).
- Secret: RFC 4648 Base32 (A–Z, 2–7), case-insensitive, spaces ignored, padding optional.
- Code is derived from `Date.now()`; `totpRemainingSeconds()` drives the countdown.

## Tasks

- [x] T1 — `apps/web/src/vault/totp.ts` (NEW, pure): `decodeBase32(secret): Uint8Array`,
      `isValidBase32Secret(secret): boolean`, `normalizeSecret(secret): string`,
      `generateTotp(secret, { nowMs?, digits?, periodSeconds? }): Promise<string>` (async; Web Crypto
      HMAC-SHA1), `totpRemainingSeconds(nowMs?, periodSeconds?): number`. No logging of the secret.
- [x] T2 — `apps/web/src/vault/totp.test.ts` (NEW, RED-first): RFC 4648 Base32 decode vectors;
      RFC 6238 code vectors (secret ASCII "12345678901234567890" = Base32
      "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"): T=59s→"287082", T=1111111109→"081804",
      T=1234567890→"005924", T=2000000000→"279037"; invalid/empty secret rejected; remaining-seconds
      boundaries (0/29/30→correct wrap).
- [x] T3 — `VaultEntry` gains optional `totp?: string` (apps/web/src/vault/vault-entry.ts). Confirm
      `vault-service.seal`/`list` carry it transparently (JSON round-trip) — add a vault-service test
      that a `totp` field survives encrypt→decrypt.
- [x] T4 — `VaultItemForm`: add an optional "2FA secret (TOTP)" field; normalize+validate on submit,
      inline error on invalid Base32; include `totp` in the submitted entry only when non-empty.
- [x] T5 — `VaultItemCard`: when `item.totp` is set, show the live 6-digit code (formatted "### ###"),
      a 30s countdown, and a copy button; regenerate per period via a timer; never render the secret.

## Acceptance

- A stored Base32 secret produces the correct RFC 6238 code; countdown updates and wraps each period.
- Secret only ever inside the ciphertext; no secret/code in any URL, log, or network request.
- Invalid secret is rejected in the form with a clear message; empty TOTP keeps items unchanged.
- Keeps the dark theme; responsive, legible, accessible. `vitest run` green; `tsc`/`vite build` OK.

## Checks (status)

- [x] `npm run test -w apps/web` — 103 passed (78 existing + 25 new); parent spot-check re-run: 103 passed
- [x] `npm run typecheck -w apps/web` — clean
- [x] `npm run build -w apps/web` — built OK
- [x] ZK readback (parent): `totp.ts` logs nothing and uses a generic error message (no secret text);
      `VaultItemCard` renders only the derived code + countdown, never the secret; timer guarded by
      `totpSecret` and cleared on unmount.

## Progress / notes

- Implemented via one delegated writer (sonnet), TDD strict (RED = missing module, 21 totp tests GREEN).
- Writer fix: `decodeBase32` returns `Uint8Array<ArrayBuffer>` so `crypto.subtle.importKey` accepts it.
- Status: F2 committed+pushed as `e2bb10e`. Follow-up (review findings) implemented, pending its own commit.
- Branch: `main` (repo convention: main-only history). F1 committed+pushed as `84dfc16`.

## Follow-up — RDD review findings on e2bb10e (resolved)

- WARNING R3-validator-accepts-unusable-key — FIXED: `isValidBase32Secret` now also requires
  `decodeBase32(secret).length > 0`, so a too-short secret (e.g. 1 char) is rejected at the form.
  RED test added (`isValidBase32Secret("A")` false, `"ME"` true).
- WARNING R3-form-validation-untested — FIXED: new `VaultItemForm.test.tsx` with 4 tests (normalized
  secret submitted; invalid secret shows alert + blocks submit; empty field omits `totp`; clearing an
  initial `totp` omits it).
- SUGGESTION R3-card-stale-state — FIXED: the card effect resets `code`/`totpInvalid` at start so a
  stale code is not shown when the secret changes on a mounted card.
- Parent catch: the writer recreated `VaultItemForm.test.tsx` and dropped 2 pre-existing tests
  (form render/submit + password-generator length); both RESTORED alongside the 4 new TOTP tests.
- Checks after follow-up: `npm run test -w apps/web` 108 passed; typecheck clean; build OK.
- Context (codegraph): `vault-service.seal` = `encrypt(key, JSON.stringify(entry))`; `list` does
  `JSON.parse(decrypt(...)) as VaultEntry` → adding optional fields to `VaultEntry` is ZK and
  backward compatible. `crypto.subtle` HMAC-SHA1 is available (same env as encrypt/decrypt tests).
- Engram mirror: PENDING (project resolves as bitapp/claude-seo, not zerovault). Local doc is source
  of truth. Part of the F1→F5 effort (2026-10-11), features done one at a time.
