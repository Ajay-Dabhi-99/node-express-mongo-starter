import { idParamsSchema } from '@/core/utils/object-id';
import { paginationQuerySchema } from '@/core/utils/pagination';
import { z } from '@/core/utils/zod';

/** Request validation (and Swagger docs) for the products module. */

export const productIdParams = idParamsSchema;

export const createProductBody = z
  .object({
    name: z.string().trim().min(2).max(120).openapi({ example: 'Modular Kitchen Cabinet' }),
    description: z.string().trim().max(2000).optional(),
    price: z.number().nonnegative().openapi({ example: 45000 }),
    category: z.string().trim().min(1).max(60).openapi({ example: 'kitchen' }),
    isActive: z.boolean().optional(),
  })
  .strict();

export const updateProductBody = createProductBody
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const listProductsQuery = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(100).optional(),
  category: z.string().trim().min(1).max(60).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  sort: z
    .enum(['createdAt', '-createdAt', 'name', '-name', 'price', '-price'])
    .default('-createdAt'),
});

export type CreateProductInput = z.infer<typeof createProductBody>;
export type UpdateProductInput = z.infer<typeof updateProductBody>;
export type ListProductsQuery = z.infer<typeof listProductsQuery>;
