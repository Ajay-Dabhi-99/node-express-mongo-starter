import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '@/app';

const app = createApp();

describe('Health & core behaviour', () => {
  it('GET /health/live → 200', async () => {
    const res = await request(app).get('/health/live');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { status: 'ok' } });
  });

  it('GET /health/ready → 200 when the database is connected', async () => {
    const res = await request(app).get('/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.data.checks.database).toBe('up');
  });

  it('unknown routes return the standard 404 envelope with a request id', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
    expect(res.headers['x-request-id']).toBe(res.body.error.requestId);
  });

  it('re-uses an incoming x-request-id header', async () => {
    const res = await request(app).get('/health/live').set('x-request-id', 'trace-abc-123');

    expect(res.headers['x-request-id']).toBe('trace-abc-123');
  });

  it('malformed JSON returns 400 INVALID_JSON instead of crashing', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set('Content-Type', 'application/json')
      .send('{"name": ');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('sets security headers (helmet) and hides x-powered-by', async () => {
    const res = await request(app).get('/health/live');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
