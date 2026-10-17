import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import { logger } from '@/core/logger/logger';

const MAX_REQUEST_ID_LENGTH = 128;

/**
 * Logs every request and gives it a request ID (correlation ID).
 * - Re-uses an incoming "x-request-id" header (from a gateway / frontend) if present.
 * - Sends it back in the response header, and includes it in every log line and error response.
 * Debugging = search one ID and see the whole story of that request.
 */
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const incoming = req.headers['x-request-id'];
    const id =
      typeof incoming === 'string' &&
      incoming.length > 0 &&
      incoming.length <= MAX_REQUEST_ID_LENGTH
        ? incoming
        : randomUUID();
    res.setHeader('x-request-id', id);
    return id;
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  autoLogging: {
    ignore: (req) => req.url?.startsWith('/health') ?? false,
  },
});
