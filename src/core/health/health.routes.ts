import { Router } from 'express';
import { isDatabaseReady } from '@/core/database/mongo';
import { lifecycle } from '@/core/lifecycle';
import { sendSuccess } from '@/core/utils/api-response';

/**
 * /health/live  → "is the process alive?"           (restart the container if this fails)
 * /health/ready → "can it serve traffic right now?" (DB connected and not shutting down)
 * Used by Docker HEALTHCHECK, Render/Railway, Kubernetes, load balancers, uptime monitors.
 */
export const healthRouter: Router = Router();

healthRouter.get('/live', (_req, res) => {
  sendSuccess(res, { status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
});

healthRouter.get('/ready', (_req, res) => {
  const database = isDatabaseReady();
  const ready = database && !lifecycle.isShuttingDown;

  res.status(ready ? 200 : 503).json({
    success: ready,
    data: {
      status: ready ? 'ready' : 'not_ready',
      checks: {
        database: database ? 'up' : 'down',
        shuttingDown: lifecycle.isShuttingDown,
      },
    },
  });
});
