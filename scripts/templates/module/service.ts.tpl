import { NotFoundError } from '@/core/errors/app-error';
import { buildPaginationMeta } from '@/core/utils/pagination';
import { __name__Repository } from './__file__.repository';
import type {
  Create__Name__Input,
  List__Name__Query,
  Update__Name__Input,
} from './__file__.schema';

const notFound = () => new NotFoundError('__Name__ not found', '__CODE___NOT_FOUND');

export const __name__Service = {
  create(input: Create__Name__Input) {
    return __name__Repository.create(input);
  },

  async getById(id: string) {
    const item = await __name__Repository.findById(id);
    if (!item) throw notFound();
    return item;
  },

  async list(query: List__Name__Query) {
    const { items, total } = await __name__Repository.findMany(query);
    return { items, meta: buildPaginationMeta(query.page, query.limit, total) };
  },

  async update(id: string, input: Update__Name__Input) {
    const item = await __name__Repository.updateById(id, input);
    if (!item) throw notFound();
    return item;
  },

  async remove(id: string) {
    const item = await __name__Repository.deleteById(id);
    if (!item) throw notFound();
  },
};
