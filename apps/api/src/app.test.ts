import request from "supertest";
import { describe, expect, it } from "vitest";
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
});
