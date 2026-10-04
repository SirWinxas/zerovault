import type { NewVaultItem, VaultItem, VaultItemUpdate } from "../domain/vault-item.js";

export interface VaultRepository {
  create(item: NewVaultItem): Promise<VaultItem>;
  listByUser(userId: string): Promise<VaultItem[]>;
  findByIdForUser(id: string, userId: string): Promise<VaultItem | null>;
  /** Returns null if the item is missing or not owned by `userId`. */
  update(id: string, userId: string, patch: VaultItemUpdate): Promise<VaultItem | null>;
  /** Returns false if the item is missing or not owned by `userId`. */
  delete(id: string, userId: string): Promise<boolean>;
}
