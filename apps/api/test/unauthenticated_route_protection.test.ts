import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import { describe, it, expect, beforeAll } from 'vitest';
import { buildServer } from '../src/server';
import { FastifyInstance } from 'fastify';

describe('Section 2 Gate — Unauthenticated Protected Route Access Control', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
  });

  const protectedEndpoints: { method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'; url: string; label: string }[] = [
    { method: 'GET', url: '/api/v1/auth/me', label: 'Auth Profile (/auth/me)' },
    { method: 'POST', url: '/api/v1/auth/logout', label: 'Auth Logout (/auth/logout)' },
    { method: 'POST', url: '/api/v1/auth/change-password', label: 'Change Password (/auth/change-password)' },
    { method: 'GET', url: '/api/v1/auth/sessions', label: 'Active Sessions (/auth/sessions)' },
    { method: 'GET', url: '/api/v1/profile/me', label: 'Current Profile (/profile/me)' },
    { method: 'POST', url: '/api/v1/posts', label: 'Create Post (/posts)' },
    { method: 'POST', url: '/api/v1/voyages', label: 'Create Voyage (/voyages)' },
    { method: 'POST', url: '/api/v1/crews', label: 'Create Crew (/crews)' },
    { method: 'GET', url: '/api/v1/messages/conversations', label: 'List Conversations (/messages/conversations)' },
    { method: 'POST', url: '/api/v1/messages/send', label: 'Send Direct Message (/messages/send)' },
    { method: 'GET', url: '/api/v1/vynks/connections', label: 'Connection Roster (/vynks/connections)' },
    { method: 'POST', url: '/api/v1/vynks/request/user-test-target', label: 'Send Connection Request (/vynks/request/:id)' },
    { method: 'GET', url: '/api/v1/pulse/summary', label: 'VYNK Pulse Summary (/pulse/summary)' },
    { method: 'GET', url: '/api/v1/pulse/events', label: 'VYNK Pulse Events (/pulse/events)' },
    { method: 'GET', url: '/api/v1/admin/analytics', label: 'Admin Analytics (/admin/analytics)' },
    { method: 'GET', url: '/api/v1/blocks', label: 'User Blocks (/blocks)' },
    { method: 'GET', url: '/api/v1/reports', label: 'Safety Reports (/reports)' },
    { method: 'POST', url: '/api/v1/storage/signed-url', label: 'Upload Signed URL (/storage/signed-url)' },
  ];

  for (const { method, url, label } of protectedEndpoints) {
    it(`strictly denies unauthenticated request to ${label} with 401 Unauthorized`, async () => {
      const res = await app.inject({
        method,
        url,
        payload: method === 'POST' || method === 'PUT' || method === 'PATCH' ? {} : undefined,
      });

      expect([401, 403]).toContain(res.statusCode);
      const json = res.json();
      expect(json.success).toBe(false);
    });
  }
});
