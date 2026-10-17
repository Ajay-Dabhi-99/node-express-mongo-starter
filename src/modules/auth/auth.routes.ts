import { Router } from 'express';
import { createRateLimiter } from '@/core/middlewares/rate-limiter';
import { validate } from '@/core/middlewares/validate';
import { authController } from './auth.controller';
import { authenticate } from './auth.middleware';
import { loginBody, refreshTokenBody } from './auth.schema';

// Strict limit on login to slow down password guessing (brute force).
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

export const authRouter: Router = Router();

authRouter.post('/login', loginLimiter, validate({ body: loginBody }), authController.login);
authRouter.post('/refresh', validate({ body: refreshTokenBody }), authController.refresh);
authRouter.post('/logout', validate({ body: refreshTokenBody }), authController.logout);
authRouter.get('/me', authenticate, authController.me);
