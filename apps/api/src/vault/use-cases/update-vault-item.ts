import type { UpdateVaultItemRequest, VaultItemResponse } from "@zerovault/shared-types";
import { VaultItemNotFoundError } from "../domain/errors.js";
import type { VaultRepository } from "../ports/vault-repository.js";

export interface UpdateVaultItemDeps {
  vault: VaultRepository;
}

export function makeUpdateVaultItem({ vault }: UpdateVaultItemDeps) {
  return async function updateVaultItem(
    userId: string,
    id: string,
    patch: UpdateVaultItemRequest,
  ): Promise<VaultItemResponse> {
    const updated = await vault.update(id, userId, {
      ciphertext: patch.ciphertext,
      iv: patch.iv,
    });
    if (!updated) throw new VaultItemNotFoundError();
    return { id: updated.id, ciphertext: updated.ciphertext, iv: updated.iv };
  };
}
