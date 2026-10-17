import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '@/core/errors/app-error';
import { authConfig } from './auth.config';
import type { AuthContext } from './auth.types';
import { isUserRole } from './user.model';

const ALGORITHM = 'HS256';

/** Short-lived JWT sent on every request: "Authorization: Bearer <token>". */
export function signAccessToken({ userId, role }: AuthContext): string {
  return jwt.sign({ role }, authConfig.JWT_ACCESS_SECRET, {
    subject: userId,
    issuer: authConfig.JWT_ISSUER,
    expiresIn: authConfig.JWT_ACCESS_EXPIRES_IN_SECONDS,
    algorithm: ALGORITHM,
  });
}

/** Throws jwt errors (expired / invalid) — handled by the authenticate middleware. */
export function verifyAccessToken(token: string): AuthContext {
  const payload = jwt.verify(token, authConfig.JWT_ACCESS_SECRET, {
    issuer: authConfig.JWT_ISSUER,
    algorithms: [ALGORITHM],
  });

  if (typeof payload === 'string' || !payload.sub || !isUserRole(payload.role)) {
    throw new UnauthorizedError('Invalid access token', 'INVALID_TOKEN');
  }

  return { userId: payload.sub, role: payload.role };
}

/** Long-lived opaque refresh token (random bytes, not a JWT). Only its hash is stored. */
export function generateRefreshToken(): { token: string; tokenHash: string } {
  const token = randomBytes(48).toString('base64url');
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
