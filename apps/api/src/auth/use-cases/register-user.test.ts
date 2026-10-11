import { describe, expect, it, vi } from "vitest";
import type { RegisterRequest } from "@zerovault/shared-types";
import { EmailAlreadyRegisteredError } from "../domain/errors.js";
import type { NewUser, StoredUser } from "../domain/user.js";
import { InMemoryUserRepository } from "../adapters/in-memory-user-repository.js";
import type { Hasher } from "../ports/hasher.js";
import type { UserRepository } from "../ports/user-repository.js";
import { makeRegisterUser } from "./register-user.js";

function spyHasher() {
  const hash = vi.fn(async (v: string) => `hashed(${v})`);
  const hasher: Hasher = { hash, verify: async (v, s) => s === `hashed(${v})` };
  return { hasher, hash };
}

const input: RegisterRequest = {
  email: "a@b.co",
  authHash: "raw-auth-hash",
  authSalt: "auth-salt",
  encSalt: "enc-salt",
  kdfParams: { iterations: 600000, hash: "SHA-256" },
};

describe("registerUser", () => {
  it("creates a user with the provided salts and kdf params", async () => {
    const users = new InMemoryUserRepository();
    const { hasher } = spyHasher();
    await makeRegisterUser({ users, hasher })(input);
    const stored = await users.findByEmail("a@b.co");
    expect(stored?.authSalt).toBe("auth-salt");
    expect(stored?.encSalt).toBe("enc-salt");
    expect(stored?.kdfParams).toEqual(input.kdfParams);
  });

  it("resolves to nothing, so the outcome carries no account-specific data", async () => {
    const { hasher } = spyHasher();
    const result = await makeRegisterUser({ users: new InMemoryUserRepository(), hasher })(input);
    expect(result).toBeUndefined();
  });

  it("stores a hash of authHash, never the plaintext", async () => {
    const users = new InMemoryUserRepository();
    const { hasher } = spyHasher();
    await makeRegisterUser({ users, hasher })(input);
    const stored = await users.findByEmail("a@b.co");
    expect(stored?.authHashHash).not.toBe(input.authHash);
    expect(stored?.authHashHash).toBe("hashed(raw-auth-hash)");
  });

  it("silently no-ops for an existing email without overwriting or duplicating it", async () => {
    const users = new InMemoryUserRepository();
    const { hasher } = spyHasher();
    const register = makeRegisterUser({ users, hasher });
    await register(input);
    const original = await users.findByEmail("a@b.co");
    const create = vi.spyOn(users, "create");

    await expect(register({ ...input, authHash: "other", encSalt: "other-salt" })).resolves.toBeUndefined();

    expect(create).not.toHaveBeenCalled();
    expect(await users.findByEmail("a@b.co")).toEqual(original);
  });

  it("runs the same expensive hash on the exists path (timing parity)", async () => {
    const users = new InMemoryUserRepository();
    const { hasher, hash } = spyHasher();
    const register = makeRegisterUser({ users, hasher });
    await register(input);
    hash.mockClear();

    await register({ ...input, authHash: "second-attempt" });

    expect(hash).toHaveBeenCalledTimes(1);
    expect(hash).toHaveBeenCalledWith("second-attempt");
  });

  it("treats a unique-constraint race on create as 'exists' without erroring", async () => {
    const { hasher, hash } = spyHasher();
    const racing: UserRepository = {
      findByEmail: async (): Promise<StoredUser | null> => null,
      create: async (_u: NewUser): Promise<StoredUser> => {
        throw new EmailAlreadyRegisteredError();
      },
    };
    await expect(makeRegisterUser({ users: racing, hasher })(input)).resolves.toBeUndefined();
    expect(hash).toHaveBeenCalledTimes(1);
  });

  it("rethrows unrelated repository errors", async () => {
    const { hasher } = spyHasher();
    const boom = new Error("db down");
    const broken: UserRepository = {
      findByEmail: async () => null,
      create: async () => {
        throw boom;
      },
    };
    await expect(makeRegisterUser({ users: broken, hasher })(input)).rejects.toBe(boom);
  });

  it("normalizes the email so case variants are the same account", async () => {
    const users = new InMemoryUserRepository();
    const { hasher } = spyHasher();
    const register = makeRegisterUser({ users, hasher });
    await register({ ...input, email: "  A@B.Co " });
    expect(await users.findByEmail("a@b.co")).not.toBeNull();

    const create = vi.spyOn(users, "create");
    await register({ ...input, email: "a@b.co" });
    expect(create).not.toHaveBeenCalled();
  });
});
