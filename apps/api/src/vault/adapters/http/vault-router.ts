import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { CreateVaultItemRequestSchema, UpdateVaultItemRequestSchema } from "@zerovault/shared-types";
import { ZodError } from "zod";
import { VaultItemNotFoundError } from "../../domain/errors.js";
import type { makeCreateVaultItem } from "../../use-cases/create-vault-item.js";
import type { makeDeleteVaultItem } from "../../use-cases/delete-vault-item.js";
import type { makeListVaultItems } from "../../use-cases/list-vault-items.js";
import type { makeUpdateVaultItem } from "../../use-cases/update-vault-item.js";

export interface VaultRouterDeps {
  createVaultItem: ReturnType<typeof makeCreateVaultItem>;
  listVaultItems: ReturnType<typeof makeListVaultItems>;
  updateVaultItem: ReturnType<typeof makeUpdateVaultItem>;
  deleteVaultItem: ReturnType<typeof makeDeleteVaultItem>;
}

/** Assumes `req.userId` was set by an auth middleware mounted before this router. */
export function createVaultRouter({
  createVaultItem,
  listVaultItems,
  updateVaultItem,
  deleteVaultItem,
}: VaultRouterDeps): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    const userId = req.userId;
    if (!userId) return void unauthorized(res);
    const input = CreateVaultItemRequestSchema.parse(req.body);
    res.status(201).json(await createVaultItem(userId, input));
  });

  router.get("/", async (req, res) => {
    const userId = req.userId;
    if (!userId) return void unauthorized(res);
    res.status(200).json(await listVaultItems(userId));
  });

  router.put("/:id", async (req, res) => {
    const userId = req.userId;
    if (!userId) return void unauthorized(res);
    const patch = UpdateVaultItemRequestSchema.parse(req.body);
    res.status(200).json(await updateVaultItem(userId, req.params.id, patch));
  });

  router.delete("/:id", async (req, res) => {
    const userId = req.userId;
    if (!userId) return void unauthorized(res);
    await deleteVaultItem(userId, req.params.id);
    res.status(204).end();
  });

  router.use(handleVaultError);

  return router;
}

function unauthorized(res: Response): void {
  res.status(401).json({ error: "Unauthorized" });
}

function handleVaultError(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "ValidationError", details: err.issues });
  } else if (err instanceof VaultItemNotFoundError) {
    res.status(404).json({ error: "VaultItemNotFound" });
  } else {
    console.error("Unhandled vault error:", err);
    res.status(500).json({ error: "InternalError" });
  }
}
