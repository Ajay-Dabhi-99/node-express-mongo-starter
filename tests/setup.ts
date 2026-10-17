import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, inject } from 'vitest';

// Must be set before any test imports the app (env.ts validates MONGODB_URI on load).
process.env.MONGODB_URI = inject('mongoUri');

beforeAll(async () => {
  // Each test file gets its own database → files can run in parallel safely.
  await mongoose.connect(inject('mongoUri'), { dbName: `test-${randomUUID()}` });
});

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
