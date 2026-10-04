import { z } from "zod";

export const KdfParamsSchema = z.object({
  iterations: z.number().int().positive(),
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
