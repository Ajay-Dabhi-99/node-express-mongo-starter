import { paginationMetaSchema } from '@/core/utils/pagination';
import { z } from '@/core/utils/zod';

/** Reusable OpenAPI helpers so every module documents responses the same way. */

export const errorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z.object({
      code: z.string().openapi({ example: 'VALIDATION_ERROR' }),
      message: z.string(),
      details: z.unknown().optional(),
      requestId: z.string(),
    }),
  })
  .openapi('ErrorResponse');

export function successResponseSchema<T extends z.ZodTypeAny>(data: T) {
  return z.object({ success: z.literal(true), data });
}

export function paginatedResponseSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({ success: z.literal(true), data: z.array(item), meta: paginationMetaSchema });
}

export function jsonContent(schema: z.ZodTypeAny, description: string) {
  return { description, content: { 'application/json': { schema } } };
}

export const commonErrorResponses = {
  400: jsonContent(errorResponseSchema, 'Validation error'),
  429: jsonContent(errorResponseSchema, 'Too many requests'),
  500: jsonContent(errorResponseSchema, 'Internal server error'),
};

export const notFoundResponse = { 404: jsonContent(errorResponseSchema, 'Not found') };
export const unauthorizedResponse = { 401: jsonContent(errorResponseSchema, 'Unauthorized') };
