import type { Types } from 'mongoose';
import { RefreshTokenModel } from './refresh-token.model';
import { UserModel } from './user.model';

interface CreateRefreshTokenData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdByIp?: string;
  userAgent?: string;
}

export const authRepository = {
  findUserByEmailWithPassword(email: string) {
    return UserModel.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  },

  findUserById(id: string | Types.ObjectId) {
    return UserModel.findById(id);
  },

  updateLastLogin(userId: string) {
    return UserModel.updateOne({ _id: userId }, { $set: { lastLoginAt: new Date() } });
  },

  createRefreshToken(data: CreateRefreshTokenData) {
    return RefreshTokenModel.create({
      user: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      createdByIp: data.createdByIp,
      userAgent: data.userAgent,
    });
  },

  findRefreshTokenByHash(tokenHash: string) {
    return RefreshTokenModel.findOne({ tokenHash });
  },

  /** Atomic: only ONE request can revoke (= use) a given refresh token. */
  revokeRefreshTokenIfActive(tokenHash: string, replacedByHash: string | null = null) {
    return RefreshTokenModel.findOneAndUpdate(
      { tokenHash, revokedAt: null },
      { $set: { revokedAt: new Date(), replacedByHash } },
      { new: true },
    );
  },

  revokeAllRefreshTokensForUser(userId: string | Types.ObjectId) {
    return RefreshTokenModel.updateMany(
      { user: userId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  },
};
