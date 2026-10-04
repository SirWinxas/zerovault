import express from "express";
import type { Request } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import type { TokenService } from "../../ports/token-service.js";
import { createRequireAuth } from "./auth-middleware.js";

function setup(verify: TokenService["verify"]) {
  const tokens: TokenService = { sign: vi.fn(), verify: vi.fn(verify) };
  const seen: Array<string | undefined> = [];
  const app = express();
  app.use(createRequireAuth(tokens));
  app.get("/", (req: Request, res) => {
    seen.push(req.userId);
    res.status(200).json({ ok: true });
  });
  return { app, tokens, seen };
}

describe("createRequireAuth", () => {
  it("returns 401 when the Authorization header is absent", async () => {
    const { app, tokens, seen } = setup(async () => ({ sub: "u1" }));
    const res = await request(app).get("/");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
    expect(tokens.verify).not.toHaveBeenCalled();
    expect(seen).toEqual([]);
  });

  it("returns 401 when the scheme is not Bearer", async () => {
    const { app, seen } = setup(async () => ({ sub: "u1" }));
    const res = await request(app).get("/").set("Authorization", "Basic abc");
    expect(res.status).toBe(401);
    expect(seen).toEqual([]);
  });

  it("returns 401 when the Bearer token is empty", async () => {
    const { app } = setup(async () => ({ sub: "u1" }));
    const res = await request(app).get("/").set("Authorization", "Bearer ");
    expect(res.status).toBe(401);
  });

  it("returns 401 without leaking the error when verify throws", async () => {
    const { app, seen } = setup(async () => {
      throw new Error("secret detail");
    });
    const res = await request(app).get("/").set("Authorization", "Bearer bad");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
    expect(JSON.stringify(res.body)).not.toContain("secret detail");
    expect(seen).toEqual([]);
  });

  it("sets req.userId and calls next for a valid token (case-insensitive scheme)", async () => {
    const { app, tokens, seen } = setup(async () => ({ sub: "u42" }));
    const res = await request(app).get("/").set("Authorization", "bearer good");
    expect(res.status).toBe(200);
    expect(tokens.verify).toHaveBeenCalledWith("good");
    expect(seen).toEqual(["u42"]);
  });
});
