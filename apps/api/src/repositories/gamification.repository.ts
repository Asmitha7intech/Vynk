import { prisma } from '@vynk/database';

export const gamificationRepository = {
  addXPTransaction: async (userId: string, amount: number, reason: string, sourceType: string, sourceId?: string) => {
    return prisma.$transaction(async (tx) => {
      const transaction = await tx.xPTransaction.create({
        data: { userId, amount, reason, sourceType, sourceId },
      });

      const user = await tx.user.update({
        where: { id: userId },
        data: { xp: { increment: amount } },
      });

      // Calculate level: level = Math.floor(Math.sqrt(user.xp / 50)) + 1 capped at 10
      const newLevel = Math.min(10, Math.max(1, Math.floor(Math.sqrt(user.xp / 50)) + 1));
      if (newLevel !== user.level) {
        await tx.user.update({
          where: { id: userId },
          data: { level: newLevel },
        });
      }

      return { transaction, newXP: user.xp, level: newLevel };
    });
  },

  getLeaderboard: (scope: string, college?: string, department?: string, limit = 50) => {
    return prisma.user.findMany({
      where: {
        role: { notIn: ['SUPER_ADMIN', 'ADMIN'] },
        college: scope === 'COLLEGE' && college ? college : undefined,
        department: scope === 'DEPARTMENT' && department ? department : undefined,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        college: true,
        department: true,
        xp: true,
        level: true,
        streakDays: true,
        role: true,
      },
      orderBy: { xp: 'desc' },
      take: limit,
    });
  },

  listBadges: () => prisma.badge.findMany(),

  unlockBadge: (badgeId: string, userId: string) => prisma.userBadge.upsert({
    where: {
      badgeId_userId: { badgeId, userId },
    },
    update: {},
    create: { badgeId, userId },
  }),
};
