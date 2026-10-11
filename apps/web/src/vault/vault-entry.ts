export interface VaultEntry {
  site: string;
  username: string;
  password: string;
  /** Optional normalized Base32 TOTP secret; lives only inside the encrypted blob. */
  totp?: string;
}

export interface DecryptedVaultItem extends VaultEntry {
  id: string;
  /** True when this record could not be decrypted/parsed; fields are empty. */
  decryptError?: boolean;
}
