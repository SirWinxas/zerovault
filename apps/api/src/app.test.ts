import { Router } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp, resolveCorsOrigin, resolveTrustProxyHops } from "./app.js";
import { app } from "./index.js";

describe("GET /health", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("CORS", () => {
  it("reflects the request origin on a simple cross-origin request", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "https://zerovault.example");
    expect(res.headers["access-control-allow-origin"]).toBe(
      "https://zerovault.example",
    );
  });

  it("answers a preflight with the allowed method and the Authorization header", async () => {
    const res = await request(app)
      .options("/vault")
      .set("Origin", "https://zerovault.example")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "authorization,content-type");
    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-methods"]).toContain("POST");
    expect(
      res.headers["access-control-allow-headers"]?.toLowerCase(),
    ).toContain("authorization");
  });

  it("only allows the configured WEB_ORIGIN when set", async () => {
    const configured = createApp({ env: { WEB_ORIGIN: "https://app.zerovault.example" } });
    const allowed = await request(configured).get("/health").set("Origin", "https://app.zerovault.example");
    expect(allowed.headers["access-control-allow-origin"]).toBe("https://app.zerovault.example");
    const denied = await request(configured).get("/health").set("Origin", "https://evil.example");
    expect(denied.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("fails closed in production when WEB_ORIGIN is unset", () => {
    expect(() => resolveCorsOrigin({ NODE_ENV: "production" })).toThrow(/WEB_ORIGIN/);
    expect(() => createApp({ env: { NODE_ENV: "production" } })).toThrow(/WEB_ORIGIN/);
  });

  it("never reflects arbitrary origins in production", () => {
    expect(resolveCorsOrigin({ NODE_ENV: "production", WEB_ORIGIN: "https://a.co, https://b.co" })).toEqual([
      "https://a.co",
      "https://b.co",
    ]);
  });
});

describe("security headers", () => {
  it("sets Helmet headers on responses", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("trust proxy", () => {
  const ipRouter = Router().get("/", (req, res) => {
    res.json({ ip: req.ip });
  });

  it("uses the X-Forwarded-For client address when one proxy hop is trusted", async () => {
    const proxied = createApp({ env: { TRUST_PROXY_HOPS: "1" }, routes: [["/ip", ipRouter]] });
    const res = await request(proxied).get("/ip").set("X-Forwarded-For", "203.0.113.7");
    expect(res.body.ip).toBe("203.0.113.7");
  });

  it("ignores X-Forwarded-For when no proxy is trusted", async () => {
    const direct = createApp({ env: { TRUST_PROXY_HOPS: "0" }, routes: [["/ip", ipRouter]] });
    const res = await request(direct).get("/ip").set("X-Forwarded-For", "203.0.113.7");
    expect(res.body.ip).not.toBe("203.0.113.7");
  });

  it("defaults to 1 hop in production and 0 elsewhere", () => {
    expect(resolveTrustProxyHops({ NODE_ENV: "production" })).toBe(1);
    expect(resolveTrustProxyHops({})).toBe(0);
    expect(resolveTrustProxyHops({ NODE_ENV: "production", TRUST_PROXY_HOPS: "2" })).toBe(2);
  });

  it("rejects a non-numeric TRUST_PROXY_HOPS", () => {
    expect(() => resolveTrustProxyHops({ TRUST_PROXY_HOPS: "yes" })).toThrow(/TRUST_PROXY_HOPS/);
    expect(() => resolveTrustProxyHops({ TRUST_PROXY_HOPS: "-1" })).toThrow(/TRUST_PROXY_HOPS/);
  });
});

describe("app-level error handling", () => {
  const echo = Router().post("/", (req, res) => {
    res.json(req.body);
  });

  it("maps malformed JSON to a generic 400 with no stack or parser details", async () => {
    const withEcho = createApp({ env: {}, routes: [["/echo", echo]] });
    const res = await request(withEcho)
      .post("/echo")
      .set("Content-Type", "application/json")
      .send('{"broken":');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "BadRequest" });
    expect(res.text).not.toMatch(/at |SyntaxError|stack|Unexpected/);
  });

  it("returns a JSON 404 for unknown routes", async () => {
    const res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "NotFound" });
  });

  it("maps unexpected errors to a generic 500", async () => {
    const failing = Router().get("/", () => {
      throw new Error("internal detail");
    });
    const original = console.error;
    console.error = () => {};
    try {
      const res = await request(createApp({ env: {}, routes: [["/fail", failing]] })).get("/fail");
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "InternalError" });
      expect(res.text).not.toContain("internal detail");
    } finally {
      console.error = original;
    }
  });
});
