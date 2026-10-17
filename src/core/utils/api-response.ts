import type { Response } from 'express';

interface SuccessOptions {
  statusCode?: number;
  meta?: object;
}

/**
 * Every successful response has the same shape:
 * { "success": true, "data": ..., "meta"?: ... }
 * Frontends can write ONE API handler for the whole backend.
 */
export function sendSuccess<T>(res: Response, data: T, options: SuccessOptions = {}): void {
  const { statusCode = 200, meta } = options;
  res.status(statusCode).json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, { statusCode: 201 });
}

export function sendNoContent(res: Response): void {
  res.status(204).end();
}
