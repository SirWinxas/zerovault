import type { VaultItemResponse } from "@zerovault/shared-types";
import type { VaultRepository } from "../ports/vault-repository.js";

export interface ListVaultItemsDeps {
  vault: VaultRepository;
}

export function makeListVaultItems({ vault }: ListVaultItemsDeps) {
  return async function listVaultItems(userId: string): Promise<VaultItemResponse[]> {
    const items = await vault.listByUser(userId);
    return items.map(({ id, ciphertext, iv }) => ({ id, ciphertext, iv }));
  };
}
