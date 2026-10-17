import type { UserRole } from './user.model';

export interface AuthContext {
  userId: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

// Adds `req.auth` to Express' Request type (set by the authenticate middleware).
declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthContext;
  }
}
