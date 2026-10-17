import { Schema, model, type Types } from 'mongoose';

/**
 * Stored refresh tokens (only a SHA-256 hash, never the raw token).
 * Enables logout, token rotation and "stolen token" (reuse) detection.
 * MongoDB deletes expired documents automatically via the TTL index on expiresAt.
 */
export interface RefreshToken {
  user: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByHash: string | null;
  createdByIp?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<RefreshToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    revokedAt: { type: Date, default: null },
    replacedByHash: { type: String, default: null },
    createdByIp: { type: String },
    userAgent: { type: String, maxlength: 512 },
  },
  { timestamps: true, versionKey: false },
);

export const RefreshTokenModel = model<RefreshToken>('RefreshToken', refreshTokenSchema);
