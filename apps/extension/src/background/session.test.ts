import { describe, expect, it } from "vitest";
import {
  deriveAuthHash,
  deriveEncryptionKey,
  encrypt,
  toBase64,
  type KdfParams,
} from "@zerovault/crypto";
import type { ApiClient } from "../lib/api";
import type { VaultEntry } from "../vault/entry";
import { createSessionManager } from "./session";

const EMAIL = "user@example.com";
const MASTER = "correct horse battery staple";
const KDF: KdfParams = { iterations: 1, hash: "SHA-256" };
const AUTH_SALT = new Uint8Array(16).fill(1);
const ENC_SALT = new Uint8Array(16).fill(2);

const ENTRY: VaultEntry = { site: "https://example.com", username: "alice", password: "s3cret" };

async function buildFixture() {
  const key = await deriveEncryptionKey(MASTER, ENC_SALT, KDF);
  const good = await encrypt(key, JSON.stringify(ENTRY));
  const otherKey = await deriveEncryptionKey("another master", ENC_SALT, KDF);
  const foreign = await encrypt(otherKey, JSON.stringify(ENTRY));
  const expectedHash = await deriveAuthHash(MASTER, AUTH_SALT, KDF);
  return { good, foreign, expectedHash };
}

interface MockOpts {
  rows: { id: string; ciphertext: string; iv: string }[];
  expectedHash: string;
  gate?: Promise<void>;
}

function mockApi(opts: MockOpts) {
  const calls: string[] = [];
  const factory = (getToken: () => string | null): ApiClient => ({
    async get<T>(path: string): Promise<T> {
      calls.push(`GET ${path}`);
      if (path.startsWith("/auth/params")) {
        return { authSalt: toBase64(AUTH_SALT), kdfParams: KDF } as T;
      }
      if (path === "/vault") {
        if (getToken() !== "tok") throw new Error("missing token");
        return opts.rows as T;
      }
      throw new Error(`unexpected GET ${path}`);
    },
    async post<T>(path: string, body: unknown): Promise<T> {
      calls.push(`POST ${path}`);
      if (opts.gate) await opts.gate;
      const b = body as { authHash: string };
      if (path !== "/auth/login" || b.authHash !== opts.expectedHash) throw new Error("401");
      return { token: "tok", encSalt: toBase64(ENC_SALT), kdfParams: KDF } as T;
    },
  });
  return { factory, calls };
}

describe("session manager", () => {
  it("is locked initially", () => {
    const m = createSessionManager({ createApi: mockApi({ rows: [], expectedHash: "" }).factory });
    expect(m.state()).toEqual({ unlocked: false });
    expect(m.items()).toEqual({ items: [], locked: true });
  });

  it("login decrypts the vault and populates items; undecryptable rows are skipped", async () => {
    const fx = await buildFixture();
    const api = mockApi({
      expectedHash: fx.expectedHash,
      rows: [
        { id: "a", ...fx.good },
        { id: "bad", ...fx.foreign },
      ],
    });
    const m = createSessionManager({ createApi: api.factory });
    await m.login(EMAIL, MASTER);
    expect(m.state()).toEqual({ unlocked: true, email: EMAIL });
    expect(m.items()).toEqual({ items: [{ ...ENTRY, id: "a" }] });
    expect(api.calls).toEqual([`GET /auth/params?email=${encodeURIComponent(EMAIL)}`, "POST /auth/login", "GET /vault"]);
  });

  it("a failed login leaves an already-unlocked session intact", async () => {
    const fx = await buildFixture();
    const api = mockApi({ expectedHash: fx.expectedHash, rows: [{ id: "a", ...fx.good }] });
    const m = createSessionManager({ createApi: api.factory });
    await m.login(EMAIL, MASTER);

    await expect(m.login(EMAIL, "wrong master")).rejects.toThrow();

    expect(m.state()).toEqual({ unlocked: true, email: EMAIL });
    expect(m.items()).toEqual({ items: [{ ...ENTRY, id: "a" }] });
  });

  it("a failed first login stays locked", async () => {
    const fx = await buildFixture();
    const m = createSessionManager({
      createApi: mockApi({ expectedHash: fx.expectedHash, rows: [] }).factory,
    });
    await expect(m.login(EMAIL, "wrong master")).rejects.toThrow();
    expect(m.state()).toEqual({ unlocked: false });
  });

  it("lock clears the session", async () => {
    const fx = await buildFixture();
    const m = createSessionManager({
      createApi: mockApi({ expectedHash: fx.expectedHash, rows: [{ id: "a", ...fx.good }] }).factory,
    });
    await m.login(EMAIL, MASTER);
    m.lock();
    expect(m.state()).toEqual({ unlocked: false });
    expect(m.items()).toEqual({ items: [], locked: true });
  });

  it("rejects a concurrent login while one is pending, without touching the session", async () => {
    const fx = await buildFixture();
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const m = createSessionManager({
      createApi: mockApi({ expectedHash: fx.expectedHash, rows: [{ id: "a", ...fx.good }], gate }).factory,
    });
    const first = m.login(EMAIL, MASTER);
    await expect(m.login(EMAIL, MASTER)).rejects.toThrow();
    release();
    await first;
    expect(m.state()).toEqual({ unlocked: true, email: EMAIL });
    // The guard is released afterwards.
    await expect(m.login(EMAIL, MASTER)).resolves.toBeUndefined();
  });
});
