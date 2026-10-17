import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '@/core/utils/zod';
import {
  commonErrorResponses,
  errorResponseSchema,
  jsonContent,
  notFoundResponse,
  paginatedResponseSchema,
  successResponseSchema,
} from '@/docs/helpers';
import {
  createProductBody,
  listProductsQuery,
  productIdParams,
  updateProductBody,
} from './product.schema';

const productSchema = z
  .object({
    id: z.string().openapi({ example: '665f1c2e8b3e4a0012345678' }),
    name: z.string(),
    description: z.string().optional(),
    price: z.number(),
    category: z.string(),
    isActive: z.boolean(),
    createdAt: z.string().openapi({ format: 'date-time' }),
    updatedAt: z.string().openapi({ format: 'date-time' }),
  })
  .openapi('Product');

export function registerProductDocs(registry: OpenAPIRegistry): void {
  const tags = ['Products'];
  const jsonBody = (schema: z.ZodTypeAny) => ({
    body: { content: { 'application/json': { schema } } },
  });

  registry.registerPath({
    method: 'get',
    path: '/products',
    tags,
    summary: 'List products (paginated, searchable)',
    request: { query: listProductsQuery },
    responses: {
      200: jsonContent(paginatedResponseSchema(productSchema), 'Products'),
      ...commonErrorResponses,
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/products',
    tags,
    summary: 'Create a product',
    request: jsonBody(createProductBody),
    responses: {
      201: jsonContent(successResponseSchema(productSchema), 'Created'),
      409: jsonContent(errorResponseSchema, 'Name already exists'),
      ...commonErrorResponses,
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/products/{id}',
    tags,
    summary: 'Get a product by id',
    request: { params: productIdParams },
    responses: {
      200: jsonContent(successResponseSchema(productSchema), 'Product'),
      ...notFoundResponse,
      ...commonErrorResponses,
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/products/{id}',
    tags,
    summary: 'Update a product (partial)',
    request: { params: productIdParams, ...jsonBody(updateProductBody) },
    responses: {
      200: jsonContent(successResponseSchema(productSchema), 'Updated'),
      ...notFoundResponse,
      ...commonErrorResponses,
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/products/{id}',
    tags,
    summary: 'Delete a product',
    request: { params: productIdParams },
    responses: {
      204: { description: 'Deleted' },
      ...notFoundResponse,
      ...commonErrorResponses,
    },
  });
}
