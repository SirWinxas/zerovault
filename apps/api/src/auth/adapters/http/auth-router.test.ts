import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { EmailAlreadyRegisteredError, InvalidCredentialsError } from "../../domain/errors.js";
import { createAuthRouter } from "./auth-router.js";

const kdfParams = { iterations: 600000, hash: "SHA-256" as const };
const registerBody = {
  email: "a@b.com",
  authHash: "ah",
  authSalt: "as",
  encSalt: "es",
  kdfParams,
};

function setup() {
  const registerUser = vi.fn(async (): Promise<void> => {});
  const loginUser = vi.fn(async () => ({ token: "t", encSalt: "es", kdfParams }));
  const getAuthParams = vi.fn(async () => ({ authSalt: "as", kdfParams }));
  const app = express();
  app.use(express.json());
  app.use("/auth", createAuthRouter({ registerUser, loginUser, getAuthParams }));
  return { app, registerUser, loginUser, getAuthParams };
}

describe("auth router", () => {
  describe("POST /auth/register", () => {
    it("returns 201 with an empty body for a new email", async () => {
      const { app, registerUser } = setup();
      const res = await request(app).post("/auth/register").send(registerBody);
      expect(res.status).toBe(201);
      expect(res.body).toEqual({});
      expect(registerUser).toHaveBeenCalledWith(registerBody);
    });

    it("returns the identical 201 response when the email already exists (no enumeration oracle)", async () => {
      const { app, registerUser } = setup();
      const fresh = await request(app).post("/auth/register").send(registerBody);
      // Even a stray domain error from the use case must not become a distinguishable status.
      registerUser.mockRejectedValueOnce(new EmailAlreadyRegisteredError());
      const existing = await request(app).post("/auth/register").send(registerBody);
      expect(existing.status).toBe(201);
      expect(existing.body).toEqual({});
      expect(existing.text).toBe(fresh.text);
    });

    it("returns 400 for an invalid body", async () => {
      const { app, registerUser } = setup();
      const res = await request(app).post("/auth/register").send({ email: "a@b.com" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("ValidationError");
      expect(registerUser).not.toHaveBeenCalled();
    });

    it("rejects kdf params below the iteration floor with 400", async () => {
      const { app, registerUser } = setup();
      const res = await request(app)
        .post("/auth/register")
        .send({ ...registerBody, kdfParams: { iterations: 1, hash: "SHA-256" } });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("ValidationError");
      expect(registerUser).not.toHaveBeenCalled();
    });

    it("accepts kdf params at the iteration floor", async () => {
      const { app } = setup();
      const res = await request(app)
        .post("/auth/register")
        .send({ ...registerBody, kdfParams: { iterations: 600000, hash: "SHA-256" } });
      expect(res.status).toBe(201);
    });

    it("logs unexpected errors server-side without leaking details", async () => {
      const { app, registerUser } = setup();
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      const err = new Error("boom");
      registerUser.mockRejectedValueOnce(err);
      const res = await request(app).post("/auth/register").send(registerBody);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "InternalError" });
      expect(spy).toHaveBeenCalledWith("Unhandled auth error:", err);
      spy.mockRestore();
    });

    it("returns 500 for unexpected errors", async () => {
      const { app, registerUser } = setup();
      registerUser.mockRejectedValueOnce(new Error("boom"));
      const res = await request(app).post("/auth/register").send(registerBody);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: "InternalError" });
    });
  });

  describe("POST /auth/login", () => {
    it("returns 200 with token, encSalt and kdfParams", async () => {
      const { app } = setup();
      const res = await request(app).post("/auth/login").send({ email: "a@b.com", authHash: "ah" });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ token: "t", encSalt: "es", kdfParams });
    });

    it("returns 400 for an invalid body", async () => {
      const { app } = setup();
      const res = await request(app).post("/auth/login").send({ email: "nope" });
      expect(res.status).toBe(400);
    });

    it("returns 401 on invalid credentials", async () => {
      const { app, loginUser } = setup();
      loginUser.mockRejectedValueOnce(new InvalidCredentialsError());
      const res = await request(app).post("/auth/login").send({ email: "a@b.com", authHash: "ah" });
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "InvalidCredentials" });
    });
  });

  describe("GET /auth/params", () => {
    it("returns 200 with authSalt and kdfParams", async () => {
      const { app, getAuthParams } = setup();
      const res = await request(app).get("/auth/params").query({ email: "a@b.com" });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ authSalt: "as", kdfParams });
      expect(getAuthParams).toHaveBeenCalledWith("a@b.com");
    });

    it("returns 400 for a missing email", async () => {
      const { app } = setup();
      const res = await request(app).get("/auth/params");
      expect(res.status).toBe(400);
    });

    it("returns 400 for an invalid email", async () => {
      const { app } = setup();
      const res = await request(app).get("/auth/params").query({ email: "nope" });
      expect(res.status).toBe(400);
    });

    it("returns 200 with decoy params for an unknown email (no enumeration oracle)", async () => {
      const { app, getAuthParams } = setup();
      getAuthParams.mockResolvedValueOnce({ authSalt: "decoy-salt", kdfParams });
      const res = await request(app).get("/auth/params").query({ email: "ghost@b.com" });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ authSalt: "decoy-salt", kdfParams });
    });
  });
});
