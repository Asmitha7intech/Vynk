import { vynkRepository } from '../repositories/vynk.repository';
import { VynkStatus, prisma } from '@vynk/database';
import { notificationService } from './notification.service';
import { sendToUser } from '../realtime/socket';

export const vynkService = {
  sendRequest: async (senderId: string, receiverId: string) => {
    if (senderId === receiverId) {
      throw new Error('Cannot connect with yourself');
    }

    const targetUser = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!targetUser) {
      throw new Error('Student profile not found');
    }

    const existing = await vynkRepository.findConnection(senderId, receiverId);
    if (existing) {
      if (existing.status === 'ACCEPTED') {
        throw new Error('Already connected with this student');
      }
      if (existing.status === 'PENDING') {
        throw new Error('Connection request is already pending');
      }
      if (existing.status === 'REJECTED') {
        // Re-open request
        const updated = await vynkRepository.updateStatus(existing.id, VynkStatus.PENDING);
        const sender = await prisma.user.findUnique({ where: { id: senderId } });

        await notificationService.createNotification({
          userId: receiverId,
          type: 'CONNECTION_REQUEST',
          title: 'New Vynk Request',
          message: `${sender?.displayName || 'A student'} sent you a connection request.`,
          link: '/network',
          metadata: { senderId },
        });

        sendToUser(receiverId, 'connection:requested', updated);
        return updated;
      }
    }

    const conn = await vynkRepository.sendRequest(senderId, receiverId);
    const sender = await prisma.user.findUnique({ where: { id: senderId } });

    await notificationService.createNotification({
      userId: receiverId,
      type: 'CONNECTION_REQUEST',
      title: 'New Vynk Request',
      message: `${sender?.displayName || 'A student'} sent you a connection request.`,
      link: '/network',
      metadata: { senderId },
    });

    sendToUser(receiverId, 'connection:requested', conn);
    return conn;
  },

  acceptRequest: async (connectionId: string, userId: string) => {
    const connection = await vynkRepository.findConnectionById(connectionId);
    if (!connection) {
      throw new Error('Connection request not found');
    }

    // Backend authorization: Only the intended receiver can accept
    if (connection.receiverId !== userId) {
      throw new Error('Unauthorized: You can only accept requests sent to you');
    }

    const updated = await vynkRepository.updateStatus(connectionId, VynkStatus.ACCEPTED);
    const receiver = await prisma.user.findUnique({ where: { id: userId } });

    await notificationService.createNotification({
      userId: connection.senderId,
      type: 'CONNECTION_ACCEPTED',
      title: 'Connection Accepted',
      message: `${receiver?.displayName || 'Your peer'} accepted your Vynk request! You can now message each other.`,
      link: '/messages',
      metadata: { connectionId, receiverId: userId },
    });

    sendToUser(connection.senderId, 'connection:accepted', updated);
    return updated;
  },

  rejectRequest: async (connectionId: string, userId: string) => {
    const connection = await vynkRepository.findConnectionById(connectionId);
    if (!connection) {
      throw new Error('Connection request not found');
    }

    // Backend authorization: Only the intended receiver can reject
    if (connection.receiverId !== userId) {
      throw new Error('Unauthorized: You can only respond to requests sent to you');
    }

    return vynkRepository.updateStatus(connectionId, VynkStatus.REJECTED);
  },

  cancelRequest: async (connectionId: string, userId: string) => {
    const connection = await vynkRepository.findConnectionById(connectionId);
    if (!connection) {
      throw new Error('Connection request not found');
    }

    // Backend authorization: Sender can cancel outgoing, or either party can remove connection
    if (connection.senderId !== userId && connection.receiverId !== userId) {
      throw new Error('Unauthorized: You do not have permission to modify this connection');
    }

    return vynkRepository.deleteConnection(connectionId);
  },

  getConnections: (userId: string) => vynkRepository.listAcceptedVynks(userId),

  getPendingRequests: (userId: string) => vynkRepository.listPendingRequests(userId),

  getOutgoingPendingRequests: (userId: string) => vynkRepository.listOutgoingPendingRequests(userId),

  followUser: (followerId: string, followingId: string) => vynkRepository.follow(followerId, followingId),

  unfollowUser: (followerId: string, followingId: string) => vynkRepository.unfollow(followerId, followingId),
};
