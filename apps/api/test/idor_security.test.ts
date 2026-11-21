import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/server';
import { FastifyInstance } from 'fastify';
import { prisma } from '@vynk/database';
import { generateTestPassword } from './test-helpers';

describe('Phase C Security Suite: IDOR, Ownership, Safety & RBAC Verification', () => {
  let app: FastifyInstance;
  let userA: any;
  let userB: any;
  let adminUser: any;
  let tokenA: string;
  let tokenB: string;
  let adminToken: string;
  let testPostId: string;
  const testIds: string[] = [];

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();

    const timestamp = Date.now();
    const passwordA = generateTestPassword();
    const passwordB = generateTestPassword();

    // 1. Create User A
    const regA = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: `idor_user_a_${timestamp}@citchennai.net`,
        password: passwordA,
        username: `idor_a_${timestamp}`,
        displayName: 'Security Student Alpha',
        college: 'Chennai Institute of Technology',
        department: 'Cybersecurity',
        graduationYear: 2026,
      },
    });
    expect(regA.statusCode).toBe(201);
    const jsonA = regA.json();
    userA = jsonA.data.user;
    tokenA = jsonA.data.accessToken;
    testIds.push(userA.id);

    // 2. Create User B
    const regB = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: `idor_user_b_${timestamp}@citchennai.net`,
        password: passwordB,
        username: `idor_b_${timestamp}`,
        displayName: 'Security Student Beta',
        college: 'Chennai Institute of Technology',
        department: 'Artificial Intelligence',
        graduationYear: 2026,
      },
    });
    expect(regB.statusCode).toBe(201);
    const jsonB = regB.json();
    userB = jsonB.data.user;
    tokenB = jsonB.data.accessToken;
    testIds.push(userB.id);

    // 3. Login as Admin
    const adminLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: process.env.OWNER_EMAIL || 'asmitha7intech@gmail.com',
        password: process.env.OWNER_INITIAL_PASSWORD,
      },
    });
    expect(adminLogin.statusCode).toBe(200);
    const adminJson = adminLogin.json();
    adminUser = adminJson.data.user;
    adminToken = adminJson.data.accessToken;

    // 4. User A creates a post
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/v1/posts',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: {
        title: 'User A Original Research Paper',
        content: 'Confidential draft on decentralized protocol architecture.',
        type: 'TEXT',
        tags: ['security', 'crypto'],
      },
    });
    expect(postRes.statusCode).toBe(201);
    testPostId = postRes.json().data.id;
  });

  afterAll(async () => {
    // Cleanup
    if (testPostId) {
      await prisma.post.delete({ where: { id: testPostId } }).catch(() => {});
    }
    for (const id of testIds) {
      await (prisma as any).block?.deleteMany({ where: { OR: [{ blockerId: id }, { blockedId: id }] } });
      await (prisma as any).report?.deleteMany({ where: { reporterId: id } });
      await prisma.user.delete({ where: { id } }).catch(() => {});
    }
    await app.close();
  });

  // =========================================================================
  // 1. IDOR POST OWNERSHIP CONTROLS
  // =========================================================================
  describe('IDOR & Post Ownership Protection', () => {
    it('rejects User B attempting to edit User A post with 403 Forbidden', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/v1/posts/${testPostId}`,
        headers: { authorization: `Bearer ${tokenB}` },
        payload: {
          title: 'Hacked by User B',
          content: 'Malicious modification of original author post.',
        },
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().success).toBe(false);
      expect(res.json().message).toContain('Forbidden');
    });

    it('rejects User B attempting to delete User A post with 403 Forbidden', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/posts/${testPostId}`,
        headers: { authorization: `Bearer ${tokenB}` },
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().success).toBe(false);
      expect(res.json().message).toContain('Forbidden');
    });

    it('allows User A to successfully edit their own post', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/v1/posts/${testPostId}`,
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          title: 'User A Legitimate Revision',
          content: 'Updated decentralized protocol architecture draft.',
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().success).toBe(true);
      expect(res.json().data.title).toBe('User A Legitimate Revision');
    });
  });

  // =========================================================================
  // 2. SAFETY & USER BLOCKING
  // =========================================================================
  describe('Safety & User Blocking Enforcement', () => {
    it('allows User A to block User B', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/blocks/${userB.id}`,
        headers: { authorization: `Bearer ${tokenA}` },
      });

      expect(res.statusCode).toBe(201);
      expect(res.json().success).toBe(true);
    });

    it('lists blocked users for User A', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/blocks',
        headers: { authorization: `Bearer ${tokenA}` },
      });

      expect(res.statusCode).toBe(200);
      const list = res.json().data;
      expect(list.some((u: any) => u.id === userB.id)).toBe(true);
    });

    it('prevents direct conversation between User B and User A when blocked', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/messages/direct/${userA.id}`,
        headers: { authorization: `Bearer ${tokenB}` },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().message).toContain('blocked');
    });

    it('allows User A to unblock User B', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/blocks/${userB.id}`,
        headers: { authorization: `Bearer ${tokenA}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().success).toBe(true);
    });
  });

  // =========================================================================
  // 3. SAFETY REPORTS & ADMIN MODERATION AUDIT
  // =========================================================================
  describe('Safety Reports & Audit Logging', () => {
    let reportId: string;

    it('allows a student to submit a moderation report on a post', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/reports',
        headers: { authorization: `Bearer ${tokenB}` },
        payload: {
          targetType: 'POST',
          targetId: testPostId,
          reason: 'ACADEMIC_INTEGRITY',
          details: 'Needs citation check for reference code.',
        },
      });

      expect(res.statusCode).toBe(201);
      expect(res.json().success).toBe(true);
      reportId = res.json().data.id;
    });

    it('denies standard student from viewing the moderation queue with 403', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/reports',
        headers: { authorization: `Bearer ${tokenB}` },
      });

      expect(res.statusCode).toBe(403);
      expect(res.json().message).toContain('Forbidden');
    });

    it('allows authorized administrator to view reports and resolve them', async () => {
      const listRes = await app.inject({
        method: 'GET',
        url: '/api/v1/reports',
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(listRes.statusCode).toBe(200);
      const reports = listRes.json().data;
      expect(reports.some((r: any) => r.id === reportId)).toBe(true);

      // Resolve the report
      const resolveRes = await app.inject({
        method: 'PATCH',
        url: `/api/v1/reports/${reportId}/resolve`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { action: 'RESOLVED' },
      });

      expect(resolveRes.statusCode).toBe(200);
      expect(resolveRes.json().data.status).toBe('RESOLVED');
    });
  });

  // =========================================================================
  // 4. SECURE UPLOAD MAGIC BYTES VALIDATION
  // =========================================================================
  describe('Upload Security & Magic Bytes Verification', () => {
    it('rejects file upload whose content does not match image magic bytes', async () => {
      const fakeExecutable = Buffer.from('MZ\x90\x00\x03\x00\x00\x00DOS executable file header');
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/storage/upload?key=avatars/malicious.png',
        headers: {
          authorization: `Bearer ${tokenA}`,
          'content-type': 'application/json',
        },
        payload: {
          data: fakeExecutable.toString('base64'),
        },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().message).toContain('Invalid file format');
    });

    it('accepts valid PNG image with authentic magic bytes', async () => {
      // 1x1 transparent PNG buffer
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/storage/upload?key=avatars/valid.png',
        headers: {
          authorization: `Bearer ${tokenA}`,
          'content-type': 'application/json',
        },
        payload: {
          data: pngBase64,
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().success).toBe(true);
      expect(res.json().data.publicUrl).toBe('/uploads/avatars/valid.png');
    });
  });
});
