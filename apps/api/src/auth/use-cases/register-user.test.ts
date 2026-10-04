import { describe, expect, it } from "vitest";
import type { RegisterRequest } from "@zerovault/shared-types";
import { EmailAlreadyRegisteredError } from "../domain/errors.js";
import { InMemoryUserRepository } from "../adapters/in-memory-user-repository.js";
import type { Hasher } from "../ports/hasher.js";
import { makeRegisterUser } from "./register-user.js";

const fakeHasher: Hasher = {
  hash: async (v) => `hashed(${v})`,
  verify: async (v, s) => s === `hashed(${v})`,
};

const input: RegisterRequest = {
  email: "a@b.co",
  authHash: "raw-auth-hash",
  authSalt: "auth-salt",
  encSalt: "enc-salt",
  kdfParams: { iterations: 600000, hash: "SHA-256" },
};

describe("registerUser", () => {
  it("creates a user and returns its id", async () => {
    const users = new InMemoryUserRepository();
    const { id } = await makeRegisterUser({ users, hasher: fakeHasher })(input);
    const stored = await users.findByEmail("a@b.co");
    expect(stored?.id).toBe(id);
    expect(stored?.authSalt).toBe("auth-salt");
    expect(stored?.encSalt).toBe("enc-salt");
    expect(stored?.kdfParams).toEqual(input.kdfParams);
  });

  it("stores a hash of authHash, never the plaintext", async () => {
    const users = new InMemoryUserRepository();
    await makeRegisterUser({ users, hasher: fakeHasher })(input);
    const stored = await users.findByEmail("a@b.co");
    expect(stored?.authHashHash).not.toBe(input.authHash);
    expect(stored?.authHashHash).toBe("hashed(raw-auth-hash)");
  });

  it("rejects a duplicate email", async () => {
    const users = new InMemoryUserRepository();
    const register = makeRegisterUser({ users, hasher: fakeHasher });
    await register(input);
    await expect(register(input)).rejects.toBeInstanceOf(EmailAlreadyRegisteredError);
  });
});
