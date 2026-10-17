/**
 * Creates the first admin user (there is no public register endpoint by design).
 *   1. Set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD / SEED_ADMIN_NAME in .env
 *   2. npm run seed:admin
 */
import '@/config/env';
import { z } from 'zod';
import { connectDatabase, disconnectDatabase } from '@/core/database/mongo';
import { hashPassword } from '@/modules/auth/password';
import { UserModel } from '@/modules/auth/user.model';

const seedSchema = z.object({
  SEED_ADMIN_EMAIL: z.string().trim().toLowerCase().email(),
  SEED_ADMIN_PASSWORD: z.string().min(10, 'SEED_ADMIN_PASSWORD must be at least 10 characters'),
  SEED_ADMIN_NAME: z.string().trim().min(1).default('Admin'),
});

async function main(): Promise<void> {
  const input = seedSchema.parse(process.env);
  await connectDatabase();

  const existing = await UserModel.findOne({ email: input.SEED_ADMIN_EMAIL });
  if (existing) {
    console.log(`ℹ️  Admin already exists: ${input.SEED_ADMIN_EMAIL}`);
  } else {
    await UserModel.create({
      email: input.SEED_ADMIN_EMAIL,
      name: input.SEED_ADMIN_NAME,
      role: 'admin',
      passwordHash: await hashPassword(input.SEED_ADMIN_PASSWORD),
    });
    console.log(`✅ Admin created: ${input.SEED_ADMIN_EMAIL}`);
  }

  await disconnectDatabase();
}

main().catch(async (err: unknown) => {
  console.error('❌ Seeding failed:', err);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
