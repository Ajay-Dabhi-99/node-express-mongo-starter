import type { FilterQuery } from 'mongoose';
import { escapeRegex } from '@/core/utils/escape-regex';
import { getSkip } from '@/core/utils/pagination';
import { __Name__Model, type __Name__ } from './__file__.model';
import type {
  Create__Name__Input,
  List__Name__Query,
  Update__Name__Input,
} from './__file__.schema';

export const __name__Repository = {
  create(data: Create__Name__Input) {
    return __Name__Model.create(data);
  },

  findById(id: string) {
    return __Name__Model.findById(id);
  },

  async findMany(query: List__Name__Query) {
    const filter: FilterQuery<__Name__> = {};
    if (query.search) filter.name = new RegExp(escapeRegex(query.search), 'i');

    const [items, total] = await Promise.all([
      __Name__Model.find(filter)
        .sort(query.sort)
        .skip(getSkip(query.page, query.limit))
        .limit(query.limit),
      __Name__Model.countDocuments(filter),
    ]);

    return { items, total };
  },

  updateById(id: string, data: Update__Name__Input) {
    return __Name__Model.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  },

  deleteById(id: string) {
    return __Name__Model.findByIdAndDelete(id);
  },
};
