import type { FilterQuery } from 'mongoose';
import { escapeRegex } from '@/core/utils/escape-regex';
import { getSkip } from '@/core/utils/pagination';
import { ProductModel, type Product } from './product.model';
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from './product.schema';

/**
 * Repository = the ONLY layer that talks to MongoDB for products.
 * Services never write queries directly, so the database can be changed
 * (or a query optimized) in one place.
 */
export const productRepository = {
  create(data: CreateProductInput) {
    return ProductModel.create(data);
  },

  findById(id: string) {
    return ProductModel.findById(id);
  },

  findByName(name: string) {
    return ProductModel.findOne({ name });
  },

  async findMany(query: ListProductsQuery) {
    const filter: FilterQuery<Product> = {};
    if (query.search) filter.name = new RegExp(escapeRegex(query.search), 'i');
    if (query.category) filter.category = query.category;
    if (query.isActive !== undefined) filter.isActive = query.isActive;

    const [items, total] = await Promise.all([
      ProductModel.find(filter)
        .sort(query.sort)
        .skip(getSkip(query.page, query.limit))
        .limit(query.limit),
      ProductModel.countDocuments(filter),
    ]);

    return { items, total };
  },

  updateById(id: string, data: UpdateProductInput) {
    return ProductModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  },

  deleteById(id: string) {
    return ProductModel.findByIdAndDelete(id);
  },
};
