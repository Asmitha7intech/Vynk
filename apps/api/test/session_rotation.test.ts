import { describe, it, expect, beforeAll } from 'vitest';
import { buildServer } from '../src/server';
import { FastifyInstance } from 'fastify';

describe('Rotating Refresh Tokens & Session Family Reuse Detection Suite', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });

  it('rotates refresh token and detects reuse attempts', async () => {
    // 1. Login with canonical owner
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'asmitha7intech@gmail.com',
        password: 'Password123!',
      },
    });

    expect(loginRes.statusCode).toBe(200);
    const loginBody = loginRes.json();
    const token1 = loginBody.data.refreshToken;
    const cookies = loginRes.cookies;
    expect(token1).toBeDefined();

    // 2. Rotate token first time (valid rotation)
    const rotate1Res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      cookies: { refreshToken: token1 },
      payload: { refreshToken: token1 },
    });

    expect(rotate1Res.statusCode).toBe(200);
    const rotate1Body = rotate1Res.json();
    const token2 = rotate1Body.data.refreshToken;
    expect(token2).toBeDefined();
    expect(token2).not.toBe(token1);

    // 3. Replay token1 (stolen / reused token)
    const replayRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      cookies: { refreshToken: token1 },
      payload: { refreshToken: token1 },
    });

    expect(replayRes.statusCode).toBe(401);
    const replayBody = replayRes.json();
    expect(replayBody.code).toBe('TOKEN_REUSE_DETECTED');

    // 4. Token2 should now ALSO be revoked because the entire family was revoked upon reuse detection!
    const rotate2Res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      cookies: { refreshToken: token2 },
      payload: { refreshToken: token2 },
    });

    expect(rotate2Res.statusCode).toBe(401);
  });
});
