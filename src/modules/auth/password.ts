import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, authConfig.BCRYPT_SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

let dummyHash: string | undefined;

/**
 * When the email does not exist we still run a bcrypt compare against this dummy hash,
 * so the response time is the same → attackers can't discover which emails are registered.
 */
export async function getDummyHash(): Promise<string> {
  dummyHash ??= await hashPassword('timing-attack-protection-dummy');
  return dummyHash;
}
