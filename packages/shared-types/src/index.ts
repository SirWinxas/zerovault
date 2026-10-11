import { z } from "zod";

/**
 * KDF policy shared by server and clients. The floor stops anyone (a client, or a
 * malicious server handing out params) from weakening PBKDF2; the ceiling stops
 * params that would turn derivation into a denial of service.
 */
export const KDF_MIN_ITERATIONS = 600_000;
export const KDF_MAX_ITERATIONS = 10_000_000;

export const KdfParamsSchema = z.object({
  iterations: z.number().int().min(KDF_MIN_ITERATIONS).max(KDF_MAX_ITERATIONS),
  hash: z.literal("SHA-256"),
});
export type KdfParams = z.infer<typeof KdfParamsSchema>;

export const RegisterRequestSchema = z.object({
  email: z.email(),
  authHash: z.string().min(1),
  authSalt: z.string().min(1),
  encSalt: z.string().min(1),
  kdfParams: KdfParamsSchema,
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.email(),
  authHash: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthParamsResponseSchema = z.object({
  authSalt: z.string(),
  kdfParams: KdfParamsSchema,
});
export type AuthParamsResponse = z.infer<typeof AuthParamsResponseSchema>;

export const LoginResponseSchema = z.object({
  token: z.string(),
  encSalt: z.string(),
  kdfParams: KdfParamsSchema,
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const VaultItemDTOSchema = z.object({
  id: z.string().optional(),
  ciphertext: z.string(),
  iv: z.string(),
});
export type VaultItemDTO = z.infer<typeof VaultItemDTOSchema>;

export const CreateVaultItemRequestSchema = z.object({
  ciphertext: z.string().min(1),
  iv: z.string().min(1),
});
export type CreateVaultItemRequest = z.infer<typeof CreateVaultItemRequestSchema>;

export const UpdateVaultItemRequestSchema = z.object({
  ciphertext: z.string().min(1),
  iv: z.string().min(1),
});
export type UpdateVaultItemRequest = z.infer<typeof UpdateVaultItemRequestSchema>;

export const VaultItemResponseSchema = z.object({
  id: z.string(),
  ciphertext: z.string(),
  iv: z.string(),
});
export type VaultItemResponse = z.infer<typeof VaultItemResponseSchema>;

/** Plaintext shape of a vault entry; only ever exists client-side, after decryption. */
export const VaultEntrySchema = z.object({
  site: z.string(),
  username: z.string(),
  password: z.string(),
  totp: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export type VaultEntry = z.infer<typeof VaultEntrySchema>;
