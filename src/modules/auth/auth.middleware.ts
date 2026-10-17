import type { Request, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { AppError, ForbiddenError, UnauthorizedError } from '@/core/errors/app-error';
import type { AuthContext } from './auth.types';
import { verifyAccessToken } from './token';
import type { UserRole } from './user.model';

/** Requires a valid "Authorization: Bearer <accessToken>" header. Sets req.auth. */
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing access token', 'MISSING_TOKEN'));
    return;
  }

  try {
    req.auth = verifyAccessToken(header.slice('Bearer '.length).trim());
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Access token expired', 'TOKEN_EXPIRED'));
    } else if (err instanceof AppError) {
      next(err);
    } else {
      next(new UnauthorizedError('Invalid access token', 'INVALID_TOKEN'));
    }
  }
};

/** Role-based access. Use AFTER authenticate: authorize('admin') */
export function authorize(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(new UnauthorizedError());
      return;
    }
    if (!roles.includes(req.auth.role)) {
      next(new ForbiddenError());
      return;
    }
    next();
  };
}

/** Safe accessor for controllers behind `authenticate`. */
export function getAuthContext(req: Request): AuthContext {
  if (!req.auth) throw new UnauthorizedError();
  return req.auth;
}
