import { z } from '@/core/utils/zod';

export const loginBody = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email()
      .max(254)
      .openapi({ example: 'admin@example.com' }),
    password: z.string().min(1).max(128).openapi({ example: 'ChangeMe@12345' }),
  })
  .strict();

export const refreshTokenBody = z
  .object({
    refreshToken: z.string().min(20).max(512),
  })
  .strict();

export type LoginInput = z.infer<typeof loginBody>;
export type RefreshTokenInput = z.infer<typeof refreshTokenBody>;
