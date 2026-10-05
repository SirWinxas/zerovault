# ZeroVault — Consolidated Modifications Backlog

**Created:** 2026-10-05
**Purpose:** single register of every proposed modification, deduplicated, to **assess later**.
Status for all items below: **TO ASSESS** (no decision made yet).
Detail lives in: `zerovault-hardening.md` (H*/FU-*), `zerovault-improvements.md` (I*, market M*).
Deploy itself is complete (`zerovault-deploy.md`).

Legend — Priority: **A** quick win for the TFM · **B** high value · **C** nice-to-have · **F** future work.
Effort: **S** small · **M** medium · **L** large. ★ = recommended for the TFM.

## A. Robustness & tests

| ID | Modification | Prio | Effort | Sources |
| -- | ------------ | ---- | ------ | ------- |
| R1 | API client timeout / AbortController (hung request → clean error) | A | S | I2, FU-W-1 |
| R2 | Register two-phase 409 UX (email already registered) | B | S | FU-W-2 |
| R3 | Web test gaps | B | M | FU-W-3/5/6/7 |
| R4 | Auth test gaps: untested defensive paths + assert 400 `details` shape | B | S | FU-A-4, FU-A-6 |
| R5 | Vault test gaps | B | S | FU-V-2/3 |
| R6 | shared-types negative/rejection (Zod) tests | B | S | FU-1 |

## B. Security

| ID | Modification | Prio | Effort | Sources |
| -- | ------------ | ---- | ------ | ------- |
| S1 ★ | Security headers / `helmet` + CSP (XSS is the key threat for client-side crypto) | A | S | I3 |
| S2 ★ | AAD in AES-GCM (bind ciphertext to item id/user; stops swap/relocation) | B | M | I6 |
| S3 | Master-password strength meter (zxcvbn) — no recovery, so weak master = lost vault | B | S | I5 |
| S4 | Argon2id KDF (Bitwarden default, OWASP-preferred; WASM) | B/C | M | I7, M3 |
| S5 | Secret-Key / two-secret model (1Password-style) — weak/stolen master alone can't decrypt | C | L | M4 |
| S6 ★ | HIBP breach check via k-anonymity (send 5-char hash prefix; stays zero-knowledge) | B | S/M | M1 |
| S7 | Shared rate-limit store (Redis) — current limiter is in-memory per-instance | C | M | I8 |

## C. Infra / DevEx / quality

| ID | Modification | Prio | Effort | Sources |
| -- | ------------ | ---- | ------ | ------- |
| D1 ★ | CI (GitHub Actions: typecheck + test on push/PR) | A | S | I1 |
| D2 | Railway service to EU region (match Neon; cut ~150 ms/query) | A | S | I4 |
| D3 | Crypto-alias cleanup (exports→src, drop Vite alias) + pin `packageManager` | C | S | I11, hardening |

## D. Features

| ID | Modification | Prio | Effort | Sources |
| -- | ------------ | ---- | ------ | ------- |
| F1 ★ | Password health dashboard (weak/reused/old) — client-side, stays zero-knowledge | B | M | M2 |
| F2 | TOTP generator (store encrypted TOTP secrets, show codes) | C | M | M5, I10 |
| F3 | Vault search/filter, categories/tags, show/hide password, copy-username | C | M | I10 |
| F4 | Browser extension + autofill (the #1 daily-use feature of every competitor) | F | L | M6 |
| F5 | Passkey storage (dominant 2025-2026 trend) | F | L | M7 |
| F6 | Email aliases (Proton Pass differentiator; needs email infra) | F | L | M8 |
| F7 | Recovery mechanism without breaking zero-knowledge (recovery key / encrypted export) | F | L | I9 |
| F8 | Credential sharing (encrypt to recipient public key) | F | L | I10 |
| F9 | PWA / offline (was in the plan cut-list) | F | M | I10 |

## Already done (not to assess)

- H1 backend hardening: auth rate-limiting + vault pagination/cap (`zerovault-hardening.md`).
- Deploy to production (web/API/DB), CORS lock, demo account, history scrub (`zerovault-deploy.md`).

## Suggested first tranche (if approved later)

Best value/effort for the TFM and all reinforce the security thesis:
**D1 (CI) · R1 (timeout) · S1 (helmet) · S2 (AAD) · S6 (HIBP) · F1 (health dashboard)**,
with S4 (Argon2id) and S5 (Secret Key) as standout security differentiators.
