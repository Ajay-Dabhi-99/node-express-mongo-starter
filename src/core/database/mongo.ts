import mongoose from 'mongoose';
import { env } from '@/config/env';
import { logger } from '@/core/logger/logger';

mongoose.set('strictQuery', true);

const MAX_RETRIES = 5;
const MAX_RETRY_DELAY_MS = 15_000;

let listenersRegistered = false;

function registerConnectionListeners(): void {
  if (listenersRegistered) return;
  listenersRegistered = true;

  const connection = mongoose.connection;
  connection.on('connected', () =>
    logger.info({ host: connection.host, db: connection.name }, 'MongoDB connected'),
  );
  connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  connection.on('error', (err) => logger.error({ err }, 'MongoDB connection error'));
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Connects to MongoDB Atlas with exponential-backoff retries.
 * Atlas can briefly be unreachable (network blip, cluster maintenance), so the
 * app retries a few times before giving up instead of crashing on the first failure.
 * The connection string is never logged (it contains credentials).
 */
export async function connectDatabase(): Promise<typeof mongoose> {
  registerConnectionListeners();

  for (let attempt = 1; ; attempt++) {
    try {
      return await mongoose.connect(env.MONGODB_URI, {
        dbName: env.MONGODB_DB_NAME,
        appName: env.APP_NAME,
        maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
        serverSelectionTimeoutMS: env.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
      });
    } catch (err) {
      if (attempt >= MAX_RETRIES) {
        logger.fatal({ err, attempt }, 'Could not connect to MongoDB — giving up');
        throw err;
      }
      const delay = Math.min(1000 * 2 ** (attempt - 1), MAX_RETRY_DELAY_MS);
      logger.warn({ err, attempt, retryInMs: delay }, 'MongoDB connection failed — retrying');
      await sleep(delay);
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
}

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
}
