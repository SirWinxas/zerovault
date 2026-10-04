import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createAuthRateLimiter } from "./rate-limit.js";

describe("createAuthRateLimiter", () => {
  it("allows up to max requests then answers 429 TooManyRequests", async () => {
    const app = express();
    app.use(createAuthRateLimiter({ max: 2, windowMs: 60_000 }));
    app.get("/ping", (_req, res) => void res.json({ ok: true }));

    expect((await request(app).get("/ping")).status).toBe(200);
    expect((await request(app).get("/ping")).status).toBe(200);
    const res = await request(app).get("/ping");
    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: "TooManyRequests" });
  });
});
