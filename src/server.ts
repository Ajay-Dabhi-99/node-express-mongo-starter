import http from 'node:http';
import { createApp } from '@/app';
import { env } from '@/config/env';
import { connectDatabase, disconnectDatabase } from '@/core/database/mongo';
import { lifecycle } from '@/core/lifecycle';
import { logger } from '@/core/logger/logger';

async function bootstrap(): Promise<void> {
  // Connect to Atlas FIRST — never accept traffic without a database.
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  server.on('error', (err) => {
    logger.fatal({ err }, 'HTTP server error');
    process.exit(1);
  });

  server.listen(env.PORT, () => {
    logger.info(`🚀 ${env.APP_NAME} running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
    if (env.DOCS_ENABLED) logger.info(`📚 API docs: http://localhost:${env.PORT}/docs`);
  });

  /**
   * Graceful shutdown (deploys, restarts, Ctrl+C):
   * stop new connections → finish running requests → close DB → exit.
   * A timer force-exits if something hangs.
   */
  const shutdown = async (reason: string, exitCode = 0): Promise<void> => {
    if (lifecycle.isShuttingDown) return;
    lifecycle.isShuttingDown = true;
    logger.info({ reason }, 'Shutting down gracefully...');

    const forceExitTimer = setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, env.SHUTDOWN_TIMEOUT_MS);
    forceExitTimer.unref();

    try {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      await disconnectDatabase();
      logger.info('Shutdown complete');
      process.exit(exitCode);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'Unhandled promise rejection');
    void shutdown('unhandledRejection', 1);
  });
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception');
    void shutdown('uncaughtException', 1);
  });
}

bootstrap().catch((err: unknown) => {
  logger.fatal({ err }, 'Failed to start the application');
  process.exit(1);
});
