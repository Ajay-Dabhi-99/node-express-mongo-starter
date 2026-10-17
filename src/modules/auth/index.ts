import type { AppModule } from '@/core/types/app-module';
import { registerAuthDocs } from './auth.docs';
import { authRouter } from './auth.routes';

export { authenticate, authorize, getAuthContext } from './auth.middleware';
export type { AuthContext } from './auth.types';

export const authModule: AppModule = {
  name: 'auth',
  basePath: '/auth',
  router: authRouter,
  registerDocs: registerAuthDocs,
};
