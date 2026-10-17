import type { Request, Response } from 'express';
import { validatedQuery } from '@/core/middlewares/validate';
import { sendCreated, sendNoContent, sendSuccess } from '@/core/utils/api-response';
import type {
  Create__Name__Input,
  List__Name__Query,
  Update__Name__Input,
} from './__file__.schema';
import { __name__Service } from './__file__.service';

type IdRequest = Request<{ id: string }>;

export const __name__Controller = {
  async list(req: Request, res: Response) {
    const { items, meta } = await __name__Service.list(validatedQuery<List__Name__Query>(req));
    sendSuccess(res, items, { meta });
  },

  async getById(req: IdRequest, res: Response) {
    sendSuccess(res, await __name__Service.getById(req.params.id));
  },

  async create(req: Request, res: Response) {
    sendCreated(res, await __name__Service.create(req.body as Create__Name__Input));
  },

  async update(req: IdRequest, res: Response) {
    sendSuccess(res, await __name__Service.update(req.params.id, req.body as Update__Name__Input));
  },

  async remove(req: IdRequest, res: Response) {
    await __name__Service.remove(req.params.id);
    sendNoContent(res);
  },
};
