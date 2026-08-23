import { gamificationRepository } from '../repositories/gamification.repository';
import { LeaderboardEntry } from '@vynk/types';

export const gamificationService = {
  getLeaderboard: async (scope: string, college?: string, department?: string): Promise<LeaderboardEntry[]> => {
    const users = await gamificationRepository.getLeaderboard(scope, college, department, 25);
    return users.map((user, index) => ({
      rank: index + 1,
      user: user as any,
      score: user.xp,
      trend: index < 3 ? 'UP' : 'SAME',
    }));
  },

  listBadges: () => gamificationRepository.listBadges(),

  awardXP: (userId: string, amount: number, reason: string, sourceType: string, sourceId?: string) =>
    gamificationRepository.addXPTransaction(userId, amount, reason, sourceType, sourceId),
};
