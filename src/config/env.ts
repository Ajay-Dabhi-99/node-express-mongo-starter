import 'dotenv/config';
import { z } from 'zod';

/**
 * Every environment variable the core app needs is declared and validated here.
 * If something is missing or wrong, the app refuses to start (fail fast)
 * instead of crashing later in production.
 *
 * Module-specific variables (e.g. JWT for auth) live in that module's own config file,
 * so removing a module also removes its env requirements.
 */

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);
const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_NAME: z.string().min(1).default('node-express-mongo-starter'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z
    .string()
    .regex(/^\/[a-z0-9/-]*$/i, 'API_PREFIX must start with "/"')
    .default('/api/v1'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  MONGODB_URI: z
    .string({ required_error: 'MONGODB_URI is required (MongoDB Atlas connection string)' })
    .regex(/^mongodb(\+srv)?:\/\//, 'MONGODB_URI must start with mongodb:// or mongodb+srv://'),
  MONGODB_DB_NAME: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  MONGODB_MAX_POOL_SIZE: z.coerce.number().int().positive().default(10),
  MONGODB_SERVER_SELECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),

  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  BODY_LIMIT: z.string().default('100kb'),
  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),

  DOCS_ENABLED: booleanString.default('true'),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Logger is not available yet (it depends on env), so console is used intentionally.
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration. Check your .env file.');
}

export const env = parsed.data;
export type Env = typeof env;

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
