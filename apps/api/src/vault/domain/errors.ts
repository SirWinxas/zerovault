/** Thrown both when an item does not exist and when it is not owned by the caller (no existence leak). */
export class VaultItemNotFoundError extends Error {
  constructor() {
    super("Vault item not found");
    this.name = "VaultItemNotFoundError";
  }
}
