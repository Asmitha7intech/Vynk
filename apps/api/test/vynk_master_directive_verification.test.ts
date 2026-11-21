import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@vynk/database';
import { buildServer } from '../src/server';
import { FastifyInstance } from 'fastify';

describe('VYNK Master Directive — Verification of Mutual Connections, Admin RBAC & Real Data', () => {
  let app: FastifyInstance;
  const suffix = Date.now().toString().slice(-6);

  let student1: any;
  let token1: string;

  let student2: any;
  let token2: string;

  let student3: any;
  let token3: string;

  let adminUser: any;
  let adminToken: string;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();

    // 1. Create Student 1
    const r1 = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: `student1_${suffix}@citchennai.net`,
        password: 'Password123!',
        username: `stud1_${suffix}`,
        displayName: 'Student One',
        college: 'Chennai Institute of Technology',
        department: 'Computer Science',
        graduationYear: 2026,
      },
    });
    expect(r1.statusCode).toBe(201);
    student1 = r1.json().data.user;
    token1 = r1.json().data.accessToken;

    // 2. Create Student 2
    const r2 = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: `student2_${suffix}@citchennai.net`,
        password: 'Password123!',
        username: `stud2_${suffix}`,
        displayName: 'Student Two',
        college: 'Chennai Institute of Technology',
        department: 'AI & Data Science',
        graduationYear: 2026,
      },
    });
    expect(r2.statusCode).toBe(201);
    student2 = r2.json().data.user;
    token2 = r2.json().data.accessToken;

    // 3. Create Student 3
    const r3 = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: `student3_${suffix}@citchennai.net`,
        password: 'Password123!',
        username: `stud3_${suffix}`,
        displayName: 'Student Three',
        college: 'Chennai Institute of Technology',
        department: 'Electrical Engineering',
        graduationYear: 2026,
      },
    });
    expect(r3.statusCode).toBe(201);
    student3 = r3.json().data.user;
    token3 = r3.json().data.accessToken;

    // 4. Admin login
    const adminLoginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'admin@citchennai.net',
        password: 'AdminPassword123!',
      },
    });

    if (adminLoginRes.statusCode === 200) {
      adminUser = adminLoginRes.json().data.user;
      adminToken = adminLoginRes.json().data.accessToken;
    } else {
      // Create admin user for testing
      const regAdmin = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          email: `admin_tester_${suffix}@citchennai.net`,
          password: 'AdminPassword123!',
          username: `admin_${suffix}`,
          displayName: 'Test Admin',
          college: 'Chennai Institute of Technology',
          department: 'Computer Science',
          graduationYear: 2026,
        },
      });
      adminUser = regAdmin.json().data.user;
      await (prisma as any).user.update({
        where: { id: adminUser.id },
        data: { role: 'ADMIN' },
      });
      const loginAgain = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: `admin_tester_${suffix}@citchennai.net`,
          password: 'AdminPassword123!',
        },
      });
      adminToken = loginAgain.json().data.accessToken;
      adminUser = loginAgain.json().data.user;
    }
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Phase 3: Secure Administrator Provisioning & RBAC Access Control', () => {
    it('verifies primary admin accounts exist in database with role ADMIN', async () => {
      const ashUser = await (prisma as any).user.findFirst({
        where: {
          OR: [
            { email: 'ash@citchennai.net' },
            { username: 'ash' },
            { email: 'ash@mit.edu' },
          ],
        },
      });
      expect(ashUser).toBeDefined();
      expect(ashUser.role).toBe('ADMIN');

      const asmithaUser = await (prisma as any).user.findFirst({
        where: {
          OR: [
            { email: 'asmitha7intech@gmail.com' },
            { username: 'asmitha' },
            { email: 'asmitha_1789140990765@mit.edu' },
          ],
        },
      });
      expect(asmithaUser).toBeDefined();
      expect(['ADMIN', 'SUPER_ADMIN']).toContain(asmithaUser.role);
    });

    it('denies unauthenticated requests to /api/v1/pulse/summary with 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/pulse/summary',
      });
      expect(res.statusCode).toBe(401);
      expect(res.json().success).toBe(false);
    });

    it('denies regular student access to /api/v1/pulse/summary with 403 Forbidden', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/pulse/summary',
        headers: { authorization: `Bearer ${token1}` },
      });
      expect(res.statusCode).toBe(403);
      expect(res.json().message).toContain('Forbidden');
    });

    it('grants authorized administrator access to /api/v1/pulse/summary with genuine metrics', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/pulse/summary',
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(200);
      const data = res.json().data;
      expect(data).toBeDefined();
      expect(data.kpis).toBeDefined();
      expect(typeof data.kpis.total_registered_users).toBe('number');
      expect(data.kpis.total_registered_users).toBeGreaterThan(0);
      // Verify metrics match genuine database count, not fabricated 100k
      const actualCount = await (prisma as any).user.count();
      expect(data.kpis.total_registered_users).toBe(actualCount);
    });
  });

  describe('Phase 4: Real Mutual-Consent Connection Requests', () => {
    let connectionId1to2: string;
    let connectionId3to2: string;

    it('prevents self-connection request', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/vynks/request/${student1.id}`,
        headers: { authorization: `Bearer ${token1}` },
      });
      expect(res.statusCode).toBe(500);
      expect(res.json().message).toContain('Cannot connect with yourself');
    });

    it('creates a PENDING connection request from Student 1 to Student 2 (not instant accepted)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/vynks/request/${student2.id}`,
        headers: { authorization: `Bearer ${token1}` },
      });
      expect(res.statusCode).toBe(201);
      const data = res.json().data;
      expect(data).toBeDefined();
      expect(data.status).toBe('PENDING');
      expect(data.senderId).toBe(student1.id);
      expect(data.receiverId).toBe(student2.id);
      connectionId1to2 = data.id;

      // Verify notification created for recipient Student 2
      const notifsRes = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications',
        headers: { authorization: `Bearer ${token2}` },
      });
      expect(notifsRes.statusCode).toBe(200);
      const notifs = notifsRes.json().data?.notifications || notifsRes.json().data;
      const connNotif = notifs.find((n: any) => n.type === 'CONNECTION_REQUEST');
      expect(connNotif).toBeDefined();
      expect(connNotif.message).toContain('Student One sent you a connection request');
    });

    it('rejects duplicate pending request between the same users', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/vynks/request/${student2.id}`,
        headers: { authorization: `Bearer ${token1}` },
      });
      expect(res.statusCode).toBe(500);
      expect(res.json().message).toContain('already pending');
    });

    it('lists the request under Sent Pending for Student 1 and Incoming for Student 2', async () => {
      // Sent for Student 1
      const sentRes = await app.inject({
        method: 'GET',
        url: '/api/v1/vynks/requests/sent',
        headers: { authorization: `Bearer ${token1}` },
      });
      expect(sentRes.statusCode).toBe(200);
      const sentList = sentRes.json().data;
      expect(sentList.some((r: any) => r.id === connectionId1to2)).toBe(true);

      // Incoming for Student 2
      const incRes = await app.inject({
        method: 'GET',
        url: '/api/v1/vynks/requests/pending',
        headers: { authorization: `Bearer ${token2}` },
      });
      expect(incRes.statusCode).toBe(200);
      const incList = incRes.json().data;
      expect(incList.some((r: any) => r.id === connectionId1to2)).toBe(true);
    });

    it('prevents sender from accepting their own request', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/vynks/requests/${connectionId1to2}/accept`,
        headers: { authorization: `Bearer ${token1}` },
      });
      expect(res.statusCode).toBe(500);
      expect(res.json().message).toContain('Unauthorized: You can only accept requests sent to you');
    });

    it('allows intended recipient (Student 2) to accept the request, establishing mutual connection', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/vynks/requests/${connectionId1to2}/accept`,
        headers: { authorization: `Bearer ${token2}` },
      });
      expect(res.statusCode).toBe(200);
      const data = res.json().data;
      expect(data.status).toBe('ACCEPTED');

      // Verify mutual presence in /connections for both users
      const conn1Res = await app.inject({
        method: 'GET',
        url: '/api/v1/vynks/connections',
        headers: { authorization: `Bearer ${token1}` },
      });
      const conn1 = conn1Res.json().data;
      expect(conn1.some((c: any) => c.senderId === student2.id || c.receiverId === student2.id)).toBe(true);

      const conn2Res = await app.inject({
        method: 'GET',
        url: '/api/v1/vynks/connections',
        headers: { authorization: `Bearer ${token2}` },
      });
      const conn2 = conn2Res.json().data;
      expect(conn2.some((c: any) => c.senderId === student1.id || c.receiverId === student1.id)).toBe(true);

      // Verify acceptance notification sent to sender (Student 1)
      const notifsRes = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications',
        headers: { authorization: `Bearer ${token1}` },
      });
      const notifs = notifsRes.json().data?.notifications || notifsRes.json().data;
      const acceptedNotif = notifs.find((n: any) => n.type === 'CONNECTION_ACCEPTED');
      expect(acceptedNotif).toBeDefined();
    });

    it('handles request decline cleanly by updating status to REJECTED', async () => {
      // Student 3 sends request to Student 2
      const sendRes = await app.inject({
        method: 'POST',
        url: `/api/v1/vynks/request/${student2.id}`,
        headers: { authorization: `Bearer ${token3}` },
      });
      expect(sendRes.statusCode).toBe(201);
      connectionId3to2 = sendRes.json().data.id;

      // Student 2 declines
      const declineRes = await app.inject({
        method: 'POST',
        url: `/api/v1/vynks/requests/${connectionId3to2}/reject`,
        headers: { authorization: `Bearer ${token2}` },
      });
      expect(declineRes.statusCode).toBe(200);
      expect(declineRes.json().data.status).toBe('REJECTED');

      // Verify neither user shows up in each other's accepted connections
      const conn3Res = await app.inject({
        method: 'GET',
        url: '/api/v1/vynks/connections',
        headers: { authorization: `Bearer ${token3}` },
      });
      expect(conn3Res.json().data.some((c: any) => c.senderId === student2.id || c.receiverId === student2.id)).toBe(false);
    });

    it('allows sender to cancel a pending outgoing request', async () => {
      // Student 1 sends request to Student 3
      const sendRes = await app.inject({
        method: 'POST',
        url: `/api/v1/vynks/request/${student3.id}`,
        headers: { authorization: `Bearer ${token1}` },
      });
      expect(sendRes.statusCode).toBe(201);
      const connId = sendRes.json().data.id;

      // Student 1 cancels
      const cancelRes = await app.inject({
        method: 'DELETE',
        url: `/api/v1/vynks/requests/${connId}`,
        headers: { authorization: `Bearer ${token1}` },
      });
      expect(cancelRes.statusCode).toBe(200);
      expect(cancelRes.json().message).toContain('canceled');

      // Verify request is removed from sent list
      const sentRes = await app.inject({
        method: 'GET',
        url: '/api/v1/vynks/requests/sent',
        headers: { authorization: `Bearer ${token1}` },
      });
      expect(sentRes.json().data.some((r: any) => r.id === connId)).toBe(false);
    });

    it('verifies profile endpoint returns correct mutual connection status', async () => {
      // Student 1 viewing Student 2's profile should return connectionStatus: 'CONNECTED'
      const profRes = await app.inject({
        method: 'GET',
        url: `/api/v1/users/${student2.username}`,
        headers: { authorization: `Bearer ${token1}` },
      });
      expect(profRes.statusCode).toBe(200);
      expect(profRes.json().data.connectionStatus).toBe('CONNECTED');

      // Student 1 viewing Student 3's profile should return connectionStatus: 'NONE'
      const prof3Res = await app.inject({
        method: 'GET',
        url: `/api/v1/users/${student3.username}`,
        headers: { authorization: `Bearer ${token1}` },
      });
      expect(prof3Res.statusCode).toBe(200);
      expect(prof3Res.json().data.connectionStatus).toBe('NONE');
    });
  });
});
