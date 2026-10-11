import { describe, expect, it } from "vitest";
import {
  AuthParamsResponseSchema,
  CreateVaultItemRequestSchema,
  UpdateVaultItemRequestSchema,
  VaultItemResponseSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
  KdfParamsSchema,
  KDF_MIN_ITERATIONS,
  KDF_MAX_ITERATIONS,
  VaultEntrySchema,
} from "./index";

const kdfParams = { iterations: 600000, hash: "SHA-256" as const };

describe("shared-types", () => {
  it("validates a login request", () => {
    const parsed = LoginRequestSchema.safeParse({ email: "a@b.co", authHash: "x" });
    expect(parsed.success).toBe(true);
  });

  it("validates a register request and rejects bad kdf params", () => {
    const base = { email: "a@b.co", authHash: "x", authSalt: "s", encSalt: "e" };
    expect(RegisterRequestSchema.safeParse({ ...base, kdfParams }).success).toBe(true);
    expect(
      RegisterRequestSchema.safeParse({ ...base, kdfParams: { iterations: 0, hash: "SHA-256" } }).success,
    ).toBe(false);
    expect(
      RegisterRequestSchema.safeParse({ ...base, kdfParams: { iterations: 1, hash: "MD5" } }).success,
    ).toBe(false);
  });

  it("validates auth params response", () => {
    expect(AuthParamsResponseSchema.safeParse({ authSalt: "s", kdfParams }).success).toBe(true);
  });

  it("validates create/update vault item requests and rejects empty fields", () => {
    for (const schema of [CreateVaultItemRequestSchema, UpdateVaultItemRequestSchema]) {
      expect(schema.safeParse({ ciphertext: "c", iv: "i" }).success).toBe(true);
      expect(schema.safeParse({ ciphertext: "", iv: "i" }).success).toBe(false);
      expect(schema.safeParse({ ciphertext: "c", iv: "" }).success).toBe(false);
      expect(schema.safeParse({ ciphertext: "c" }).success).toBe(false);
    }
  });

  it("validates a vault item response", () => {
    expect(VaultItemResponseSchema.safeParse({ id: "1", ciphertext: "c", iv: "i" }).success).toBe(true);
    expect(VaultItemResponseSchema.safeParse({ ciphertext: "c", iv: "i" }).success).toBe(false);
  });

  it("enforces the KDF iteration floor and ceiling and pins SHA-256", () => {
    expect(KDF_MIN_ITERATIONS).toBe(600000);
    expect(KDF_MAX_ITERATIONS).toBe(10_000_000);
    const ok = (iterations: number, hash = "SHA-256") => KdfParamsSchema.safeParse({ iterations, hash }).success;
    expect(ok(KDF_MIN_ITERATIONS)).toBe(true);
    expect(ok(KDF_MAX_ITERATIONS)).toBe(true);
    expect(ok(1)).toBe(false);
    expect(ok(KDF_MIN_ITERATIONS - 1)).toBe(false);
    expect(ok(KDF_MAX_ITERATIONS + 1)).toBe(false);
    expect(ok(600000.5)).toBe(false);
    expect(ok(600000, "SHA-1")).toBe(false);
  });

  it("validates a decrypted vault entry", () => {
    const entry = { site: "https://a.co", username: "u", password: "p" };
    expect(VaultEntrySchema.safeParse(entry).success).toBe(true);
    expect(VaultEntrySchema.safeParse({ ...entry, totp: "JBSWY3DP", tags: ["work"] }).success).toBe(true);
    expect(VaultEntrySchema.safeParse({ site: "s", username: "u" }).success).toBe(false);
    expect(VaultEntrySchema.safeParse({ ...entry, tags: [1] }).success).toBe(false);
  });
});
