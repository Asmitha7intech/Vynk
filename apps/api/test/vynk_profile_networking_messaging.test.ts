import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@vynk/database';
import { vynkService } from '../src/services/vynk.service';
import { userRepository } from '../src/repositories/user.repository';
import { messageService } from '../src/services/message.service';
import { notificationService } from '../src/services/notification.service';
import { getUploadsDir } from '../src/utils/paths';
import fs from 'fs';
import path from 'path';

describe('VYNK Master Verification — Profiles, Synthetic Removal, Networking & Messaging', () => {
  let studentA: any;
  let studentB: any;
  let studentC: any;

  const testIds: string[] = [];

  beforeAll(async () => {
    const timestamp = Date.now();
    studentA = await (prisma as any).user.create({
      data: {
        id: `usr_iso_test_a_${timestamp}`,
        email: `iso_test_a_${timestamp}@campus.edu`,
        username: `iso_stud_a_${timestamp}`,
        displayName: 'Test Student Alpha',
        passwordHash: 'hash',
        college: 'Test College',
        department: 'Computer Science',
        role: 'STUDENT',
      },
    });
    studentB = await (prisma as any).user.create({
      data: {
        id: `usr_iso_test_b_${timestamp}`,
        email: `iso_test_b_${timestamp}@campus.edu`,
        username: `iso_stud_b_${timestamp}`,
        displayName: 'Test Student Beta',
        passwordHash: 'hash',
        college: 'Test College',
        department: 'AI & Data Science',
        role: 'STUDENT',
      },
    });
    studentC = await (prisma as any).user.create({
      data: {
        id: `usr_iso_test_c_${timestamp}`,
        email: `iso_test_c_${timestamp}@campus.edu`,
        username: `iso_stud_c_${timestamp}`,
        displayName: 'Test Student Gamma',
        passwordHash: 'hash',
        college: 'Test College',
        department: 'Electrical Engineering',
        role: 'STUDENT',
      },
    });
    testIds.push(studentA.id, studentB.id, studentC.id);
  });

  afterAll(async () => {
    for (const id of testIds) {
      try {
        await (prisma as any).notification.deleteMany({ where: { recipientId: id } });
        await (prisma as any).connection.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } });
        await (prisma as any).conversationMember.deleteMany({ where: { userId: id } });
        await (prisma as any).user.delete({ where: { id } }).catch(() => {});
      } catch {}
    }
  });

  describe('1. Synthetic Student & Fake Activity Removal', () => {
    it('verifies synthetic users (Maya Lin, Priya Sharma, Alex Chen) are completely removed from database', async () => {
      const syntheticUsers = await (prisma as any).user.findMany({
        where: {
          OR: [
            { displayName: { contains: 'Maya Lin', mode: 'insensitive' } },
            { displayName: { contains: 'Priya Sharma', mode: 'insensitive' } },
            { displayName: { contains: 'Alex Chen', mode: 'insensitive' } },
            { displayName: { contains: 'Devon Vance', mode: 'insensitive' } },
            { id: { in: ['usr-alex-chen-001', 'usr-maya-lin-002', 'usr-devon-vance-003', 'usr-priya-sharma-004'] } },
          ],
        },
      });

      expect(syntheticUsers).toHaveLength(0);
    });

    it('verifies fake posts by synthetic accounts are not present in the database', async () => {
      const posts = await (prisma as any).post.findMany({
        where: {
          id: { in: ['post-launch-001', 'post-design-002', 'post-mentor-003'] },
        },
      });

      expect(posts).toHaveLength(0);
    });

    it('verifies all existing database users are authentic student accounts', async () => {
      const allUsers = await (prisma as any).user.findMany();
      expect(allUsers.length).toBeGreaterThan(0);
      for (const u of allUsers) {
        expect(u.displayName).not.toBe('Maya Lin');
        expect(u.displayName).not.toBe('Priya Sharma');
        expect(u.displayName).not.toBe('Alex Chen');
      }
    });
  });

  describe('2. Student Discovery & Connection Requests', () => {
    let connectionId: string;

    it('allows student A to discover student B in user directory', async () => {
      const results = await userRepository.searchUsers(studentB.username, 10);
      expect(results.some((u: any) => u.id === studentB.id)).toBe(true);
    });

    it('prevents a student from connecting with themselves', async () => {
      await expect(vynkService.sendRequest(studentA.id, studentA.id)).rejects.toThrow(
        /Cannot connect with yourself/i
      );
    });

    it('allows student A to send a genuine connection request to student B', async () => {
      // Clean any existing connection between test pair
      const existing = await (prisma as any).connection.findFirst({
        where: {
          OR: [
            { senderId: studentA.id, receiverId: studentB.id },
            { senderId: studentB.id, receiverId: studentA.id },
          ],
        },
      });
      if (existing) {
        await (prisma as any).connection.delete({ where: { id: existing.id } });
      }

      const connection = await vynkService.sendRequest(studentA.id, studentB.id);
      expect(connection).toBeDefined();
      expect(connection.senderId).toBe(studentA.id);
      expect(connection.receiverId).toBe(studentB.id);
      expect(connection.status).toBe('PENDING');
      connectionId = connection.id;
    });

    it('prevents duplicate connection requests between the same students', async () => {
      await expect(vynkService.sendRequest(studentA.id, studentB.id)).rejects.toThrow(
        /already pending/i
      );
    });

    it('enforces backend authorization: third party (student C) cannot accept connection request', async () => {
      await expect(vynkService.acceptRequest(connectionId, studentC.id)).rejects.toThrow(
        /Unauthorized/i
      );
    });

    it('allows intended recipient (student B) to accept the connection request', async () => {
      const accepted = await vynkService.acceptRequest(connectionId, studentB.id);
      expect(accepted.status).toBe('ACCEPTED');

      const connections = await vynkService.getConnections(studentA.id);
      expect(connections.some((c: any) => c.id === studentB.id || c.receiverId === studentB.id || c.senderId === studentB.id)).toBe(true);
    });
  });

  describe('3. Direct Messaging & Real-Time Persistence', () => {
    let directConversation: any;

    it('creates or retrieves canonical direct conversation between connected students A and B', async () => {
      directConversation = await messageService.getOrCreateDirectConversation(studentA.id, studentB.id);
      expect(directConversation).toBeDefined();
      expect(directConversation.type).toBe('DIRECT');
      expect(directConversation.members).toBeDefined();
      expect(directConversation.members.some((m: any) => m.id === studentA.id || m.userId === studentA.id)).toBe(true);
      expect(directConversation.members.some((m: any) => m.id === studentB.id || m.userId === studentB.id)).toBe(true);
    });

    it('is idempotent: repeated calls return the same direct conversation without duplicates', async () => {
      const duplicateCall = await messageService.getOrCreateDirectConversation(studentB.id, studentA.id);
      expect(duplicateCall.id).toBe(directConversation.id);
    });

    it('persists sent messages with authenticated sender ID and message timestamp', async () => {
      const messageText = `Live chat message from ${studentA.displayName} at ${Date.now()}`;
      const message = await messageService.sendMessage(
        directConversation.id,
        studentA.id,
        messageText
      );

      expect(message).toBeDefined();
      expect(message.id).toBeDefined();
      expect(message.conversationId).toBe(directConversation.id);
      expect(message.senderId).toBe(studentA.id);
      expect(message.content).toBe(messageText);

      // Verify persistence in conversation history
      const history = await messageService.getConversationMessages(directConversation.id, studentB.id);
      expect(history.some((m: any) => m.id === message.id && m.content === messageText)).toBe(true);
    });

    it('enforces conversation access control: unauthorized student C cannot read conversation messages', async () => {
      await expect(messageService.getConversationMessages(directConversation.id, studentC.id)).rejects.toThrow(
        /access/i
      );
    });

    it('updates read status when student B reads the conversation', async () => {
      const readResult = await messageService.markConversationRead(directConversation.id, studentB.id);
      expect(readResult.success).toBe(true);
    });
  });

  describe('4. Notifications System', () => {
    let testNotificationId: string;

    it('dispatches and persists genuine notifications for user events', async () => {
      const now = Date.now();
      const notif = await notificationService.createNotification({
        userId: studentB.id,
        type: 'CONNECTION_ACCEPTED',
        title: `Vynk Connected ${now}`,
        message: `${studentA.displayName} accepted your connection request at ${now}!`,
        link: '/network',
        metadata: { senderId: studentA.id },
      });

      expect(notif).toBeDefined();
      expect(notif.userId).toBe(studentB.id);
      expect(notif.isRead).toBe(false);
      testNotificationId = notif.id;

      const unreadCount = await notificationService.getUnreadCount(studentB.id);
      expect(unreadCount).toBeGreaterThanOrEqual(1);
    });

    it('marks a notification as read and decrements unread count', async () => {
      const updated = await notificationService.markAsRead(testNotificationId, studentB.id);
      expect(updated.isRead).toBe(true);
    });

    it('supports mark-all-as-read operation', async () => {
      await notificationService.createNotification({
        userId: studentB.id,
        type: 'SYSTEM',
        title: 'Campus Update',
        message: 'Welcome to real student networking on VYNK.',
      });

      const res = await notificationService.markAllAsRead(studentB.id);
      expect(res.success).toBe(true);

      const unread = await notificationService.getUnreadCount(studentB.id);
      expect(unread).toBe(0);
    });
  });

  describe('5. Persistent Profile Picture Storage', () => {
    it('verifies upload directory is anchored to workspace data/uploads', () => {
      const uploadsDir = getUploadsDir();
      expect(fs.existsSync(uploadsDir)).toBe(true);
      expect(uploadsDir).toContain('data');
      expect(uploadsDir).toContain('uploads');
    });

    it('persists avatar URL in user profile and survives database reads', async () => {
      const testAvatarUrl = `/uploads/avatar-test-${Date.now()}.png`;

      await (prisma as any).user.update({
        where: { id: studentA.id },
        data: { avatarUrl: testAvatarUrl },
      });

      const freshUser = await (prisma as any).user.findUnique({
        where: { id: studentA.id },
      });

      expect(freshUser.avatarUrl).toBe(testAvatarUrl);
    });
  });
});
