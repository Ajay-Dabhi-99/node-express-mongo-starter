import { rateLimit } from 'express-rate-limit';
import { env, isTest } from '@/config/env';
import { TooManyRequestsError } from '@/core/errors/app-error';

interface RateLimiterOptions {
  windowMs: number;
  limit: number;
  message?: string;
}

/**
 * Factory so each route group can have its own limit
 * (e.g. strict for /auth/login, relaxed for normal API calls).
 * Note: this uses in-memory storage (per instance). When you run multiple instances,
 * plug in a shared store (e.g. Redis) via the "store" option.
 */
export function createRateLimiter({ windowMs, limit, message }: RateLimiterOptions) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => isTest,
    handler: (_req, _res, next) => next(new TooManyRequestsError(message)),
  });
}

export const apiRateLimiter = createRateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
});
