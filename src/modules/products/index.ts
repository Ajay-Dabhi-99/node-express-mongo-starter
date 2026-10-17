import type { AppModule } from '@/core/types/app-module';
import { registerProductDocs } from './product.docs';
import { productRouter } from './product.routes';

export const productModule: AppModule = {
  name: 'products',
  basePath: '/products',
  router: productRouter,
  registerDocs: registerProductDocs,
};
