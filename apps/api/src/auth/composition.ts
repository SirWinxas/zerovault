import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { MIN_SECRET_LENGTH, requireSecret } from "../config/require-secret.js";
import { createAuthRateLimiter } from "./adapters/http/rate-limit.js";
import { createAuthRouter } from "./adapters/http/auth-router.js";
import { createDecoy } from "./adapters/decoy.js";
import { JwtTokenService } from "./adapters/jwt-token-service.js";
import { PrismaUserRepository } from "./adapters/prisma-user-repository.js";
import { ScryptHasher } from "./adapters/scrypt-hasher.js";
import { makeGetAuthParams } from "./use-cases/get-auth-params.js";
import { makeLoginUser } from "./use-cases/login-user.js";
import { makeRegisterUser } from "./use-cases/register-user.js";

/** Composition root for the auth module. Reads env and builds real adapters. */
export function buildAuthRouter(): Router {
  const secret = requireSecret("JWT_SECRET", process.env.JWT_SECRET, MIN_SECRET_LENGTH);
  const pepper = requireSecret("AUTH_PEPPER", process.env.AUTH_PEPPER, MIN_SECRET_LENGTH);
  const decoy = createDecoy(pepper);

  // PrismaClient connects lazily on first query.
  const prisma = new PrismaClient();
  const users = new PrismaUserRepository(prisma);
  const hasher = new ScryptHasher();
  const tokens = new JwtTokenService({ secret });

  // The limiter runs before every auth route (in-memory store: per-instance, fine for the MVP).
  const router = Router();
  router.use(createAuthRateLimiter());
  router.use(
    createAuthRouter({
      registerUser: makeRegisterUser({ users, hasher }),
      loginUser: makeLoginUser({ users, hasher, tokens, decoyHash: decoy.hash }),
      getAuthParams: makeGetAuthParams({ users, decoy }),
    }),
  );
  return router;
}
