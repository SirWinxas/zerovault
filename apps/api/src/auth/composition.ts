import { PrismaClient } from "@prisma/client";
import type { Router } from "express";
import { createAuthRouter } from "./adapters/http/auth-router.js";
import { JwtTokenService } from "./adapters/jwt-token-service.js";
import { PrismaUserRepository } from "./adapters/prisma-user-repository.js";
import { ScryptHasher } from "./adapters/scrypt-hasher.js";
import { makeGetAuthParams } from "./use-cases/get-auth-params.js";
import { makeLoginUser } from "./use-cases/login-user.js";
import { makeRegisterUser } from "./use-cases/register-user.js";

/** Composition root for the auth module. Reads env and builds real adapters. */
export function buildAuthRouter(): Router {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required and must not be empty");
  }

  // PrismaClient connects lazily on first query.
  const prisma = new PrismaClient();
  const users = new PrismaUserRepository(prisma);
  const hasher = new ScryptHasher();
  const tokens = new JwtTokenService({ secret });

  return createAuthRouter({
    registerUser: makeRegisterUser({ users, hasher }),
    loginUser: makeLoginUser({ users, hasher, tokens }),
    getAuthParams: makeGetAuthParams({ users }),
  });
}
