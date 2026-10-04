import type { NewVaultItem, VaultItem, VaultItemUpdate } from "../domain/vault-item.js";
import type { VaultRepository } from "../ports/vault-repository.js";

export interface PrismaVaultRecord {
  id: string;
  userId: string;
  ciphertext: string;
  iv: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrismaVaultClient {
  vaultItem: {
    create(args: {
      data: { userId: string; ciphertext: string; iv: string };
    }): Promise<PrismaVaultRecord>;
    findMany(args: {
      where: { userId: string };
      orderBy?: { createdAt: "asc" | "desc" };
      take?: number;
      skip?: number;
    }): Promise<PrismaVaultRecord[]>;
    findFirst(args: { where: { id: string; userId: string } }): Promise<PrismaVaultRecord | null>;
    updateMany(args: {
      where: { id: string; userId: string };
      data: { ciphertext: string; iv: string };
    }): Promise<{ count: number }>;
    deleteMany(args: { where: { id: string; userId: string } }): Promise<{ count: number }>;
  };
}

function toVaultItem(record: PrismaVaultRecord): VaultItem {
  return {
    id: record.id,
    userId: record.userId,
    ciphertext: record.ciphertext,
    iv: record.iv,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/** Every query is scoped by `userId`: ownership isolation is enforced here. */
export class PrismaVaultRepository implements VaultRepository {
  constructor(private readonly prisma: PrismaVaultClient) {}

  async create(item: NewVaultItem): Promise<VaultItem> {
    const record = await this.prisma.vaultItem.create({
      data: { userId: item.userId, ciphertext: item.ciphertext, iv: item.iv },
    });
    return toVaultItem(record);
  }

  async listByUser(
    userId: string,
    { limit, offset }: { limit: number; offset: number },
  ): Promise<VaultItem[]> {
    const records = await this.prisma.vaultItem.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
    return records.map(toVaultItem);
  }

  async findByIdForUser(id: string, userId: string): Promise<VaultItem | null> {
    const record = await this.prisma.vaultItem.findFirst({ where: { id, userId } });
    return record ? toVaultItem(record) : null;
  }

  async update(id: string, userId: string, patch: VaultItemUpdate): Promise<VaultItem | null> {
    const { count } = await this.prisma.vaultItem.updateMany({
      where: { id, userId },
      data: { ciphertext: patch.ciphertext, iv: patch.iv },
    });
    if (count === 0) return null;
    return this.findByIdForUser(id, userId);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const { count } = await this.prisma.vaultItem.deleteMany({ where: { id, userId } });
    return count > 0;
  }
}
