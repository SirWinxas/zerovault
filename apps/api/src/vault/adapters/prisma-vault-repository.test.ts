import { describe, expect, it } from "vitest";
import {
  PrismaVaultRepository,
  type PrismaVaultClient,
  type PrismaVaultRecord,
} from "./prisma-vault-repository.js";

type Args<K extends keyof PrismaVaultClient["vaultItem"]> = Parameters<
  PrismaVaultClient["vaultItem"][K]
>[0];

const now = new Date("2026-01-01T00:00:00Z");

function record(overrides: Partial<PrismaVaultRecord> = {}): PrismaVaultRecord {
  return {
    id: "item-1",
    userId: "user-1",
    ciphertext: "ct",
    iv: "iv",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

interface FakeOptions {
  created?: PrismaVaultRecord;
  list?: PrismaVaultRecord[];
  found?: PrismaVaultRecord | null;
  updateCount?: number;
  deleteCount?: number;
}

function createFake(options: FakeOptions = {}) {
  const calls = {
    create: [] as Args<"create">[],
    findMany: [] as Args<"findMany">[],
    findFirst: [] as Args<"findFirst">[],
    updateMany: [] as Args<"updateMany">[],
    deleteMany: [] as Args<"deleteMany">[],
  };
  const client: PrismaVaultClient = {
    vaultItem: {
      async create(args) {
        calls.create.push(args);
        return options.created ?? record();
      },
      async findMany(args) {
        calls.findMany.push(args);
        return options.list ?? [];
      },
      async findFirst(args) {
        calls.findFirst.push(args);
        return options.found === undefined ? record() : options.found;
      },
      async updateMany(args) {
        calls.updateMany.push(args);
        return { count: options.updateCount ?? 1 };
      },
      async deleteMany(args) {
        calls.deleteMany.push(args);
        return { count: options.deleteCount ?? 1 };
      },
    },
  };
  return { client, calls };
}

describe("PrismaVaultRepository", () => {
  it("create passes userId/ciphertext/iv and maps the record", async () => {
    const { client, calls } = createFake({ created: record({ id: "new" }) });
    const item = await new PrismaVaultRepository(client).create({
      userId: "user-1",
      ciphertext: "ct",
      iv: "iv",
    });
    expect(calls.create).toEqual([{ data: { userId: "user-1", ciphertext: "ct", iv: "iv" } }]);
    expect(item).toEqual({
      id: "new",
      userId: "user-1",
      ciphertext: "ct",
      iv: "iv",
      createdAt: now,
      updatedAt: now,
    });
  });

  it("listByUser scopes findMany by userId and maps results", async () => {
    const { client, calls } = createFake({
      list: [record({ id: "a" }), record({ id: "b" })],
    });
    const items = await new PrismaVaultRepository(client).listByUser("user-1");
    expect(calls.findMany).toHaveLength(1);
    expect(calls.findMany[0]?.where).toEqual({ userId: "user-1" });
    expect(items.map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("findByIdForUser scopes by BOTH id and userId", async () => {
    const { client, calls } = createFake();
    const item = await new PrismaVaultRepository(client).findByIdForUser("item-1", "user-1");
    expect(calls.findFirst[0]?.where).toEqual({ id: "item-1", userId: "user-1" });
    expect(item?.id).toBe("item-1");
  });

  it("findByIdForUser returns null when not found", async () => {
    const { client } = createFake({ found: null });
    expect(await new PrismaVaultRepository(client).findByIdForUser("x", "user-1")).toBeNull();
  });

  it("update scopes the write by id and userId and returns the re-read row", async () => {
    const { client, calls } = createFake({
      updateCount: 1,
      found: record({ ciphertext: "new-ct", iv: "new-iv" }),
    });
    const item = await new PrismaVaultRepository(client).update("item-1", "user-1", {
      ciphertext: "new-ct",
      iv: "new-iv",
    });
    expect(calls.updateMany).toEqual([
      {
        where: { id: "item-1", userId: "user-1" },
        data: { ciphertext: "new-ct", iv: "new-iv" },
      },
    ]);
    expect(calls.findFirst[0]?.where).toEqual({ id: "item-1", userId: "user-1" });
    expect(item?.ciphertext).toBe("new-ct");
  });

  it("update returns null and skips findFirst when nothing matched", async () => {
    const { client, calls } = createFake({ updateCount: 0 });
    const item = await new PrismaVaultRepository(client).update("item-1", "other", {
      ciphertext: "c",
      iv: "i",
    });
    expect(item).toBeNull();
    expect(calls.updateMany[0]?.where).toEqual({ id: "item-1", userId: "other" });
    expect(calls.findFirst).toHaveLength(0);
  });

  it("update returns null if the re-read finds nothing", async () => {
    const { client } = createFake({ updateCount: 1, found: null });
    expect(
      await new PrismaVaultRepository(client).update("item-1", "user-1", { ciphertext: "c", iv: "i" }),
    ).toBeNull();
  });

  it("delete returns true when a row was deleted, scoped by id and userId", async () => {
    const { client, calls } = createFake({ deleteCount: 1 });
    expect(await new PrismaVaultRepository(client).delete("item-1", "user-1")).toBe(true);
    expect(calls.deleteMany[0]?.where).toEqual({ id: "item-1", userId: "user-1" });
  });

  it("delete returns false when nothing matched", async () => {
    const { client, calls } = createFake({ deleteCount: 0 });
    expect(await new PrismaVaultRepository(client).delete("item-1", "other")).toBe(false);
    expect(calls.deleteMany[0]?.where).toEqual({ id: "item-1", userId: "other" });
  });
});
