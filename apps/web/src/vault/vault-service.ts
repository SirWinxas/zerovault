import { decrypt, encrypt } from "@zerovault/crypto";
import {
  VaultEntrySchema,
  type CreateVaultItemRequest,
  type UpdateVaultItemRequest,
  type VaultItemResponse,
} from "@zerovault/shared-types";
import type { ApiClient } from "../lib/api-client";
import type { DecryptedVaultItem, VaultEntry } from "./vault-entry";

export interface VaultService {
  list(): Promise<DecryptedVaultItem[]>;
  create(entry: VaultEntry): Promise<DecryptedVaultItem>;
  update(id: string, entry: VaultEntry): Promise<DecryptedVaultItem>;
  remove(id: string): Promise<void>;
}

/**
 * Client-side encrypted vault. Plaintext entries are encrypted here, before
 * any request; the API only ever sees `{ ciphertext, iv }`.
 */
export function createVaultService(
  api: ApiClient,
  getKey: () => CryptoKey | null,
): VaultService {
  function requireKey(): CryptoKey {
    const key = getKey();
    if (!key) throw new Error("Vault is locked: no encryption key in session");
    return key;
  }

  async function seal(
    key: CryptoKey,
    entry: VaultEntry,
  ): Promise<CreateVaultItemRequest & UpdateVaultItemRequest> {
    const { ciphertext, iv } = await encrypt(key, JSON.stringify(entry));
    return { ciphertext, iv };
  }

  return {
    async list() {
      const key = requireKey();
      const items = await api.get<VaultItemResponse[]>("/vault");
      return Promise.all(
        items.map(async ({ id, ciphertext, iv }): Promise<DecryptedVaultItem> => {
          // One corrupt record must not fail the whole vault load.
          try {
            const parsed = VaultEntrySchema.safeParse(
              JSON.parse(await decrypt(key, { ciphertext, iv })),
            );
            if (!parsed.success) throw new Error("Invalid vault entry shape");
            return { id, ...parsed.data };
          } catch {
            return {
              id,
              site: "",
              username: "",
              password: "",
              decryptError: true,
            };
          }
        }),
      );
    },

    async create(entry) {
      const key = requireKey();
      const res = await api.post<VaultItemResponse>(
        "/vault",
        await seal(key, entry),
      );
      return { id: res.id, ...entry };
    },

    async update(id, entry) {
      const key = requireKey();
      await api.put<VaultItemResponse>(`/vault/${id}`, await seal(key, entry));
      return { id, ...entry };
    },

    async remove(id) {
      await api.del(`/vault/${id}`);
    },
  };
}
