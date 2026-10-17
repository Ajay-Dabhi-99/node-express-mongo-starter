import { UnauthorizedError } from '@/core/errors/app-error';
import { authConfig } from './auth.config';
import { authRepository } from './auth.repository';
import type { AuthTokens, RequestMeta } from './auth.types';
import { getDummyHash, verifyPassword } from './password';
import { generateRefreshToken, hashToken, signAccessToken } from './token';
import type { UserRole } from './user.model';

const DAY_MS = 24 * 60 * 60 * 1000;

const invalidCredentials = () =>
  new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
const invalidRefreshToken = () =>
  new UnauthorizedError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');

async function createSession(
  user: { id: string; role: UserRole },
  meta: RequestMeta,
  refresh = generateRefreshToken(),
): Promise<AuthTokens> {
  await authRepository.createRefreshToken({
    userId: user.id,
    tokenHash: refresh.tokenHash,
    expiresAt: new Date(Date.now() + authConfig.REFRESH_TOKEN_TTL_DAYS * DAY_MS),
    createdByIp: meta.ip,
    userAgent: meta.userAgent,
  });

  return {
    accessToken: signAccessToken({ userId: user.id, role: user.role }),
    refreshToken: refresh.token,
    tokenType: 'Bearer',
    expiresIn: authConfig.JWT_ACCESS_EXPIRES_IN_SECONDS,
  };
}

export const authService = {
  async login(email: string, password: string, meta: RequestMeta) {
    const user = await authRepository.findUserByEmailWithPassword(email);

    // Always run bcrypt (even for unknown emails) so response time leaks nothing.
    const passwordValid = await verifyPassword(
      password,
      user?.passwordHash ?? (await getDummyHash()),
    );

    // Same generic error for "no user", "wrong password" and "disabled" — never reveal which.
    if (!user || !passwordValid || !user.isActive) throw invalidCredentials();

    const tokens = await createSession({ id: user.id, role: user.role }, meta);
    await authRepository.updateLastLogin(user.id);

    return { user, tokens };
  },

  /**
   * Refresh token ROTATION: every refresh token works exactly once.
   * If an already-used token is presented again, it was probably stolen →
   * every session of that user is revoked (they must log in again).
   */
  async refresh(refreshToken: string, meta: RequestMeta): Promise<AuthTokens> {
    const tokenHash = hashToken(refreshToken);
    const stored = await authRepository.findRefreshTokenByHash(tokenHash);
    if (!stored || stored.expiresAt.getTime() <= Date.now()) throw invalidRefreshToken();
    // Revoked by logout (not by rotation) → simply invalid.
    if (stored.revokedAt && !stored.replacedByHash) throw invalidRefreshToken();

    const next = generateRefreshToken();
    const revoked = await authRepository.revokeRefreshTokenIfActive(tokenHash, next.tokenHash);

    if (!revoked) {
      await authRepository.revokeAllRefreshTokensForUser(stored.user);
      throw new UnauthorizedError(
        'Refresh token was already used. All sessions have been revoked.',
        'REFRESH_TOKEN_REUSED',
      );
    }

    const user = await authRepository.findUserById(stored.user);
    if (!user || !user.isActive) {
      await authRepository.revokeAllRefreshTokensForUser(stored.user);
      throw invalidRefreshToken();
    }

    return createSession({ id: user.id, role: user.role }, meta, next);
  },

  /** Idempotent: logging out with an unknown/used token still succeeds. */
  async logout(refreshToken: string): Promise<void> {
    await authRepository.revokeRefreshTokenIfActive(hashToken(refreshToken));
  },

  async getCurrentUser(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user || !user.isActive) throw new UnauthorizedError('User not found or inactive');
    return user;
  },
};
