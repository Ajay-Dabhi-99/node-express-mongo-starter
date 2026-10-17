import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { env } from '@/config/env';
import { modules } from '@/modules';

/**
 * Builds the Swagger/OpenAPI document from the same Zod schemas used for validation,
 * so the docs can never drift away from the real API.
 */
export function buildOpenApiDocument() {
  const registry = new OpenAPIRegistry();

  for (const appModule of modules) {
    appModule.registerDocs?.(registry);
  }

  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.3',
    info: {
      title: env.APP_NAME,
      version: '1.0.0',
      description: 'REST API documentation (generated from Zod schemas).',
    },
    servers: [{ url: env.API_PREFIX }],
  });
}
