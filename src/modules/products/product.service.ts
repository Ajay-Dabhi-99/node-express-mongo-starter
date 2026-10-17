import { ConflictError, NotFoundError } from '@/core/errors/app-error';
import { buildPaginationMeta } from '@/core/utils/pagination';
import { productRepository } from './product.repository';
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from './product.schema';

/**
 * Service = business rules. It knows nothing about HTTP (no req/res),
 * so it can be reused from a controller, a cron job, a queue worker or a test.
 */
export const productService = {
  async create(input: CreateProductInput) {
    const existing = await productRepository.findByName(input.name);
    if (existing) {
      throw new ConflictError('A product with this name already exists', 'PRODUCT_NAME_TAKEN');
    }
    return productRepository.create(input);
  },

  async getById(id: string) {
    const product = await productRepository.findById(id);
    if (!product) throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    return product;
  },

  async list(query: ListProductsQuery) {
    const { items, total } = await productRepository.findMany(query);
    return { items, meta: buildPaginationMeta(query.page, query.limit, total) };
  },

  async update(id: string, input: UpdateProductInput) {
    if (input.name) {
      const existing = await productRepository.findByName(input.name);
      if (existing && existing.id !== id) {
        throw new ConflictError('A product with this name already exists', 'PRODUCT_NAME_TAKEN');
      }
    }

    const product = await productRepository.updateById(id, input);
    if (!product) throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    return product;
  },

  async remove(id: string) {
    const product = await productRepository.deleteById(id);
    if (!product) throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
  },
};
