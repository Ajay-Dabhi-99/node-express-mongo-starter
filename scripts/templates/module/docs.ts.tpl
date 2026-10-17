import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '@/core/utils/zod';
import {
  commonErrorResponses,
  jsonContent,
  notFoundResponse,
  paginatedResponseSchema,
  successResponseSchema,
} from '@/docs/helpers';
import {
  __name__IdParams,
  create__Name__Body,
  list__Name__Query,
  update__Name__Body,
} from './__file__.schema';

const __name__Schema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    isActive: z.boolean(),
    createdAt: z.string().openapi({ format: 'date-time' }),
    updatedAt: z.string().openapi({ format: 'date-time' }),
  })
  .openapi('__Name__');

export function register__Name__Docs(registry: OpenAPIRegistry): void {
  const tags = ['__Tag__'];
  const jsonBody = (schema: z.ZodTypeAny) => ({
    body: { content: { 'application/json': { schema } } },
  });

  registry.registerPath({
    method: 'get',
    path: '/__route__',
    tags,
    summary: 'List __route__',
    request: { query: list__Name__Query },
    responses: {
      200: jsonContent(paginatedResponseSchema(__name__Schema), 'List'),
      ...commonErrorResponses,
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/__route__',
    tags,
    summary: 'Create',
    request: jsonBody(create__Name__Body),
    responses: {
      201: jsonContent(successResponseSchema(__name__Schema), 'Created'),
      ...commonErrorResponses,
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/__route__/{id}',
    tags,
    summary: 'Get by id',
    request: { params: __name__IdParams },
    responses: {
      200: jsonContent(successResponseSchema(__name__Schema), 'Found'),
      ...notFoundResponse,
      ...commonErrorResponses,
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/__route__/{id}',
    tags,
    summary: 'Update (partial)',
    request: { params: __name__IdParams, ...jsonBody(update__Name__Body) },
    responses: {
      200: jsonContent(successResponseSchema(__name__Schema), 'Updated'),
      ...notFoundResponse,
      ...commonErrorResponses,
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/__route__/{id}',
    tags,
    summary: 'Delete',
    request: { params: __name__IdParams },
    responses: { 204: { description: 'Deleted' }, ...notFoundResponse, ...commonErrorResponses },
  });
}
