import { describe, expect, it, vi } from "vitest";
import { InvalidCredentialsError } from "../domain/errors.js";
import { InMemoryUserRepository } from "../adapters/in-memory-user-repository.js";
import type { Hasher } from "../ports/hasher.js";
import type { TokenService } from "../ports/token-service.js";
import { makeLoginUser } from "./login-user.js";

const decoyHash = "decoy-hash";
const verify = vi.fn(async (v: string, s: string) => s === `hashed(${v})`);
const hasher: Hasher = {
  hash: async (v) => `hashed(${v})`,
  verify,
};
const tokens: TokenService = {
  sign: async ({ sub }) => `token-for-${sub}`,
  verify: async (t) => ({ sub: t.replace("token-for-", "") }),
};
const kdfParams = { iterations: 600000, hash: "SHA-256" as const };

async function setup() {
  verify.mockClear();
  const users = new InMemoryUserRepository();
  const user = await users.create({
    email: "a@b.co",
    authHashHash: "hashed(good)",
    authSalt: "as",
    encSalt: "es",
    kdfParams,
  });
  return { user, login: makeLoginUser({ users, hasher, tokens, decoyHash }) };
}

describe("loginUser", () => {
  it("returns token, encSalt and kdfParams for correct credentials", async () => {
    const { user, login } = await setup();
    const res = await login({ email: "a@b.co", authHash: "good" });
    expect(res).toEqual({ token: `token-for-${user.id}`, encSalt: "es", kdfParams });
    expect(res.token.length).toBeGreaterThan(0);
  });

  it("rejects a wrong authHash", async () => {
    const { login } = await setup();
    await expect(login({ email: "a@b.co", authHash: "bad" })).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("verifies against the decoy hash then rejects an unknown email", async () => {
    const { login } = await setup();
    await expect(login({ email: "x@y.co", authHash: "good" })).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenCalledWith("good", decoyHash);
  });

  it("does not use the decoy hash for a known email", async () => {
    const { user, login } = await setup();
    await login({ email: "a@b.co", authHash: "good" });
    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenCalledWith("good", "hashed(good)");
    expect(user.email).toBe("a@b.co");
  });

  it("normalizes the email (trim + lowercase) before lookup", async () => {
    const { user, login } = await setup();
    const res = await login({ email: " A@B.CO ", authHash: "good" });
    expect(res.token).toBe(`token-for-${user.id}`);
  });
});
