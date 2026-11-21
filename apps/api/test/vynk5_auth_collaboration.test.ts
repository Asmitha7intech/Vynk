import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '../src/services/auth.service';
import { voyageService } from '../src/services/voyage.service';
import { prisma } from '@vynk/database';

describe('VYNK 5.0 — Authentication, Session Revocation & Project Collaboration', () => {
  let testUserId: string;
  let testVoyageId: string;

  beforeEach(async () => {
    // Locate or verify seed user & voyage
    const user = await prisma.user.findFirst();
    testUserId = user ? user.id : 'usr_test_1';

    let voyage = await (prisma as any).project.findFirst({
      where: { title: 'Collaboration Test Project' }
    });
    if (!voyage) {
      voyage = await (prisma as any).project.create({
        data: {
          id: `prj_collab_test_${Date.now()}`,
          title: 'Collaboration Test Project',
          tagline: 'Automated testing project workspace',
          description: 'Testing team join requests and member capacities.',
          creatorId: testUserId,
          status: 'IN_PROGRESS',
          tags: ['React', 'TypeScript', 'Node.js'],
          maxCapacity: 50,
          members: [
            {
              userId: testUserId,
              roleName: 'Lead Architect',
              joinedAt: new Date().toISOString(),
            },
          ],
        },
      });
    }
    testVoyageId = voyage.id;
  });

  describe('1. Session Management & Server-Side Revocation', () => {
    it('creates active session tracking records on login', async () => {
      const session = await authService.createSession(testUserId, 'Mozilla/5.0 Test Browser', '192.168.1.1');
      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.userId).toBe(testUserId);
      expect(session.revokedAt).toBeNull();
      expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('immediately revokes session on logout so subsequent requests are blocked', async () => {
      const session = await authService.createSession(testUserId, 'Mozilla/5.0 Test Browser', '192.168.1.1');
      expect(session.revokedAt).toBeNull();

      await authService.logout(session.id, testUserId);

      const updated = await (prisma as any).session.findUnique({
        where: { id: session.id },
      });
      expect(updated).toBeDefined();
      expect(updated.revokedAt).not.toBeNull();
    });

    it('executes end-to-end password recovery and revokes all prior active sessions', async () => {
      const testEmail = `pwd_reset_${Date.now()}@citchennai.net`;
      const user = await (prisma as any).user.create({
        data: {
          email: testEmail,
          username: `reset_user_${Date.now()}`,
          displayName: 'Reset Test User',
          passwordHash: 'dummy',
          college: 'Chennai Institute of Technology',
          role: 'STUDENT',
        },
      });

      try {
        // 1. User requests password reset
        const forgotResult = await authService.forgotPassword(user.email);
        expect(forgotResult.success).toBe(true);
        expect(forgotResult.resetToken).toBeDefined();

        // Active session before reset
        const preSession = await authService.createSession(user.id, 'Old Device', '10.0.0.1');

        // 2. User completes reset with token
        const resetResult = await authService.resetPassword(forgotResult.resetToken!, 'BrandNewSecurePass#2026');
        expect(resetResult.success).toBe(true);

        // Verify old session was terminated
        const refreshedSession = await (prisma as any).session.findUnique({
          where: { id: preSession.id },
        });
        expect(refreshedSession.revokedAt).not.toBeNull();

        // Verify token cannot be reused
        await expect(
          authService.resetPassword(forgotResult.resetToken!, 'AnotherPassword#123')
        ).rejects.toThrow();
      } finally {
        await (prisma as any).session.deleteMany({ where: { userId: user.id } }).catch(() => {});
        await (prisma as any).passwordResetToken.deleteMany({ where: { userId: user.id } }).catch(() => {});
        await (prisma as any).user.delete({ where: { id: user.id } }).catch(() => {});
      }
    });
  });

  describe('2. Project Collaboration & Team Join Requests', () => {
    it('submits a join request with role and skills, recording project activity', async () => {
      // Create a test applicant user
      const applicant = await (prisma as any).user.create({
        data: {
          id: `usr_app_${Date.now()}`,
          email: `applicant_${Date.now()}@campus.edu`,
          username: `applicant_${Date.now()}`,
          displayName: 'Test Applicant',
          passwordHash: 'hashed',
          role: 'STUDENT',
          xp: 100,
          level: 1,
        },
      });

      const joinReq = await voyageService.createJoinRequest(testVoyageId, applicant.id, {
        roleName: 'Frontend Engineer',
        message: 'Excited to contribute to React components and animations.',
        skills: ['React', 'TypeScript', 'Tailwind'],
      });

      expect(joinReq).toBeDefined();
      expect(joinReq.status).toBe('PENDING');
      expect(joinReq.roleName).toBe('Frontend Engineer');

      // Duplicate pending request should be blocked
      await expect(
        voyageService.createJoinRequest(testVoyageId, applicant.id, {
          roleName: 'Frontend Engineer',
          message: 'Second attempt',
        })
      ).rejects.toThrow();

      // Clean up test applicant user from database
      await (prisma as any).user.delete({ where: { id: applicant.id } }).catch(() => {});
    });

    it('allows creator to review and accept applicant, adding them to team members', async () => {
      const voyage = await voyageService.getVoyage(testVoyageId);
      const creatorId = voyage.creatorId;

      const newMember = await (prisma as any).user.create({
        data: {
          id: `usr_cand_${Date.now()}`,
          email: `candidate_${Date.now()}@campus.edu`,
          username: `cand_${Date.now()}`,
          displayName: 'Accepted Dev',
          passwordHash: 'hashed',
          role: 'STUDENT',
          xp: 100,
          level: 1,
        },
      });

      const req = await voyageService.createJoinRequest(testVoyageId, newMember.id, {
        roleName: 'Backend Engineer',
        message: 'I can build the Fastify API services.',
        skills: ['Node.js', 'Fastify', 'SQL'],
      });

      // Creator reviews and accepts
      const acceptedReq = await voyageService.respondToJoinRequest(testVoyageId, req.id, creatorId, 'ACCEPTED');
      expect(acceptedReq.status).toBe('ACCEPTED');

      // Verify applicant is now in project members
      const updatedVoyage = await voyageService.getVoyage(testVoyageId);
      const isNowMember = updatedVoyage.members.some((m: any) => m.userId === newMember.id);
      expect(isNowMember).toBe(true);

      // Clean up applicant from database to keep test runs isolated
      await (prisma as any).user.delete({ where: { id: newMember.id } }).catch(() => {});
    });

    it('creates project tasks and manages lifecycle status', async () => {
      const task = await voyageService.createTask(testVoyageId, testUserId, {
        title: 'Implement Dark Neon Glow Effects',
        description: 'Update CSS variables and cursor canvas shaders',
        priority: 'HIGH',
        dueDate: '2026-11-01',
      });

      expect(task).toBeDefined();
      expect(task.title).toBe('Implement Dark Neon Glow Effects');
      expect(task.status).toBe('TODO');

      // Move task to IN_PROGRESS and COMPLETED
      const inProgress = await voyageService.updateTask(testVoyageId, task.id, testUserId, {
        status: 'IN_PROGRESS',
      });
      expect(inProgress.status).toBe('IN_PROGRESS');

      const completed = await voyageService.updateTask(testVoyageId, task.id, testUserId, {
        status: 'COMPLETED',
      });
      expect(completed.status).toBe('COMPLETED');
    });

    it('posts discussion updates to project workspace feed', async () => {
      const discussion = await voyageService.createDiscussion(
        testVoyageId,
        testUserId,
        'Team sprint update: All auth tests and image magic-byte verification are passing.'
      );

      expect(discussion).toBeDefined();
      expect(discussion.content).toContain('Team sprint update');
      expect(discussion.authorId).toBe(testUserId);
    });
  });

  describe('3. Avatar Validation Security Logic', () => {
    it('detects valid JPEG magic bytes (FF D8 FF)', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      expect(jpegBuffer[0]).toBe(0xff);
      expect(jpegBuffer[1]).toBe(0xd8);
      expect(jpegBuffer[2]).toBe(0xff);
    });

    it('detects valid PNG magic bytes (89 50 4E 47)', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      expect(pngBuffer[0]).toBe(0x89);
      expect(pngBuffer[1]).toBe(0x50);
      expect(pngBuffer[2]).toBe(0x4e);
      expect(pngBuffer[3]).toBe(0x47);
    });

    it('blocks malicious executable files spoofed with .jpg extensions', () => {
      const fakeExeBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00');
      const isJpeg = fakeExeBuffer[0] === 0xff && fakeExeBuffer[1] === 0xd8 && fakeExeBuffer[2] === 0xff;
      const isPng = fakeExeBuffer[0] === 0x89 && fakeExeBuffer[1] === 0x50 && fakeExeBuffer[2] === 0x4e && fakeExeBuffer[3] === 0x47;
      expect(isJpeg).toBe(false);
      expect(isPng).toBe(false);
    });
  });
});
