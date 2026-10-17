import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '@/core/utils/zod';
import {
  commonErrorResponses,
  jsonContent,
  successResponseSchema,
  unauthorizedResponse,
} from '@/docs/helpers';
import { loginBody, refreshTokenBody } from './auth.schema';
import { USER_ROLES } from './user.model';

const userSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    role: z.enum(USER_ROLES),
    isActive: z.boolean(),
    lastLoginAt: z.string().openapi({ format: 'date-time' }).optional(),
    createdAt: z.string().openapi({ format: 'date-time' }),
    updatedAt: z.string().openapi({ format: 'date-time' }),
  })
  .openapi('User');

const tokensSchema = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string(),
    tokenType: z.literal('Bearer'),
    expiresIn: z.number().openapi({ description: 'Access token lifetime in seconds' }),
  })
  .openapi('AuthTokens');

export function registerAuthDocs(registry: OpenAPIRegistry): void {
  const tags = ['Auth'];
  const jsonBody = (schema: z.ZodTypeAny) => ({
    body: { content: { 'application/json': { schema } } },
  });

  registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/login',
    tags,
    summary: 'Log in with email + password',
    request: jsonBody(loginBody),
    responses: {
      200: jsonContent(
        successResponseSchema(z.object({ user: userSchema, tokens: tokensSchema })),
        'Logged in',
      ),
      ...unauthorizedResponse,
      ...commonErrorResponses,
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/refresh',
    tags,
    summary: 'Get a new token pair (refresh token rotation)',
    request: jsonBody(refreshTokenBody),
    responses: {
      200: jsonContent(successResponseSchema(z.object({ tokens: tokensSchema })), 'New tokens'),
      ...unauthorizedResponse,
      ...commonErrorResponses,
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/auth/logout',
    tags,
    summary: 'Revoke a refresh token',
    request: jsonBody(refreshTokenBody),
    responses: { 204: { description: 'Logged out' }, ...commonErrorResponses },
  });

  registry.registerPath({
    method: 'get',
    path: '/auth/me',
    tags,
    summary: 'Current logged-in user',
    security: [{ bearerAuth: [] }],
    responses: {
      200: jsonContent(successResponseSchema(userSchema), 'Current user'),
      ...unauthorizedResponse,
    },
  });
}
