import compression from 'compression';
import cors, { type CorsOptions } from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from '@/config/env';
import { healthRouter } from '@/core/health/health.routes';
import { errorHandler } from '@/core/middlewares/error-handler';
import { httpLogger } from '@/core/middlewares/http-logger';
import { notFound } from '@/core/middlewares/not-found';
import { apiRateLimiter } from '@/core/middlewares/rate-limiter';
import { sanitizeRequest } from '@/core/middlewares/sanitize';
import { buildOpenApiDocument } from '@/docs/openapi';
import { createApiRouter } from '@/routes';

/**
 * Builds the Express app WITHOUT starting a server.
 * server.ts starts it; tests import createApp() directly (no port needed).
 * Middleware order matters — read top to bottom.
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  // 1. Request ID + request logging (first, so everything below is traced)
  app.use(httpLogger);

  // 2. API docs (mounted before helmet because Swagger UI needs its own CSP)
  if (env.DOCS_ENABLED) {
    const openApiDocument = buildOpenApiDocument();
    app.get('/docs.json', (_req, res) => {
      res.json(openApiDocument);
    });
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  }

  // 3. Security headers, CORS, compression
  const corsOptions: CorsOptions = {
    origin: env.CORS_ORIGINS.includes('*') ? true : env.CORS_ORIGINS,
    credentials: true,
    exposedHeaders: ['x-request-id'],
  };
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(compression());

  // 4. Body parsing (with size limit) + NoSQL-injection sanitizing
  app.use(express.json({ limit: env.BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: env.BODY_LIMIT }));
  app.use(sanitizeRequest);

  // 5. Routes
  app.use('/health', healthRouter);
  app.use(env.API_PREFIX, apiRateLimiter, createApiRouter());

  // 6. 404 + global error handler (always last)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
