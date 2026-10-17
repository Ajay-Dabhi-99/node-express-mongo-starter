import { Router } from 'express';
import { validate } from '@/core/middlewares/validate';
import { productController } from './product.controller';
import {
  createProductBody,
  listProductsQuery,
  productIdParams,
  updateProductBody,
} from './product.schema';

/**
 * Route = URL + middleware wiring only.
 *
 * 🔒 To protect routes (when the auth module is kept):
 *   import { authenticate, authorize } from '@/modules/auth';
 *   router.post('/', authenticate, authorize('admin'), validate({ body: ... }), controller.create);
 */
export const productRouter: Router = Router();

productRouter.get('/', validate({ query: listProductsQuery }), productController.list);
productRouter.post('/', validate({ body: createProductBody }), productController.create);
productRouter.get('/:id', validate({ params: productIdParams }), productController.getById);
productRouter.patch(
  '/:id',
  validate({ params: productIdParams, body: updateProductBody }),
  productController.update,
);
productRouter.delete('/:id', validate({ params: productIdParams }), productController.remove);
