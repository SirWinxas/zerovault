import { describe, expect, it } from "vitest";
import { InvalidCredentialsError } from "../domain/errors.js";
import { InMemoryUserRepository } from "../adapters/in-memory-user-repository.js";
import { makeGetAuthParams } from "./get-auth-params.js";

const kdfParams = { iterations: 600000, hash: "SHA-256" as const };

describe("getAuthParams", () => {
  it("returns authSalt and kdfParams only", async () => {
    const users = new InMemoryUserRepository();
    await users.create({ email: "a@b.co", authHashHash: "h", authSalt: "as", encSalt: "es", kdfParams });
    const res = await makeGetAuthParams({ users })("a@b.co");
    expect(res).toEqual({ authSalt: "as", kdfParams });
  });

  it("rejects an unknown email", async () => {
    const get = makeGetAuthParams({ users: new InMemoryUserRepository() });
    await expect(get("x@y.co")).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
