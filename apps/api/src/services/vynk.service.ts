import { vynkRepository } from '../repositories/vynk.repository';
import { VynkStatus } from '@vynk/database';

export const vynkService = {
  sendRequest: async (senderId: string, receiverId: string) => {
    if (senderId === receiverId) throw new Error('Cannot connect with yourself');
    const existing = await vynkRepository.findConnection(senderId, receiverId);
    if (existing) {
      if (existing.status === 'ACCEPTED') throw new Error('Already connected');
      if (existing.status === 'PENDING') throw new Error('Connection request is already pending');
    }
    return vynkRepository.sendRequest(senderId, receiverId);
  },

  acceptRequest: async (connectionId: string, userId: string) => {
    return vynkRepository.updateStatus(connectionId, VynkStatus.ACCEPTED);
  },

  rejectRequest: async (connectionId: string, userId: string) => {
    return vynkRepository.updateStatus(connectionId, VynkStatus.REJECTED);
  },

  getConnections: (userId: string) => vynkRepository.listAcceptedVynks(userId),

  getPendingRequests: (userId: string) => vynkRepository.listPendingRequests(userId),

  followUser: (followerId: string, followingId: string) => vynkRepository.follow(followerId, followingId),

  unfollowUser: (followerId: string, followingId: string) => vynkRepository.unfollow(followerId, followingId),
};
