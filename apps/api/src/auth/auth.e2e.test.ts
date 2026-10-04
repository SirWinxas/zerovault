import { describe, expect, it } from "vitest";
import { InMemoryUserRepository } from "./adapters/in-memory-user-repository.js";
import { JwtTokenService } from "./adapters/jwt-token-service.js";
import { ScryptHasher } from "./adapters/scrypt-hasher.js";
import { InvalidCredentialsError } from "./domain/errors.js";
import { makeLoginUser } from "./use-cases/login-user.js";
import { makeRegisterUser } from "./use-cases/register-user.js";

describe("auth end-to-end (real hasher + jwt, in-memory repo)", () => {
  const users = new InMemoryUserRepository();
  const hasher = new ScryptHasher();
  const tokens = new JwtTokenService({ secret: "e2e-secret-e2e-secret-e2e-secret-1" });
  const register = makeRegisterUser({ users, hasher });
  const login = makeLoginUser({ users, hasher, tokens });
  const kdfParams = { iterations: 600000, hash: "SHA-256" as const };

  it("registers then logs in with the same authHash", async () => {
    const { id } = await register({
      email: "e2e@b.co",
      authHash: "client-derived-hash",
      authSalt: "as",
      encSalt: "es",
      kdfParams,
    });
    const res = await login({ email: "e2e@b.co", authHash: "client-derived-hash" });
    expect(await tokens.verify(res.token)).toEqual({ sub: id });
    expect(res.encSalt).toBe("es");
    expect(res.kdfParams).toEqual(kdfParams);
    await expect(login({ email: "e2e@b.co", authHash: "wrong" })).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
