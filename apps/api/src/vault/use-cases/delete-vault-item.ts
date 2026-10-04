import { VaultItemNotFoundError } from "../domain/errors.js";
import type { VaultRepository } from "../ports/vault-repository.js";

export interface DeleteVaultItemDeps {
  vault: VaultRepository;
}

export function makeDeleteVaultItem({ vault }: DeleteVaultItemDeps) {
  return async function deleteVaultItem(userId: string, id: string): Promise<void> {
    if (!(await vault.delete(id, userId))) throw new VaultItemNotFoundError();
  };
}
