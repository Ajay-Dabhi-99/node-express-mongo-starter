import type { Request, Response } from 'express';
import { validatedQuery } from '@/core/middlewares/validate';
import { sendCreated, sendNoContent, sendSuccess } from '@/core/utils/api-response';
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from './product.schema';
import { productService } from './product.service';

type IdRequest = Request<{ id: string }>;

/**
 * Controller = thin HTTP layer: read the (already validated) request,
 * call the service, send the response. No business logic, no DB queries.
 * Express 5 forwards async errors to the error handler automatically — no try/catch needed.
 */
export const productController = {
  async list(req: Request, res: Response) {
    const { items, meta } = await productService.list(validatedQuery<ListProductsQuery>(req));
    sendSuccess(res, items, { meta });
  },

  async getById(req: IdRequest, res: Response) {
    sendSuccess(res, await productService.getById(req.params.id));
  },

  async create(req: Request, res: Response) {
    sendCreated(res, await productService.create(req.body as CreateProductInput));
  },

  async update(req: IdRequest, res: Response) {
    sendSuccess(res, await productService.update(req.params.id, req.body as UpdateProductInput));
  },

  async remove(req: IdRequest, res: Response) {
    await productService.remove(req.params.id);
    sendNoContent(res);
  },
};
