import { describe, expect, it } from "vitest";
import { InMemoryUserRepository } from "../adapters/in-memory-user-repository.js";
import { createDecoy } from "../adapters/decoy.js";
import { makeGetAuthParams } from "./get-auth-params.js";

const kdfParams = { iterations: 600000, hash: "SHA-256" as const };

describe("getAuthParams", () => {
  it("returns the real authSalt and kdfParams for a known email", async () => {
    const users = new InMemoryUserRepository();
    await users.create({ email: "a@b.co", authHashHash: "h", authSalt: "as", encSalt: "es", kdfParams });
    const res = await makeGetAuthParams({ users, decoy: createDecoy("test-pepper") })("a@b.co");
    expect(res).toEqual({ authSalt: "as", kdfParams });
  });

  it("returns decoy params for an unknown email instead of throwing", async () => {
    const decoy = createDecoy("test-pepper");
    const get = makeGetAuthParams({ users: new InMemoryUserRepository(), decoy });
    const res = await get("x@y.co");
    expect(res).toEqual({ authSalt: decoy.saltFor("x@y.co"), kdfParams: decoy.kdfParams });
    expect(Buffer.from(res.authSalt, "base64")).toHaveLength(16);
  });

  it("returns a deterministic decoy per email and different ones across emails", async () => {
    const get = makeGetAuthParams({
      users: new InMemoryUserRepository(),
      decoy: createDecoy("test-pepper"),
    });
    const first = await get("x@y.co");
    expect((await get("x@y.co")).authSalt).toBe(first.authSalt);
    expect((await get("z@y.co")).authSalt).not.toBe(first.authSalt);
  });
});
