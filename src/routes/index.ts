import { Router } from 'express';
import { modules } from '@/modules';

/** Mounts every registered feature module under API_PREFIX (e.g. /api/v1/products). */
export function createApiRouter(): Router {
  const router = Router();

  for (const appModule of modules) {
    router.use(appModule.basePath, appModule.router);
  }

  return router;
}
