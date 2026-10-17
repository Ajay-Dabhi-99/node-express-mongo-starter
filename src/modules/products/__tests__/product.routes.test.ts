import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '@/app';

const app = createApp();
const BASE = '/api/v1/products';

const validProduct = { name: 'Oak Wardrobe', price: 32000, category: 'bedroom' };

describe('Products API', () => {
  it('creates a product (201) with the standard response envelope', async () => {
    const res = await request(app).post(BASE).send(validProduct);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ ...validProduct, isActive: true });
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data._id).toBeUndefined();
  });

  it('rejects invalid input with a 400 VALIDATION_ERROR listing every problem', async () => {
    const res = await request(app).post(BASE).send({ name: 'A', price: -5 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const paths = res.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['name', 'price', 'category']));
  });

  it('rejects unknown fields and Mongo operators in the body', async () => {
    const res = await request(app)
      .post(BASE)
      .send({ ...validProduct, isAdmin: true });

    expect(res.status).toBe(400);
  });

  it('returns 409 when the name already exists', async () => {
    await request(app).post(BASE).send(validProduct);
    const res = await request(app).post(BASE).send(validProduct);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('PRODUCT_NAME_TAKEN');
  });

  it('lists products with pagination meta and search', async () => {
    await request(app).post(BASE).send(validProduct);
    await request(app)
      .post(BASE)
      .send({ name: 'Glass Dining Table', price: 18000, category: 'dining' });

    const res = await request(app).get(BASE).query({ search: 'oak', limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 10, total: 1, totalPages: 1 });
  });

  it('gets, updates and deletes a product', async () => {
    const created = await request(app).post(BASE).send(validProduct);
    const id: string = created.body.data.id;

    const fetched = await request(app).get(`${BASE}/${id}`);
    expect(fetched.status).toBe(200);

    const updated = await request(app).patch(`${BASE}/${id}`).send({ price: 35000 });
    expect(updated.status).toBe(200);
    expect(updated.body.data.price).toBe(35000);

    const deleted = await request(app).delete(`${BASE}/${id}`);
    expect(deleted.status).toBe(204);

    const missing = await request(app).get(`${BASE}/${id}`);
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('PRODUCT_NOT_FOUND');
  });

  it('returns 400 for an invalid id format', async () => {
    const res = await request(app).get(`${BASE}/not-an-id`);

    expect(res.status).toBe(400);
    expect(res.body.error.details[0].location).toBe('params');
  });
});
