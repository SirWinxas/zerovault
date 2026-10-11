export interface VaultEntry {
  site: string;
  username: string;
  password: string;
  totp?: string;
  tags?: string[];
}

export interface DecryptedItem extends VaultEntry {
  id: string;
}
