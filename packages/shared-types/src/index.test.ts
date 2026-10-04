import { describe, expect, it } from "vitest";
import {
  AuthParamsResponseSchema,
  CreateVaultItemRequestSchema,
  UpdateVaultItemRequestSchema,
  VaultItemResponseSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
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
});
