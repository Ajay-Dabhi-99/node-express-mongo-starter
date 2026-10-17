import { z } from 'zod';
import { env, isProduction } from '@/config/env';

/**
 * Env variables needed ONLY by the auth module.
 * Kept here (not in config/env.ts) so deleting the auth module removes them too.
 */
const authEnvSchema = z.object({
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_ISSUER: z.string().min(1).default(env.APP_NAME),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
});

const parsed = authEnvSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid auth environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid auth configuration. Check your .env file.');
}

if (isProduction && parsed.data.JWT_ACCESS_SECRET.startsWith('change-me')) {
  throw new Error('JWT_ACCESS_SECRET still uses the example value. Generate a real secret.');
}

export const authConfig = parsed.data;
