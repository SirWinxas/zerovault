# ZeroVault

> Zero-knowledge password manager. Your master password never leaves your browser; the server only ever stores ciphertext.

Final master's project (TFM) — FUNDAE.

## Description

ZeroVault is a web-based password manager built on a **zero-knowledge** architecture. All encryption and decryption happen in the browser using the native Web Crypto API. The backend is deliberately "dumb": it authenticates sessions and stores encrypted blobs, and it is architecturally unable to read any stored secret.

## Security model

- The **master password is never sent to the server**.
- Two independent values are derived from the master password with **PBKDF2** (Web Crypto), each with a different salt:
  - an **authentication hash**, sent to the server only to log in, and
  - an **encryption key**, which stays in memory and is never transmitted.
- Vault items are encrypted client-side with **AES-GCM** (random IV per item) before upload. The server stores only `ciphertext` + `iv`.
- Losing the master password means losing the vault — **by design**. There is no server-side recovery, because the server has nothing to recover with.

## Tech stack

| Layer     | Choice                                             |
| --------- | -------------------------------------------------- |
| Frontend  | React + Vite + TypeScript, Tailwind CSS            |
| Crypto    | Native Web Crypto API (PBKDF2 + AES-GCM)           |
| Backend   | Node.js + Express + TypeScript                     |
| Database  | PostgreSQL + Prisma                                |
| Auth      | JWT (session only — never the encryption key)      |
| Testing   | Vitest                                             |
| Deploy    | Vercel (web), Railway (API), Neon (PostgreSQL)     |

## Project structure

```
zerovault/
├─ apps/
│  ├─ web/                 # React + Vite PWA client
│  │  └─ src/
│  │     ├─ crypto/        # KDF + encrypt/decrypt — pure, fully unit-tested
│  │     ├─ features/      # auth, vault, generator (container + presentational)
│  │     └─ components/    # atomic design: atoms / molecules / organisms
│  └─ api/                 # Express API
│     └─ src/
│        └─ modules/
│           ├─ vault/      # stores/reads ciphertext — never sees plaintext
│           │  ├─ domain/
│           │  ├─ application/
│           │  └─ infra/
│           └─ auth/
├─ packages/
│  └─ shared-types/        # DTOs shared by web and api
└─ docs/
   └─ PLAN.md              # 24-day plan + delivery checklist
```

## Requirements

- Node.js >= 20
- A PostgreSQL database (local or [Neon](https://neon.tech))

## Installation & running

```bash
# 1. Install dependencies (npm workspaces)
npm install

# 2. Configure environment
cp apps/api/.env.example apps/api/.env   # set DATABASE_URL and JWT_SECRET

# 3. Apply database schema
npm run db:migrate -w apps/api

# 4. Run web + api in dev
npm run dev
```

Web: http://localhost:5173 — API: http://localhost:3000

### Environment variables

| App       | Variable       | Required | Purpose                                                                 |
| --------- | -------------- | -------- | ----------------------------------------------------------------------- |
| `apps/api`| `DATABASE_URL` | yes      | PostgreSQL connection string.                                           |
| `apps/api`| `JWT_SECRET`   | yes      | Signs session JWTs.                                                      |
| `apps/api`| `AUTH_PEPPER`  | yes      | Server-side pepper for the login decoy (anti user-enumeration).         |
| `apps/api`| `WEB_ORIGIN`   | prod     | Allowed CORS origin(s), comma-separated. Unset = reflect any (dev only).|
| `apps/api`| `PORT`         | no       | API port (default `3000`; injected by the host in production).          |
| `apps/web`| `VITE_API_URL` | prod     | API base URL (no trailing slash). Unset = same-origin `/api` dev proxy. |

## Main features

- Zero-knowledge registration and login (master password never leaves the client).
- Encrypted vault: create, read, update, delete credentials (site, username, password, notes).
- Password generator (length + character sets).
- Copy to clipboard with automatic clear after a timeout.
- Auto-lock on inactivity (encryption key wiped from memory).

## Test account

> Filled in before submission.

- Live URL: _TBD_
- Email: `demo@zerovault.app`
- Master password: _TBD_

## TFM deliverables

- Deployment URL: _TBD_
- Slides: _TBD_
- Video: _TBD_

## License

MIT
