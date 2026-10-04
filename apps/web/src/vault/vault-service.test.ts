// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { deriveEncryptionKey, generateSalt } from "@zerovault/crypto";
import type { VaultItemResponse } from "@zerovault/shared-types";
import type { ApiClient } from "../lib/api-client";
import { createVaultService } from "./vault-service";
import type { VaultEntry } from "./vault-entry";

const entry: VaultEntry = {
  site: "example-site.test",
  username: "alice-the-user",
  password: "s3cr3t-P@ssw0rd!",
};

interface Call {
  method: string;
  path: string;
  body?: unknown;
}

function fakeApi(responses: { get?: unknown; post?: unknown; put?: unknown } = {}) {
  const calls: Call[] = [];
  const api: ApiClient = {
    get: async <T,>(path: string) => {
      calls.push({ method: "GET", path });
      return responses.get as T;
    },
    post: async <T,>(path: string, body: unknown) => {
      calls.push({ method: "POST", path, body });
      return responses.post as T;
    },
    put: async <T,>(path: string, body: unknown) => {
      calls.push({ method: "PUT", path, body });
      return responses.put as T;
    },
    del: async <T,>(path: string) => {
      calls.push({ method: "DELETE", path });
      return undefined as T;
    },
  };
  return { api, calls };
}

function expectNoPlaintext(body: unknown) {
  const serialized = JSON.stringify(body);
  expect(serialized).not.toContain(entry.site);
  expect(serialized).not.toContain(entry.username);
  expect(serialized).not.toContain(entry.password);
}

describe("vault-service", () => {
  let key: CryptoKey;
  beforeAll(async () => {
    key = await deriveEncryptionKey("master-pw", generateSalt(), {
      iterations: 1000,
      hash: "SHA-256",
    });
  });

  it("create posts only { ciphertext, iv } and never plaintext", async () => {
    const { api, calls } = fakeApi({ post: { id: "42", ciphertext: "c", iv: "i" } });
    const svc = createVaultService(api, () => key);

    const created = await svc.create(entry);

    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe("POST");
    expect(calls[0].path).toBe("/vault");
    expect(Object.keys(calls[0].body as object).sort()).toEqual(["ciphertext", "iv"]);
    expectNoPlaintext(calls[0].body);
    expect(created).toEqual({ id: "42", ...entry });
  });

  it("round-trips: list decrypts what create encrypted", async () => {
    const post = fakeApi({ post: { id: "7", ciphertext: "c", iv: "i" } });
    await createVaultService(post.api, () => key).create(entry);
    const sent = post.calls[0].body as { ciphertext: string; iv: string };

    const stored: VaultItemResponse[] = [{ id: "7", ...sent }];
    const get = fakeApi({ get: stored });
    const items = await createVaultService(get.api, () => key).list();

    expect(get.calls[0]).toMatchObject({ method: "GET", path: "/vault" });
    expect(items).toEqual([{ id: "7", ...entry }]);
  });

  it("update PUTs only { ciphertext, iv } to /vault/:id", async () => {
    const { api, calls } = fakeApi({ put: { id: "9", ciphertext: "c", iv: "i" } });
    const updated = await createVaultService(api, () => key).update("9", entry);

    expect(calls[0].method).toBe("PUT");
    expect(calls[0].path).toBe("/vault/9");
    expect(Object.keys(calls[0].body as object).sort()).toEqual(["ciphertext", "iv"]);
    expectNoPlaintext(calls[0].body);
    expect(updated).toEqual({ id: "9", ...entry });
  });

  it("remove calls DELETE /vault/:id", async () => {
    const { api, calls } = fakeApi();
    await createVaultService(api, () => key).remove("5");
    expect(calls).toEqual([{ method: "DELETE", path: "/vault/5" }]);
  });

  it("list flags an undecryptable item instead of rejecting", async () => {
    const post = fakeApi({ post: { id: "1", ciphertext: "c", iv: "i" } });
    await createVaultService(post.api, () => key).create(entry);
    const good = post.calls[0].body as { ciphertext: string; iv: string };

    const stored: VaultItemResponse[] = [
      { id: "1", ...good },
      { id: "2", ciphertext: "AAAA", iv: "AAAA" },
      { id: "3", ...good },
    ];
    const items = await createVaultService(fakeApi({ get: stored }).api, () => key).list();

    expect(items).toEqual([
      { id: "1", ...entry },
      { id: "2", site: "", username: "", password: "", decryptError: true },
      { id: "3", ...entry },
    ]);
  });

  it("list flags a record that decrypts to non-JSON", async () => {
    const { encrypt } = await import("@zerovault/crypto");
    const bad = await encrypt(key, "not json");
    const items = await createVaultService(
      fakeApi({ get: [{ id: "9", ...bad }] }).api,
      () => key,
    ).list();
    expect(items).toEqual([
      { id: "9", site: "", username: "", password: "", decryptError: true },
    ]);
  });

  it("throws a clear error when the vault is locked", async () => {
    const { api, calls } = fakeApi({ get: [] });
    const svc = createVaultService(api, () => null);
    await expect(svc.list()).rejects.toThrow(/vault is locked/i);
    await expect(svc.create(entry)).rejects.toThrow(/vault is locked/i);
    await expect(svc.update("1", entry)).rejects.toThrow(/vault is locked/i);
    expect(calls).toHaveLength(0);
  });
});
