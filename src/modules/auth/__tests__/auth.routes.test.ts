import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '@/app';
import { hashPassword } from '../password';
import { UserModel } from '../user.model';

const app = createApp();
const BASE = '/api/v1/auth';
const credentials = { email: 'admin@test.com', password: 'Str0ng@Password' };

async function login() {
  const res = await request(app).post(`${BASE}/login`).send(credentials);
  return res.body.data.tokens as { accessToken: string; refreshToken: string };
}

describe('Auth API', () => {
  beforeEach(async () => {
    await UserModel.create({
      email: credentials.email,
      name: 'Admin',
      role: 'admin',
      passwordHash: await hashPassword(credentials.password),
    });
  });

  it('logs in and never returns the password hash', async () => {
    const res = await request(app).post(`${BASE}/login`).send(credentials);

    expect(res.status).toBe(200);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe(credentials.email);
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('returns the same generic error for wrong password and unknown email', async () => {
    const wrongPassword = await request(app)
      .post(`${BASE}/login`)
      .send({ ...credentials, password: 'wrong-password' });
    const unknownEmail = await request(app)
      .post(`${BASE}/login`)
      .send({ ...credentials, email: 'nobody@test.com' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(unknownEmail.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('protects /me with a bearer token', async () => {
    const noToken = await request(app).get(`${BASE}/me`);
    expect(noToken.status).toBe(401);
    expect(noToken.body.error.code).toBe('MISSING_TOKEN');

    const { accessToken } = await login();
    const withToken = await request(app)
      .get(`${BASE}/me`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(withToken.status).toBe(200);
    expect(withToken.body.data.role).toBe('admin');
  });

  it('rotates refresh tokens and detects reuse of an old token', async () => {
    const { refreshToken } = await login();

    const first = await request(app).post(`${BASE}/refresh`).send({ refreshToken });
    expect(first.status).toBe(200);
    const rotated: string = first.body.data.tokens.refreshToken;
    expect(rotated).not.toBe(refreshToken);

    // Re-using the old token = possible theft → everything is revoked
    const reuse = await request(app).post(`${BASE}/refresh`).send({ refreshToken });
    expect(reuse.status).toBe(401);
    expect(reuse.body.error.code).toBe('REFRESH_TOKEN_REUSED');

    const afterRevoke = await request(app).post(`${BASE}/refresh`).send({ refreshToken: rotated });
    expect(afterRevoke.status).toBe(401);
  });

  it('logout revokes the refresh token', async () => {
    const { refreshToken } = await login();

    const logout = await request(app).post(`${BASE}/logout`).send({ refreshToken });
    expect(logout.status).toBe(204);

    const refresh = await request(app).post(`${BASE}/refresh`).send({ refreshToken });
    expect(refresh.status).toBe(401);
  });
});
