import { describe, expect, it } from "vitest";
import { JwtTokenService } from "./jwt-token-service.js";

const SECRET = "test-secret-test-secret-test-secret";

describe("JwtTokenService", () => {
  const service = new JwtTokenService({ secret: SECRET });

  it("round-trips the subject", async () => {
    const token = await service.sign({ sub: "user-1" });
    expect(await service.verify(token)).toEqual({ sub: "user-1" });
  });

  it("rejects a tampered token", async () => {
    const token = await service.sign({ sub: "user-1" });
    const [h, , s] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "admin" })).toString("base64url");
    await expect(service.verify(`${h}.${forged}.${s}`)).rejects.toThrow();
  });

  it("rejects a token signed with another secret", async () => {
    const other = new JwtTokenService({ secret: "another-secret-another-secret-123" });
    await expect(service.verify(await other.sign({ sub: "u" }))).rejects.toThrow();
  });

  it("rejects an expired token", async () => {
    const short = new JwtTokenService({ secret: SECRET, expiresIn: "-1s" });
    await expect(short.verify(await short.sign({ sub: "u" }))).rejects.toThrow();
  });

  it("rejects unsigned (alg none) tokens", async () => {
    const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const none = `${enc({ alg: "none", typ: "JWT" })}.${enc({ sub: "u" })}.`;
    await expect(service.verify(none)).rejects.toThrow();
  });

  it("refuses a secret shorter than 32 characters", () => {
    expect(() => new JwtTokenService({ secret: "too-short" })).toThrow(/at least 32/);
  });
});
