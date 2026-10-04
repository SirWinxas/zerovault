import { randomUUID } from "node:crypto";
import type { NewVaultItem, VaultItem, VaultItemUpdate } from "../domain/vault-item.js";
import type { VaultRepository } from "../ports/vault-repository.js";

/** Test double: not for production use. Every access is scoped to the owning user. */
export class InMemoryVaultRepository implements VaultRepository {
  private readonly items = new Map<string, VaultItem>();

  async create(item: NewVaultItem): Promise<VaultItem> {
    const now = new Date();
    const stored: VaultItem = { ...item, id: randomUUID(), createdAt: now, updatedAt: now };
    this.items.set(stored.id, stored);
    return { ...stored };
  }

  async listByUser(userId: string): Promise<VaultItem[]> {
    return [...this.items.values()].filter((i) => i.userId === userId).map((i) => ({ ...i }));
  }

  async findByIdForUser(id: string, userId: string): Promise<VaultItem | null> {
    const found = this.owned(id, userId);
    return found ? { ...found } : null;
  }

  async update(id: string, userId: string, patch: VaultItemUpdate): Promise<VaultItem | null> {
    const found = this.owned(id, userId);
    if (!found) return null;
    const updated: VaultItem = {
      ...found,
      ciphertext: patch.ciphertext,
      iv: patch.iv,
      updatedAt: new Date(),
    };
    this.items.set(id, updated);
    return { ...updated };
  }

  async delete(id: string, userId: string): Promise<boolean> {
    return this.owned(id, userId) ? this.items.delete(id) : false;
  }

  private owned(id: string, userId: string): VaultItem | undefined {
    const found = this.items.get(id);
    return found && found.userId === userId ? found : undefined;
  }
}
