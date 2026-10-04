export interface VaultItem {
  id: string;
  userId: string;
  ciphertext: string;
  iv: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewVaultItem {
  userId: string;
  ciphertext: string;
  iv: string;
}

export interface VaultItemUpdate {
  ciphertext: string;
  iv: string;
}
