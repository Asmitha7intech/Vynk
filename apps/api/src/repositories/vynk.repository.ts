import { prisma, VynkStatus } from '@vynk/database';

export const vynkRepository = {
  findConnection: (userAId: string, userBId: string) => prisma.connection.findFirst({
    where: {
      OR: [
        { senderId: userAId, receiverId: userBId },
        { senderId: userBId, receiverId: userAId },
      ],
    },
    include: { sender: true, receiver: true },
  }),

  sendRequest: (senderId: string, receiverId: string) => prisma.connection.create({
    data: {
      senderId,
      receiverId,
      status: VynkStatus.PENDING,
    },
    include: { sender: true, receiver: true },
  }),

  updateStatus: (id: string, status: VynkStatus) => prisma.connection.update({
    where: { id },
    data: { status },
    include: { sender: true, receiver: true },
  }),

  listAcceptedVynks: (userId: string) => prisma.connection.findMany({
    where: {
      status: VynkStatus.ACCEPTED,
      OR: [
        { senderId: userId },
        { receiverId: userId },
      ],
    },
    include: {
      sender: { include: { skills: true } },
      receiver: { include: { skills: true } },
    },
  }),

  listPendingRequests: (userId: string) => prisma.connection.findMany({
    where: {
      receiverId: userId,
      status: VynkStatus.PENDING,
    },
    include: {
      sender: { include: { skills: true, interests: true } },
    },
  }),

  follow: (followerId: string, followingId: string) => prisma.follow.create({
    data: { followerId, followingId },
  }),

  unfollow: (followerId: string, followingId: string) => prisma.follow.delete({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  }),
};
