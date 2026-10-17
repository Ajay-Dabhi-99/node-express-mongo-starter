import { Router } from 'express';
import { validate } from '@/core/middlewares/validate';
import { __name__Controller } from './__file__.controller';
import {
  __name__IdParams,
  create__Name__Body,
  list__Name__Query,
  update__Name__Body,
} from './__file__.schema';

export const __name__Router: Router = Router();

__name__Router.get('/', validate({ query: list__Name__Query }), __name__Controller.list);
__name__Router.post('/', validate({ body: create__Name__Body }), __name__Controller.create);
__name__Router.get('/:id', validate({ params: __name__IdParams }), __name__Controller.getById);
__name__Router.patch(
  '/:id',
  validate({ params: __name__IdParams, body: update__Name__Body }),
  __name__Controller.update,
);
__name__Router.delete('/:id', validate({ params: __name__IdParams }), __name__Controller.remove);
