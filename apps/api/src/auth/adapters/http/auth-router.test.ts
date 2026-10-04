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
  const registerUser = vi.fn(async () => ({ id: "u1" }));
  const loginUser = vi.fn(async () => ({ token: "t", encSalt: "es", kdfParams }));
  const getAuthParams = vi.fn(async () => ({ authSalt: "as", kdfParams }));
  const app = express();
  app.use(express.json());
  app.use("/auth", createAuthRouter({ registerUser, loginUser, getAuthParams }));
  return { app, registerUser, loginUser, getAuthParams };
}

describe("auth router", () => {
  describe("POST /auth/register", () => {
    it("returns 201 with the new id", async () => {
      const { app, registerUser } = setup();
      const res = await request(app).post("/auth/register").send(registerBody);
      expect(res.status).toBe(201);
      expect(res.body).toEqual({ id: "u1" });
      expect(registerUser).toHaveBeenCalledWith(registerBody);
    });

    it("returns 400 for an invalid body", async () => {
      const { app, registerUser } = setup();
      const res = await request(app).post("/auth/register").send({ email: "a@b.com" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("ValidationError");
      expect(registerUser).not.toHaveBeenCalled();
    });

    it("returns 409 when the email is already registered", async () => {
      const { app, registerUser } = setup();
      registerUser.mockRejectedValueOnce(new EmailAlreadyRegisteredError());
      const res = await request(app).post("/auth/register").send(registerBody);
      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: "EmailAlreadyRegistered" });
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

    it("returns 401 on invalid credentials", async () => {
      const { app, getAuthParams } = setup();
      getAuthParams.mockRejectedValueOnce(new InvalidCredentialsError());
      const res = await request(app).get("/auth/params").query({ email: "a@b.com" });
      expect(res.status).toBe(401);
    });
  });
});
