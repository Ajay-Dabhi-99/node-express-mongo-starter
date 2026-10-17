import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { Router } from 'express';

/**
 * Contract every feature module exports from its index.ts.
 * Register the module once in src/modules/index.ts and it gets:
 * routes mounted under API_PREFIX + basePath, and its Swagger docs.
 */
export interface AppModule {
  name: string;
  basePath: `/${string}`;
  router: Router;
  registerDocs?: (registry: OpenAPIRegistry) => void;
}
