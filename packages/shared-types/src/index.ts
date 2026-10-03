import { z } from "zod";

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  authHash: z.string(),
  kdfSalt: z.string(),
  kdfParams: z.record(z.string(), z.unknown()),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  authHash: z.string(),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const VaultItemDTOSchema = z.object({
  id: z.string().optional(),
  ciphertext: z.string(),
  iv: z.string(),
});
export type VaultItemDTO = z.infer<typeof VaultItemDTOSchema>;
