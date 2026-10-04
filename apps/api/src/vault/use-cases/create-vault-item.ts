import type { CreateVaultItemRequest, VaultItemResponse } from "@zerovault/shared-types";
import type { VaultRepository } from "../ports/vault-repository.js";

export interface CreateVaultItemDeps {
  vault: VaultRepository;
}

export function makeCreateVaultItem({ vault }: CreateVaultItemDeps) {
  return async function createVaultItem(
    userId: string,
    input: CreateVaultItemRequest,
  ): Promise<VaultItemResponse> {
    const { id, ciphertext, iv } = await vault.create({
      userId,
      ciphertext: input.ciphertext,
      iv: input.iv,
    });
    return { id, ciphertext, iv };
  };
}
