import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { isDevelopment } from '@/config/env';
import {
  AppError,
  BadRequestError,
  ConflictError,
  InternalServerError,
  PayloadTooLargeError,
  ValidationError,
} from '@/core/errors/app-error';
import { formatZodIssues } from '@/core/errors/format-zod-issues';

function hasProp<K extends string>(value: unknown, key: K): value is Record<K, unknown> {
  return typeof value === 'object' && value !== null && key in value;
}

/**
 * Converts ANY thrown error (ours, Zod, Mongoose, Mongo driver, body-parser)
 * into an AppError, so the client always gets the same response shape.
 */
export function normalizeError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  if (err instanceof ZodError) return new ValidationError(formatZodIssues(err));

  if (err instanceof mongoose.Error.CastError) {
    return new BadRequestError(`Invalid value for "${err.path}"`, 'INVALID_VALUE');
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return new ValidationError(
      Object.values(err.errors).map((e) => ({
        location: 'body',
        path: e.path,
        message: e.message,
      })),
    );
  }

  // MongoDB duplicate key (unique index violation)
  if (hasProp(err, 'code') && err.code === 11000) {
    const fields =
      hasProp(err, 'keyValue') && typeof err.keyValue === 'object' && err.keyValue !== null
        ? Object.keys(err.keyValue)
        : [];
    return new ConflictError(
      `Duplicate value for: ${fields.join(', ') || 'a unique field'}`,
      'DUPLICATE_KEY',
      { fields },
    );
  }

  // express.json() errors
  if (hasProp(err, 'type')) {
    if (err.type === 'entity.parse.failed') {
      return new BadRequestError('Malformed JSON in request body', 'INVALID_JSON');
    }
    if (err.type === 'entity.too.large') return new PayloadTooLargeError();
  }

  return new InternalServerError();
}

/**
 * Global error handler — the ONLY place that builds error responses.
 * Unknown errors are logged with full stack but the client only sees a safe generic message.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const appError = normalizeError(err);

  if (appError.statusCode >= 500) {
    req.log.error({ err }, 'Unhandled error');
  } else {
    req.log.debug({ err: appError }, appError.message);
  }

  if (res.headersSent) {
    next(err);
    return;
  }

  res.status(appError.statusCode).json({
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details !== undefined ? { details: appError.details } : {}),
      requestId: String(req.id),
      ...(isDevelopment && appError.statusCode >= 500 && err instanceof Error
        ? { stack: err.stack }
        : {}),
    },
  });
};
