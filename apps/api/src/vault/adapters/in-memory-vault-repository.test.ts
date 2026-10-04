import { describe, expect, it } from "vitest";
import { InMemoryVaultRepository } from "./in-memory-vault-repository.js";

describe("InMemoryVaultRepository", () => {
  it("findByIdForUser returns the item to its owner and null to others", async () => {
    const vault = new InMemoryVaultRepository();
    const item = await vault.create({ userId: "A", ciphertext: "c", iv: "i" });
    expect((await vault.findByIdForUser(item.id, "A"))?.id).toBe(item.id);
    expect(await vault.findByIdForUser(item.id, "B")).toBeNull();
  });

  it("listByUser returns only the owner's items", async () => {
    const vault = new InMemoryVaultRepository();
    await vault.create({ userId: "A", ciphertext: "a1", iv: "i" });
    await vault.create({ userId: "B", ciphertext: "b1", iv: "i" });
    const list = await vault.listByUser("A");
    expect(list.map((i) => i.ciphertext)).toEqual(["a1"]);
  });

  it("update returns null for missing or foreign items and leaves them unchanged", async () => {
    const vault = new InMemoryVaultRepository();
    const item = await vault.create({ userId: "A", ciphertext: "c", iv: "i" });
    expect(await vault.update(item.id, "B", { ciphertext: "x", iv: "y" })).toBeNull();
    expect(await vault.update("missing", "A", { ciphertext: "x", iv: "y" })).toBeNull();
    expect((await vault.findByIdForUser(item.id, "A"))?.ciphertext).toBe("c");
  });

  it("update replaces ciphertext/iv and bumps updatedAt", async () => {
    const vault = new InMemoryVaultRepository();
    const item = await vault.create({ userId: "A", ciphertext: "c", iv: "i" });
    await new Promise((r) => setTimeout(r, 5));
    const updated = await vault.update(item.id, "A", { ciphertext: "c2", iv: "i2" });
    expect(updated).toMatchObject({ id: item.id, userId: "A", ciphertext: "c2", iv: "i2" });
    expect(updated!.updatedAt.getTime()).toBeGreaterThan(item.updatedAt.getTime());
    expect(updated!.createdAt).toEqual(item.createdAt);
  });

  it("delete returns false for foreign/missing items and true for the owner", async () => {
    const vault = new InMemoryVaultRepository();
    const item = await vault.create({ userId: "A", ciphertext: "c", iv: "i" });
    expect(await vault.delete(item.id, "B")).toBe(false);
    expect(await vault.delete("missing", "A")).toBe(false);
    expect(await vault.findByIdForUser(item.id, "A")).not.toBeNull();
    expect(await vault.delete(item.id, "A")).toBe(true);
    expect(await vault.listByUser("A")).toEqual([]);
  });
});
