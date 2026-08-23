import { userRepository } from '../repositories/user.repository';
import { prisma } from '@vynk/database';

export const userService = {
  getById: (id: string) => userRepository.findById(id),

  getByUsername: async (username: string) => {
    const user = await userRepository.findByUsername(username);
    if (!user) throw new Error('User not found');

    const [vynksCount, followersCount, followingCount, voyagesCount, crewsCount, questsCompleted] = await Promise.all([
      prisma.connection.count({
        where: {
          status: 'ACCEPTED',
          OR: [{ senderId: user.id }, { receiverId: user.id }],
        },
      }),
      prisma.follow.count({ where: { followingId: user.id } }),
      prisma.follow.count({ where: { followerId: user.id } }),
      prisma.project.count({ where: { creatorId: user.id } }),
      prisma.teamMember.count({ where: { userId: user.id } }),
      prisma.dailyChallengeAttempt.count({ where: { userId: user.id } }),
    ]);

    return {
      user,
      skills: user.skills,
      interests: user.interests,
      stats: {
        vynksCount,
        followersCount,
        followingCount,
        voyagesCount,
        crewsCount,
        bountiesCount: user.badges.length,
        questsCompleted,
      },
      bounties: user.badges.map((b) => b.badge),
    };
  },

  updateProfile: (id: string, data: any) => userRepository.updateProfile(id, data),

  addSkill: (userId: string, skill: any) => userRepository.addSkill(userId, skill),

  search: (query: string) => userRepository.search(query),
};
