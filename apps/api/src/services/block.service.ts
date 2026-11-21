import { prisma } from '@vynk/database';

export const blockService = {
  blockUser: async (blockerId: string, blockedId: string) => {
    if (blockerId === blockedId) {
      throw new Error('You cannot block yourself.');
    }
    const existing = await (prisma as any).block.findFirst({
      where: { blockerId, blockedId },
    });
    if (existing) {
      return existing;
    }
    return (prisma as any).block.create({
      data: {
        blockerId,
        blockedId,
      },
    });
  },

  unblockUser: async (blockerId: string, blockedId: string) => {
    return (prisma as any).block.deleteMany({
      where: { blockerId, blockedId },
    });
  },

  getBlockedUsers: async (blockerId: string) => {
    const blocks = await (prisma as any).block.findMany({
      where: { blockerId },
    });
    const blockedIds = blocks.map((b: any) => b.blockedId);
    if (blockedIds.length === 0) return [];
    return prisma.user.findMany({
      where: {
        id: { in: blockedIds },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        college: true,
      },
    });
  },

  isBlocked: async (userAId: string, userBId: string): Promise<boolean> => {
    const block = await (prisma as any).block.findFirst({
      where: {
        OR: [
          { blockerId: userAId, blockedId: userBId },
          { blockerId: userBId, blockedId: userAId },
        ],
      },
    });
    return !!block;
  },
};
