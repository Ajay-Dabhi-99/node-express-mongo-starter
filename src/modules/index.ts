import type { AppModule } from '@/core/types/app-module';
import { authModule } from './auth';
import { productModule } from './products';

/**
 * ✅ The ONLY place where feature modules are registered.
 * - Add a module:    npm run make:module <name>   (adds it here automatically)
 * - Remove a module: delete its folder + its line here
 * - Remove auth:     npm run remove:auth
 */
export const modules: AppModule[] = [authModule, productModule];
