import pino from 'pino';
import { env, isDevelopment } from '@/config/env';

/**
 * Structured JSON logger (pino).
 * - Production: JSON lines → readable by Datadog, Grafana Loki, ELK, Render logs, etc.
 * - Development: pretty, colorized output.
 * - Sensitive fields are redacted automatically.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: env.APP_NAME, env: env.NODE_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.passwordHash',
      '*.refreshToken',
      '*.accessToken',
    ],
    censor: '[REDACTED]',
  },
  ...(isDevelopment
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'pid,hostname,service,env',
          },
        },
      }
    : {}),
});
