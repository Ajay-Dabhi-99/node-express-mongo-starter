import { idParamsSchema } from '@/core/utils/object-id';
import { paginationQuerySchema } from '@/core/utils/pagination';
import { z } from '@/core/utils/zod';

export const __name__IdParams = idParamsSchema;

// TODO: keep these in sync with the model fields.
export const create__Name__Body = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const update__Name__Body = create__Name__Body
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const list__Name__Query = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(100).optional(),
  sort: z.enum(['createdAt', '-createdAt', 'name', '-name']).default('-createdAt'),
});

export type Create__Name__Input = z.infer<typeof create__Name__Body>;
export type Update__Name__Input = z.infer<typeof update__Name__Body>;
export type List__Name__Query = z.infer<typeof list__Name__Query>;
