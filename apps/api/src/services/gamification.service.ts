import { prisma } from '@vynk/database';
import { LeaderboardScope } from '@vynk/types';
import { eventService } from './event.service';

export const gamificationService = {
  calculateLevel: (xp: number): number => {
    if (xp >= 10000) return 10;
    if (xp >= 7500) return 9;
    if (xp >= 5000) return 8;
    if (xp >= 3500) return 7;
    if (xp >= 2250) return 6;
    if (xp >= 1500) return 5;
    if (xp >= 900) return 4;
    if (xp >= 500) return 3;
    if (xp >= 200) return 2;
    return 1;
  },

  awardXP: async (userId: string, amount: number, reason: string, sourceType: string, sourceId?: string) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const newXP = user.xp + amount;
    const newLevel = gamificationService.calculateLevel(newXP);
    const leveledUp = newLevel > user.level;

    const [updatedUser, transaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          xp: newXP,
          level: newLevel,
        },
      }),
      prisma.xPTransaction.create({
        data: {
          userId,
          amount,
          reason,
          sourceType,
          sourceId,
        },
      }),
    ]);

    await eventService.publish({
      eventType: 'XP_EARNED',
      userId,
      college: updatedUser.college || undefined,
      department: updatedUser.department || undefined,
      payload: {
        userId,
        amount,
        reason,
        sourceType,
        sourceId,
        totalXp: newXP,
        level: newLevel,
      },
    });

    if (leveledUp) {
      await eventService.publish({
        eventType: 'LEVEL_UP',
        userId,
        college: updatedUser.college || undefined,
        department: updatedUser.department || undefined,
        payload: {
          userId,
          oldLevel: user.level,
          newLevel,
          totalXp: newXP,
        },
      });
    }

    return { user: updatedUser, transaction, leveledUp };
  },

  getLeaderboard: async (scope: LeaderboardScope, scopeFilter?: string, limit = 50) => {
    let whereClause: any = {
      role: { notIn: ['SUPER_ADMIN', 'ADMIN'] },
    };

    if (scope === 'COLLEGE' && scopeFilter) {
      whereClause.college = scopeFilter;
    } else if (scope === 'DEPARTMENT' && scopeFilter) {
      whereClause.department = scopeFilter;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      take: limit,
      orderBy: { xp: 'desc' },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        college: true,
        department: true,
        level: true,
        xp: true,
        reputationScore: true,
        streakDays: true,
      },
    });

    return users.map((user, index) => ({
      rank: index + 1,
      user,
      score: user.xp,
      movement: 0,
    }));
  },

  getRankExplanation: async (userId: string, scope: LeaderboardScope = 'GLOBAL') => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, xp: true, streakDays: true, college: true, department: true },
    });

    if (!user) throw new Error('User not found');

    const transactions = await prisma.xPTransaction.findMany({
      where: { userId },
    });

    // Group XP by category
    let questXp = 0;
    let voyageXp = 0;
    let mentorshipXp = 0;
    let streakBonusXp = 0;
    let communityXp = 0;

    for (const tx of transactions) {
      if (tx.sourceType === 'QUEST' || tx.sourceType === 'DAILY_CHALLENGE' || tx.sourceType === 'QUIZ') {
        questXp += tx.amount;
      } else if (tx.sourceType === 'VOYAGE' || tx.sourceType === 'PROJECT') {
        voyageXp += tx.amount;
      } else if (tx.sourceType === 'MENTORSHIP') {
        mentorshipXp += tx.amount;
      } else if (tx.sourceType === 'STREAK') {
        streakBonusXp += tx.amount;
      } else {
        communityXp += tx.amount;
      }
    }

    const totalXp = user.xp || 1;
    const factors = [
      {
        category: 'Quests & Technical Arena',
        xpContribution: questXp,
        description: 'Solving daily code challenges & weekly timed competitions',
        percentageOfTotal: Math.round((questXp / totalXp) * 100),
      },
      {
        category: 'Voyages & Milestone Shipping',
        xpContribution: voyageXp,
        description: 'Creating project portfolios, shipping roadmaps & demo milestones',
        percentageOfTotal: Math.round((voyageXp / totalXp) * 100),
      },
      {
        category: 'Mentorship & Guild Guidance',
        xpContribution: mentorshipXp,
        description: 'Verified alumni mentoring sessions & technical reviews',
        percentageOfTotal: Math.round((mentorshipXp / totalXp) * 100),
      },
      {
        category: 'Streak Multiplier Bonus',
        xpContribution: streakBonusXp,
        description: 'Consistency reward for daily builder activity',
        percentageOfTotal: Math.round((streakBonusXp / totalXp) * 100),
      },
      {
        category: 'Community & Peer Recognition',
        xpContribution: communityXp,
        description: 'Helpful code discussions, Crew contributions & Bounties',
        percentageOfTotal: Math.round((communityXp / totalXp) * 100),
      },
    ];

    // Find rank
    const higherRankCount = await prisma.user.count({
      where: {
        xp: { gt: user.xp },
        ...(scope === 'COLLEGE' && user.college ? { college: user.college } : {}),
        ...(scope === 'DEPARTMENT' && user.department ? { department: user.department } : {}),
      },
    });

    const rank = higherRankCount + 1;

    // Find next user above
    const nextUser = await prisma.user.findFirst({
      where: {
        xp: { gt: user.xp },
        ...(scope === 'COLLEGE' && user.college ? { college: user.college } : {}),
        ...(scope === 'DEPARTMENT' && user.department ? { department: user.department } : {}),
      },
      orderBy: { xp: 'asc' },
      select: { xp: true },
    });

    const xpToNextRank = nextUser ? nextUser.xp - user.xp : 0;

    return {
      rank,
      totalXp: user.xp,
      scope,
      factors,
      xpToNextRank,
      streakBonusApplied: user.streakDays * 5,
    };
  },
};
