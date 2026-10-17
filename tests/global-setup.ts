import { MongoMemoryReplSet } from 'mongodb-memory-server';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    mongoUri: string;
  }
}

/**
 * Starts ONE in-memory MongoDB replica set for the whole test run.
 * Tests never touch Atlas: they are fast, free, offline and can't damage real data.
 * (Replica set mode = transactions work exactly like on Atlas.)
 */
export default async function setup(project: TestProject) {
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });

  project.provide('mongoUri', replSet.getUri());

  return async () => {
    await replSet.stop();
  };
}
