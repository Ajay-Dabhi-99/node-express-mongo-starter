import type { RequestHandler } from 'express';
import { sanitizeInPlace } from '@/core/utils/sanitize';

/**
 * Removes MongoDB operator keys ("$gt", "$where", "a.b") and prototype-pollution keys
 * ("__proto__", "constructor") from body and query. Defense in depth on top of Zod validation.
 */
export const sanitizeRequest: RequestHandler = (req, _res, next) => {
  sanitizeInPlace(req.body);

  const query = req.query;
  sanitizeInPlace(query);
  Object.defineProperty(req, 'query', {
    value: query,
    writable: true,
    configurable: true,
    enumerable: true,
  });

  next();
};
