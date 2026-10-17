import { z } from '@/core/utils/zod';

export const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Invalid id format')
  .openapi({ example: '665f1c2e8b3e4a0012345678' });

export const idParamsSchema = z.object({ id: objectIdSchema });
