import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

/**
 * Import `z` from HERE (not from 'zod') in modules.
 * It adds `.openapi()` so the same schema validates requests AND generates Swagger docs.
 */
extendZodWithOpenApi(z);

export { z };
