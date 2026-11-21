import { prisma } from '@vynk/database';
import { sendToUser } from '../realtime/socket';

export interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: any;
}

export const notificationService = {
  createNotification: async (params: CreateNotificationParams) => {
    // Deduplication check: avoid exact duplicate notification within last 30 seconds
    const recent = await prisma.notification.findFirst({
      where: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        createdAt: {
          gte: new Date(Date.now() - 30000),
        },
      },
    });

    if (recent) {
      return recent;
    }

    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
        metadata: params.metadata || undefined,
        isRead: false,
      },
    });

    // Real-time socket delivery to recipient's room
    sendToUser(params.userId, 'notification:new', notification);

    return notification;
  },

  getUnreadCount: async (userId: string) => {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  },

  getUserNotifications: async (userId: string, limit = 50) => {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      notifications,
      unreadCount,
    };
  },

  markAsRead: async (notificationId: string, userId: string) => {
    const notif = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notif || notif.userId !== userId) {
      throw new Error('Notification not found or unauthorized');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  },

  markAllAsRead: async (userId: string) => {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  },
};
