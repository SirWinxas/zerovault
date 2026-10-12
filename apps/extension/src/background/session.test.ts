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
import { KDF_MIN_ITERATIONS } from "@zerovault/shared-types";
import * as realCrypto from "@zerovault/crypto";
import { createSessionManager, LoginInProgressError, resolveFill } from "./session";

const EMAIL = "user@example.com";
const MASTER = "correct horse battery staple";
const KDF: KdfParams = { iterations: KDF_MIN_ITERATIONS, hash: "SHA-256" };
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
  paramsKdf?: unknown;
  loginKdf?: unknown;
}

function mockApi(opts: MockOpts) {
  const calls: string[] = [];
  const factory = (getToken: () => string | null): ApiClient => ({
    async get<T>(path: string): Promise<T> {
      calls.push(`GET ${path}`);
      if (path.startsWith("/auth/params")) {
        return { authSalt: toBase64(AUTH_SALT), kdfParams: opts.paramsKdf ?? KDF } as T;
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
      return { token: "tok", encSalt: toBase64(ENC_SALT), kdfParams: opts.loginKdf ?? KDF } as T;
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
    await expect(m.login(EMAIL, MASTER)).rejects.toBeInstanceOf(LoginInProgressError);
    release();
    await first;
    expect(m.state()).toEqual({ unlocked: true, email: EMAIL });
    // The guard is released afterwards.
    await expect(m.login(EMAIL, MASTER)).resolves.toBeUndefined();
  });

  it("auto-locks after the idle timeout and items() refreshes activity", async () => {
    const fx = await buildFixture();
    let t = 1_000;
    const m = createSessionManager({
      createApi: mockApi({ expectedHash: fx.expectedHash, rows: [{ id: "a", ...fx.good }] }).factory,
      idleMs: 1000,
      now: () => t,
    });
    await m.login(EMAIL, MASTER);
    t += 999;
    expect(m.state()).toEqual({ unlocked: true, email: EMAIL });
    t += 1; // exactly idleMs since login: still unlocked (strictly greater locks)
    expect(m.items().locked).toBeUndefined(); // refreshes activity
    t += 900;
    expect(m.state().unlocked).toBe(true); // would be locked without the refresh
    t += 101; // 1001 since the refresh
    expect(m.state()).toEqual({ unlocked: false });
    expect(m.items()).toEqual({ items: [], locked: true });
  });
});

describe("session manager hardening", () => {
  it("labels() exposes only id/site/username, never password or totp", async () => {
    const fx = await buildFixture();
    const m = createSessionManager({
      createApi: mockApi({ expectedHash: fx.expectedHash, rows: [{ id: "a", ...fx.good }] }).factory,
    });
    expect(m.labels()).toEqual({ items: [], locked: true });
    await m.login(EMAIL, MASTER);
    const { items } = m.labels();
    expect(items).toEqual([{ id: "a", site: ENTRY.site, username: ENTRY.username }]);
    expect(Object.keys(items[0]).sort()).toEqual(["id", "site", "username"]);
    expect(JSON.stringify(items)).not.toContain("s3cret");
  });

  it("credentialFor returns the full item or null", async () => {
    const fx = await buildFixture();
    const m = createSessionManager({
      createApi: mockApi({ expectedHash: fx.expectedHash, rows: [{ id: "a", ...fx.good }] }).factory,
    });
    expect(m.credentialFor("a")).toBeNull();
    await m.login(EMAIL, MASTER);
    expect(m.credentialFor("a")).toEqual({ ...ENTRY, id: "a" });
    expect(m.credentialFor("zzz")).toBeNull();
  });

  it("resolveFill returns one credential only on origin match", () => {
    const item = { ...ENTRY, id: "a", totp: "JBSWY3DP" };
    expect(resolveFill(item, "https://evil.example/login")).toBeNull();
    expect(resolveFill(item, "http://example.com/login")).toBeNull();
    expect(resolveFill(item, "https://example.com/login")).toEqual({
      site: ENTRY.site,
      username: "alice",
      password: "s3cret",
    });
    expect(resolveFill(null, "https://example.com")).toBeNull();
  });

  it("skips rows whose plaintext does not match the entry schema", async () => {
    const fx = await buildFixture();
    const key = await deriveEncryptionKey(MASTER, ENC_SALT, KDF);
    const junk = await encrypt(key, '{"foo":1}');
    const notJson = await encrypt(key, "nope");
    const m = createSessionManager({
      createApi: mockApi({
        expectedHash: fx.expectedHash,
        rows: [{ id: "junk", ...junk }, { id: "txt", ...notJson }, { id: "a", ...fx.good }],
      }).factory,
    });
    await m.login(EMAIL, MASTER);
    expect(m.items().items.map((i) => i.id)).toEqual(["a"]);
  });

  it("rejects weak server-supplied KDF params before deriving anything", async () => {
    const fx = await buildFixture();
    for (const weak of [
      { iterations: 1, hash: "SHA-256" },
      { iterations: KDF_MIN_ITERATIONS, hash: "SHA-1" },
      { iterations: 999_999_999, hash: "SHA-256" },
    ]) {
      let derived = 0;
      const spy = {
        ...realCrypto,
        deriveAuthHash: (...a: Parameters<typeof realCrypto.deriveAuthHash>) => (derived++, realCrypto.deriveAuthHash(...a)),
        deriveEncryptionKey: (...a: Parameters<typeof realCrypto.deriveEncryptionKey>) => (derived++, realCrypto.deriveEncryptionKey(...a)),
      };
      const m = createSessionManager({
        crypto: spy,
        createApi: mockApi({ expectedHash: fx.expectedHash, rows: [], paramsKdf: weak }).factory,
      });
      await expect(m.login(EMAIL, MASTER)).rejects.toThrow();
      expect(derived).toBe(0);
      expect(m.state()).toEqual({ unlocked: false });
    }
  });

  it("rejects weak KDF params in the login response before deriving the key", async () => {
    const fx = await buildFixture();
    let keyDerived = 0;
    const spy = {
      ...realCrypto,
      deriveEncryptionKey: (...a: Parameters<typeof realCrypto.deriveEncryptionKey>) => (keyDerived++, realCrypto.deriveEncryptionKey(...a)),
    };
    const m = createSessionManager({
      crypto: spy,
      createApi: mockApi({ expectedHash: fx.expectedHash, rows: [], loginKdf: { iterations: 1, hash: "SHA-256" } }).factory,
    });
    await expect(m.login(EMAIL, MASTER)).rejects.toThrow();
    expect(keyDerived).toBe(0);
  });
});
