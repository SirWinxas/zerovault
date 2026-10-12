// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_KDF_PARAMS,
  deriveAuthHash,
  fromBase64,
} from "@zerovault/crypto";
import { createAuthService } from "./auth-service";
import type { ApiClient } from "../lib/api-client";
import { createSessionStore } from "../session/session-store";

// Minimum policy-compliant KDF for the login path (server-provided params).
const FAST = { iterations: 600_000, hash: "SHA-256" as const };
const SALT_B64 = btoa(String.fromCharCode(...new Uint8Array(16).fill(7)));

function fakeApi(responses: Record<string, unknown>) {
  const calls: Array<{ method: string; path: string; body?: unknown }> = [];
  return {
    calls,
    api: {
      get: async (path: string) => {
        calls.push({ method: "GET", path });
        return responses[`GET ${path.split("?")[0]}`];
      },
      post: async (path: string, body: unknown) => {
        calls.push({ method: "POST", path, body });
        return responses[`POST ${path}`];
      },
      put: async () => undefined,
      del: async () => undefined,
    } as unknown as ApiClient,
  };
}

const loginResponses = {
  "GET /auth/params": { authSalt: SALT_B64, kdfParams: FAST },
  "POST /auth/login": { token: "jwt", encSalt: SALT_B64, kdfParams: FAST },
};

afterEach(() => vi.unstubAllGlobals());

describe("auth service", () => {
  it("login: params -> hash -> login -> non-extractable key -> session", async () => {
    const { api, calls } = fakeApi(loginResponses);
    const session = createSessionStore();
    await createAuthService(api, session).login("a@b.c", "pw");

    expect(calls[0]).toEqual({ method: "GET", path: "/auth/params?email=a%40b.c" });
    const expectedHash = await deriveAuthHash("pw", fromBase64(SALT_B64), FAST);
    expect(calls[1]).toEqual({
      method: "POST",
      path: "/auth/login",
      body: { email: "a@b.c", authHash: expectedHash },
    });
    const s = session.get()!;
    expect(s.token).toBe("jwt");
    expect(s.email).toBe("a@b.c");
    expect(s.encryptionKey.extractable).toBe(false);
    expect(s.encryptionKey.algorithm.name).toBe("AES-GCM");
  });

  it("register: posts salts/hash/kdfParams then logs in", async () => {
    const { api, calls } = fakeApi({
      "POST /auth/register": undefined,
      ...loginResponses,
    });
    const session = createSessionStore();
    await createAuthService(api, session).register("a@b.c", "pw");

    const reg = calls[0].body as Record<string, unknown>;
    expect(reg.email).toBe("a@b.c");
    expect(typeof reg.authHash).toBe("string");
    expect(fromBase64(reg.authSalt as string)).toHaveLength(16);
    expect(fromBase64(reg.encSalt as string)).toHaveLength(16);
    expect(reg.authSalt).not.toBe(reg.encSalt);
    expect(reg.kdfParams).toEqual(DEFAULT_KDF_PARAMS);
    expect(calls.map((c) => c.path)).toEqual([
      "/auth/register",
      "/auth/params?email=a%40b.c",
      "/auth/login",
    ]);
    expect(session.getToken()).toBe("jwt");
  });

  it("never writes to web storage", async () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { setItem });
    vi.stubGlobal("sessionStorage", { setItem });
    const { api } = fakeApi(loginResponses);
    await createAuthService(api, createSessionStore()).login("a@b.c", "pw");
    expect(setItem).not.toHaveBeenCalled();
  });

  it("login: rejects downgraded params from /auth/params before any derivation", async () => {
    const { api, calls } = fakeApi({
      ...loginResponses,
      "GET /auth/params": {
        authSalt: SALT_B64,
        kdfParams: { iterations: 1, hash: "SHA-256" },
      },
    });
    const session = createSessionStore();
    await expect(
      createAuthService(api, session).login("a@b.c", "pw"),
    ).rejects.toThrow("Unsafe key derivation parameters");
    expect(calls.map((c) => c.path)).toEqual(["/auth/params?email=a%40b.c"]);
    expect(session.get()).toBeNull();
  });

  it("login: rejects downgraded params in the login response (no session set)", async () => {
    const { api } = fakeApi({
      ...loginResponses,
      "POST /auth/login": {
        token: "jwt",
        encSalt: SALT_B64,
        kdfParams: { iterations: 1, hash: "SHA-256" },
      },
    });
    const session = createSessionStore();
    await expect(
      createAuthService(api, session).login("a@b.c", "pw"),
    ).rejects.toThrow("Unsafe key derivation parameters");
    expect(session.get()).toBeNull();
  });
});
