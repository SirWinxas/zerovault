import type { VaultItemResponse } from "@zerovault/shared-types";
import type { VaultRepository } from "../ports/vault-repository.js";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export interface ListVaultItemsDeps {
  vault: VaultRepository;
}

export function makeListVaultItems({ vault }: ListVaultItemsDeps) {
  return async function listVaultItems(
    userId: string,
    opts?: { limit?: number; offset?: number },
  ): Promise<VaultItemResponse[]> {
    const limit = Math.min(Math.max(1, opts?.limit ?? DEFAULT_LIMIT), MAX_LIMIT);
    const offset = Math.max(0, opts?.offset ?? 0);
    const items = await vault.listByUser(userId, { limit, offset });
    return items.map(({ id, ciphertext, iv }) => ({ id, ciphertext, iv }));
  };
}
