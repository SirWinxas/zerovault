import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { createRequireAuth } from "../auth/adapters/http/auth-middleware.js";
import { JwtTokenService } from "../auth/adapters/jwt-token-service.js";
import { createVaultRouter } from "./adapters/http/vault-router.js";
import { PrismaVaultRepository } from "./adapters/prisma-vault-repository.js";
import { makeCreateVaultItem } from "./use-cases/create-vault-item.js";
import { makeDeleteVaultItem } from "./use-cases/delete-vault-item.js";
import { makeListVaultItems } from "./use-cases/list-vault-items.js";
import { makeUpdateVaultItem } from "./use-cases/update-vault-item.js";

/** Composition root for the vault module. Every route is behind JWT auth. */
export function buildVaultRouter(): Router {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required and must not be empty");
  }

  // PrismaClient connects lazily on first query.
  const prisma = new PrismaClient();
  const vault = new PrismaVaultRepository(prisma);
  const requireAuth = createRequireAuth(new JwtTokenService({ secret }));

  const router = Router();
  router.use(requireAuth);
  router.use(
    createVaultRouter({
      createVaultItem: makeCreateVaultItem({ vault }),
      listVaultItems: makeListVaultItems({ vault }),
      updateVaultItem: makeUpdateVaultItem({ vault }),
      deleteVaultItem: makeDeleteVaultItem({ vault }),
    }),
  );
  return router;
}
