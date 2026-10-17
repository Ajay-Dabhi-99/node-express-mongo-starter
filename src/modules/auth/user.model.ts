import { Schema, model, type HydratedDocument } from 'mongoose';
import { baseSchemaOptions, toJSONTransform } from '@/core/database/schema-options';

export const USER_ROLES = ['admin', 'user'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<User>;

const hidePrivateFields = (doc: unknown, ret: Record<string, unknown>) => {
  toJSONTransform(doc, ret);
  delete ret.passwordHash;
  return ret;
};

const userSchema = new Schema<User>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // select: false → the hash is never loaded unless explicitly requested
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    role: { type: String, enum: USER_ROLES, default: 'user' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  {
    ...baseSchemaOptions,
    toJSON: { virtuals: true, transform: hidePrivateFields },
    toObject: { virtuals: true, transform: hidePrivateFields },
  },
);

export const UserModel = model<User>('User', userSchema);

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}
