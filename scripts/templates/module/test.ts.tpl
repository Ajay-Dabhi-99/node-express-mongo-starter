import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '@/app';

const app = createApp();
const BASE = '/api/v1/__route__';

describe('__Tag__ API', () => {
  it('creates and lists items', async () => {
    const created = await request(app).post(BASE).send({ name: 'First' });
    expect(created.status).toBe(201);

    const list = await request(app).get(BASE);
    expect(list.status).toBe(200);
    expect(list.body.meta.total).toBe(1);
  });

  it('returns 404 for a missing item', async () => {
    const res = await request(app).get(`${BASE}/665f1c2e8b3e4a0012345678`);
    expect(res.status).toBe(404);
  });
});
