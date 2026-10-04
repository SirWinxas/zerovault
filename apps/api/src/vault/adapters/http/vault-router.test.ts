import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createRequireAuth } from "../../../auth/adapters/http/auth-middleware.js";
import type { TokenService } from "../../../auth/ports/token-service.js";
import { VaultItemNotFoundError } from "../../domain/errors.js";
import { createVaultRouter } from "./vault-router.js";

const item = { id: "i1", ciphertext: "c", iv: "v" };
const body = { ciphertext: "c", iv: "v" };

function makeDeps() {
  return {
    createVaultItem: vi.fn(async (..._a: unknown[]) => item),
    listVaultItems: vi.fn(async (..._a: unknown[]) => [item]),
    updateVaultItem: vi.fn(async (..._a: unknown[]) => item),
    deleteVaultItem: vi.fn(async (..._a: unknown[]): Promise<void> => undefined),
  };
}

function setup() {
  const deps = makeDeps();
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.userId = "u1";
    next();
  });
  app.use("/vault", createVaultRouter(deps));
  return { app, deps };
}

describe("vault router", () => {
  it("POST / creates an item with userId from context", async () => {
    const { app, deps } = setup();
    const res = await request(app).post("/vault").send({ ...body, userId: "evil" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual(item);
    expect(deps.createVaultItem.mock.calls[0]![0]).toBe("u1");
  });

  it("POST / returns 400 for an invalid body", async () => {
    const { app, deps } = setup();
    const res = await request(app).post("/vault").send({ ciphertext: "c" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ValidationError");
    expect(deps.createVaultItem).not.toHaveBeenCalled();
  });

  it("GET / lists items for the caller", async () => {
    const { app, deps } = setup();
    const res = await request(app).get("/vault");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([item]);
    expect(deps.listVaultItems).toHaveBeenCalledWith("u1");
  });

  it("PUT /:id updates an item", async () => {
    const { app, deps } = setup();
    const res = await request(app).put("/vault/i1").send(body);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(item);
    expect(deps.updateVaultItem.mock.calls[0]!.slice(0, 2)).toEqual(["u1", "i1"]);
  });

  it("PUT /:id returns 404 when not found", async () => {
    const { app, deps } = setup();
    deps.updateVaultItem.mockRejectedValueOnce(new VaultItemNotFoundError());
    const res = await request(app).put("/vault/i1").send(body);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "VaultItemNotFound" });
  });

  it("PUT /:id returns 400 for an invalid body", async () => {
    const { app, deps } = setup();
    const res = await request(app).put("/vault/i1").send({});
    expect(res.status).toBe(400);
    expect(deps.updateVaultItem).not.toHaveBeenCalled();
  });

  it("DELETE /:id returns 204 with no body", async () => {
    const { app, deps } = setup();
    const res = await request(app).delete("/vault/i1");
    expect(res.status).toBe(204);
    expect(res.text).toBe("");
    expect(deps.deleteVaultItem).toHaveBeenCalledWith("u1", "i1");
  });

  it("DELETE /:id returns 404 when not found", async () => {
    const { app, deps } = setup();
    deps.deleteVaultItem.mockRejectedValueOnce(new VaultItemNotFoundError());
    const res = await request(app).delete("/vault/i1");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "VaultItemNotFound" });
  });

  it("returns 500 InternalError for unexpected failures", async () => {
    const { app, deps } = setup();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    deps.listVaultItems.mockRejectedValueOnce(new Error("boom"));
    const res = await request(app).get("/vault");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "InternalError" });
    spy.mockRestore();
  });

  it("returns 401 when req.userId is missing (defensive)", async () => {
    const deps = makeDeps();
    const app = express();
    app.use(express.json());
    app.use("/vault", createVaultRouter(deps));
    const res = await request(app).get("/vault");
    expect(res.status).toBe(401);
    expect(deps.listVaultItems).not.toHaveBeenCalled();
  });
});

describe("requireAuth + vault router integration", () => {
  it("rejects requests without Authorization and never calls use cases", async () => {
    const deps = makeDeps();
    const tokens: TokenService = { sign: vi.fn(), verify: vi.fn(async () => ({ sub: "u1" })) };
    const app = express();
    app.use(express.json());
    app.use("/vault", createRequireAuth(tokens), createVaultRouter(deps));
    for (const res of [
      await request(app).get("/vault"),
      await request(app).post("/vault").send(body),
      await request(app).put("/vault/i1").send(body),
      await request(app).delete("/vault/i1"),
    ]) {
      expect(res.status).toBe(401);
    }
    expect(deps.createVaultItem).not.toHaveBeenCalled();
    expect(deps.listVaultItems).not.toHaveBeenCalled();
    expect(deps.updateVaultItem).not.toHaveBeenCalled();
    expect(deps.deleteVaultItem).not.toHaveBeenCalled();
  });
});
