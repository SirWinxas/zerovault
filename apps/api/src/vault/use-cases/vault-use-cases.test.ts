import { describe, expect, it } from "vitest";
import { InMemoryVaultRepository } from "../adapters/in-memory-vault-repository.js";
import { VaultItemNotFoundError } from "../domain/errors.js";
import { makeCreateVaultItem } from "./create-vault-item.js";
import { makeDeleteVaultItem } from "./delete-vault-item.js";
import { makeListVaultItems } from "./list-vault-items.js";
import { makeUpdateVaultItem } from "./update-vault-item.js";

function setup() {
  const vault = new InMemoryVaultRepository();
  return {
    vault,
    create: makeCreateVaultItem({ vault }),
    list: makeListVaultItems({ vault }),
    update: makeUpdateVaultItem({ vault }),
    del: makeDeleteVaultItem({ vault }),
  };
}

describe("vault use cases", () => {
  it("create returns an id and stores the item under the caller's userId", async () => {
    const { create, vault } = setup();
    const res = await create("A", { ciphertext: "c", iv: "i" });
    expect(res).toEqual({ id: expect.any(String), ciphertext: "c", iv: "i" });
    const stored = await vault.listByUser("A");
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ id: res.id, userId: "A" });
  });

  it("list returns only the caller's items (cross-user isolation)", async () => {
    const { create, list } = setup();
    const a = await create("A", { ciphertext: "a", iv: "i" });
    await create("B", { ciphertext: "b", iv: "i" });
    expect(await list("A")).toEqual([a]);
  });

  it("update changes the owner's item and advances updatedAt", async () => {
    const { create, update, vault } = setup();
    const { id } = await create("A", { ciphertext: "c", iv: "i" });
    const before = (await vault.findByIdForUser(id, "A"))!;
    await new Promise((r) => setTimeout(r, 5));
    const res = await update("A", id, { ciphertext: "c2", iv: "i2" });
    expect(res).toEqual({ id, ciphertext: "c2", iv: "i2" });
    const after = (await vault.findByIdForUser(id, "A"))!;
    expect(after.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime());
  });

  it("update of another user's item throws NotFound and leaves it unchanged", async () => {
    const { create, update, vault } = setup();
    const { id } = await create("A", { ciphertext: "c", iv: "i" });
    await expect(update("B", id, { ciphertext: "x", iv: "y" })).rejects.toBeInstanceOf(VaultItemNotFoundError);
    expect(await vault.findByIdForUser(id, "A")).toMatchObject({ ciphertext: "c", iv: "i" });
  });

  it("update of a missing item throws NotFound", async () => {
    const { update } = setup();
    await expect(update("A", "nope", { ciphertext: "x", iv: "y" })).rejects.toBeInstanceOf(VaultItemNotFoundError);
  });

  it("delete removes the owner's item", async () => {
    const { create, del, list } = setup();
    const { id } = await create("A", { ciphertext: "c", iv: "i" });
    await del("A", id);
    expect(await list("A")).toEqual([]);
  });

  it("delete of another user's item throws NotFound and the item survives", async () => {
    const { create, del, list } = setup();
    const { id } = await create("A", { ciphertext: "c", iv: "i" });
    await expect(del("B", id)).rejects.toBeInstanceOf(VaultItemNotFoundError);
    expect(await list("A")).toHaveLength(1);
  });
});
