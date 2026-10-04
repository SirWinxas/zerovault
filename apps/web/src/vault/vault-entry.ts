export interface VaultEntry {
  site: string;
  username: string;
  password: string;
}

export interface DecryptedVaultItem extends VaultEntry {
  id: string;
}
