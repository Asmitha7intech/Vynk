import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/server';
import { FastifyInstance } from 'fastify';
import { prisma } from '@vynk/database';
import { generateTestPassword } from './test-helpers';

describe('Phase F E2E: Full Student Collaboration & Platform Lifecycle Workflows', () => {
  let app: FastifyInstance;
  let studentA: any;
  let studentB: any;
  let superAdmin: any;
  let tokenA: string;
  let tokenB: string;
  let superAdminToken: string;
  let connectionId: string;
  let conversationId: string;
  let testVoyageId: string;
  let testPostId: string;
  let testReportId: string;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();

    const timestamp = Date.now();
    const passwordA = generateTestPassword();
    const passwordB = generateTestPassword();

    // 1. Authenticate canonical SuperAdmin
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
    superAdmin = adminJson.data.user;
    superAdminToken = adminJson.data.accessToken;

    // 2. Register Student Alpha
    const regA = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: `student.alpha.${timestamp}@citchennai.net`,
        password: passwordA,
        username: `student_alpha_${timestamp}`,
        displayName: 'Alpha CIT Builder',
        college: 'Chennai Institute of Technology',
        department: 'Computer Science and Engineering',
        graduationYear: 2026,
      },
    });
    expect(regA.statusCode).toBe(201);
    const jsonA = regA.json();
    studentA = jsonA.data.user;
    tokenA = jsonA.data.accessToken;
    createdUserIds.push(studentA.id);

    // 3. Register Student Beta
    const regB = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: `student.beta.${timestamp}@citchennai.net`,
        password: passwordB,
        username: `student_beta_${timestamp}`,
        displayName: 'Beta CIT Systems Engineer',
        college: 'Chennai Institute of Technology',
        department: 'Artificial Intelligence and Data Science',
        graduationYear: 2026,
      },
    });
    expect(regB.statusCode).toBe(201);
    const jsonB = regB.json();
    studentB = jsonB.data.user;
    tokenB = jsonB.data.accessToken;
    createdUserIds.push(studentB.id);
  });

  afterAll(async () => {
    // Clean up created test users and related records
    try {
      for (const uid of createdUserIds) {
        await (prisma as any).session?.deleteMany?.({ where: { userId: uid } });
        await (prisma as any).post?.deleteMany?.({ where: { authorId: uid } });
        await (prisma as any).connection?.deleteMany?.({
          where: { OR: [{ requesterId: uid }, { addresseeId: uid }] },
        });
        await (prisma as any).block?.deleteMany?.({
          where: { OR: [{ blockerId: uid }, { blockedId: uid }] },
        });
        await (prisma as any).user?.deleteMany?.({ where: { id: uid } });
      }
    } catch {}
    await app.close();
  });

  // -------------------------------------------------------------
  // WORKFLOW 1: PEER NETWORKING & MESSAGING
  // -------------------------------------------------------------
  describe('Workflow 1: Peer Discovery, Mutual Connection & Direct Messaging', () => {
    it('Student A sends a connection request to Student B', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/vynks/request/${studentB.id}`,
        headers: { authorization: `Bearer ${tokenA}` },
      });

      expect(res.statusCode).toBe(201);
      const json = res.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('PENDING');
      connectionId = json.data.id;
    });

    it('Student B views received connection requests', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/vynks/requests/pending',
        headers: { authorization: `Bearer ${tokenB}` },
      });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.success).toBe(true);
      const match = (json.data || []).find(
        (r: any) => r.senderId === studentA.id || r.requesterId === studentA.id
      );
      expect(match).toBeDefined();
    });

    it('Student B accepts the connection request', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/vynks/accept/${connectionId}`,
        headers: { authorization: `Bearer ${tokenB}` },
      });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('ACCEPTED');
    });

    it('Direct conversation is automatically available between connected peers', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/messages/direct/${studentB.id}`,
        headers: { authorization: `Bearer ${tokenA}` },
      });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBeDefined();
      conversationId = json.data.id;
    });

    it('Student A sends a direct message to Student B', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/messages/send',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          conversationId,
          content: 'Hey Beta! Let us team up for the smart campus hackathon!',
        },
      });

      expect(res.statusCode).toBe(201);
      const json = res.json();
      expect(json.success).toBe(true);
      expect(json.data.content).toBe('Hey Beta! Let us team up for the smart campus hackathon!');
    });

    it('Student B reads the message history and receives the dispatch', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/messages/conversations/${conversationId}/messages`,
        headers: { authorization: `Bearer ${tokenB}` },
      });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.success).toBe(true);
      const messages = json.data || [];
      expect(messages.some((m: any) => m.content.includes('smart campus hackathon'))).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // WORKFLOW 2: VOYAGE PROJECT COLLABORATION & TASKS
  // -------------------------------------------------------------
  describe('Workflow 2: Voyage Project Workspace, Tasks & Feed Integration', () => {
    it('Student A creates a new Voyage project workspace', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/voyages',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          title: 'Campus Pulse AI Engine',
          tagline: 'High-throughput real-time telemetry processing engine',
          description: 'A low-latency telemetry processing pipeline for campus resource monitoring with DuckDB and Fastify.',
          category: 'AI',
          technologies: ['TypeScript', 'Fastify', 'DuckDB'],
        },
      });

      expect(res.statusCode).toBe(201);
      const json = res.json();
      expect(json.success).toBe(true);
      testVoyageId = json.data.id;
    });

    it('Student A publishes a Voyage launch post to the campus feed', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/posts',
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          content: 'Just launched Campus Pulse AI Engine on VYNK Voyages! Looking for systems contributors.',
          type: 'VOYAGE_LAUNCH',
          voyageId: testVoyageId,
          tags: ['AI', 'Voyage', 'OpenSource'],
        },
      });

      expect(res.statusCode).toBe(201);
      const json = res.json();
      expect(json.success).toBe(true);
      testPostId = json.data.id;
    });

    it('Student B discovers and likes the project update post', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/posts/${testPostId}/react`,
        headers: { authorization: `Bearer ${tokenB}` },
        payload: { type: 'LIKE' },
      });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.success).toBe(true);
      expect(json.data.likesCount).toBeGreaterThanOrEqual(1);
    });

    it('Student B adds a project comment and feedback', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/posts/${testPostId}/comments`,
        headers: { authorization: `Bearer ${tokenB}` },
        payload: {
          content: 'Awesome architecture! Would love to contribute to the DuckDB telemetry layer.',
        },
      });

      expect(res.statusCode).toBe(201);
      const json = res.json();
      expect(json.success).toBe(true);
      expect(json.data.content).toContain('DuckDB');
    });

    it('Student A creates a project milestone task on the voyage', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/voyages/${testVoyageId}/tasks`,
        headers: { authorization: `Bearer ${tokenA}` },
        payload: {
          title: 'Implement DuckDB Parquet Reader',
          description: 'Build fast column parser for telemetry events.',
          priority: 'HIGH',
        },
      });

      expect(res.statusCode).toBe(201);
      const json = res.json();
      expect(json.success).toBe(true);
      expect(json.data.title).toBe('Implement DuckDB Parquet Reader');
    });
  });

  // -------------------------------------------------------------
  // WORKFLOW 3: CAMPUS SAFETY, REPORTING & MODERATION
  // -------------------------------------------------------------
  describe('Workflow 3: Safety Reports, Moderation Resolution & User Blocking', () => {
    it('Student B files a safety report against suspicious content', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/reports',
        headers: { authorization: `Bearer ${tokenB}` },
        payload: {
          targetType: 'POST',
          targetId: testPostId,
          reason: 'COMMUNITY_GUIDELINE_REVIEW',
          details: 'Requesting review of automated test telemetry tags.',
        },
      });

      expect(res.statusCode).toBe(201);
      const json = res.json();
      expect(json.success).toBe(true);
      testReportId = json.data.id;
    });

    it('Super Admin reviews the safety report queue and resolves it', async () => {
      // 1. Fetch reports queue
      const listRes = await app.inject({
        method: 'GET',
        url: '/api/v1/reports',
        headers: { authorization: `Bearer ${superAdminToken}` },
      });
      expect(listRes.statusCode).toBe(200);

      // 2. Resolve the report
      const resolveRes = await app.inject({
        method: 'PATCH',
        url: `/api/v1/reports/${testReportId}/resolve`,
        headers: { authorization: `Bearer ${superAdminToken}` },
        payload: { action: 'RESOLVED' },
      });
      expect(resolveRes.statusCode).toBe(200);
      expect(resolveRes.json().data.status).toBe('RESOLVED');
    });

    it('Student A blocks an abusive or spammy account', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/blocks/${studentB.id}`,
        headers: { authorization: `Bearer ${tokenA}` },
      });

      expect(res.statusCode).toBe(201);
      const json = res.json();
      expect(json.success).toBe(true);
    });

    it('Blocked student cannot send direct messages to blocker', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/messages/send',
        headers: { authorization: `Bearer ${tokenB}` },
        payload: {
          conversationId,
          content: 'This message should be rejected due to active block policy.',
        },
      });

      expect(res.statusCode).toBe(403);
      const json = res.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain('blocked');
    });

    it('Student A unblocks Student B and restores access', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/blocks/${studentB.id}`,
        headers: { authorization: `Bearer ${tokenA}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().success).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // WORKFLOW 4: MULTI-DEVICE SESSIONS & ROTATION
  // -------------------------------------------------------------
  describe('Workflow 4: Active Session Listing, Rotation & Device Revocation', () => {
    it('Student A lists active authorized sessions', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/sessions',
        headers: { authorization: `Bearer ${tokenA}` },
      });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data.sessions)).toBe(true);
    });

    it('Student A revokes all other active sessions', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/sessions/revoke-all',
        headers: { authorization: `Bearer ${tokenA}` },
      });

      expect(res.statusCode).toBe(200);
      const json = res.json();
      expect(json.success).toBe(true);
    });
  });
});
