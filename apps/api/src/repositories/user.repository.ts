import { prisma } from '@vynk/database';

export const userRepository = {
  findById: async (id: string) => {
    return prisma.user.findUnique({
      where: { id },
      include: {
        skills: true,
        interests: true,
        badges: {
          include: { badge: true },
        },
      },
    });
  },

  findByEmail: async (email: string) => {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  findByUsername: async (username: string) => {
    return prisma.user.findUnique({
      where: { username },
      include: {
        skills: true,
        interests: true,
        badges: {
          include: { badge: true },
        },
      },
    });
  },

  search: async (query: string, limit = 20) => {
    return userRepository.searchUsers(query, limit);
  },

  searchUsers: async (query: string, limit = 20) => {
    if (!query.trim()) {
      return prisma.user.findMany({
        take: limit,
        orderBy: { xp: 'desc' },
        include: { skills: true, interests: true },
      });
    }

    const cleanQuery = query.trim();
    return prisma.user.findMany({
      where: {
        OR: [
          { displayName: { contains: cleanQuery, mode: 'insensitive' } },
          { username: { contains: cleanQuery, mode: 'insensitive' } },
          { headline: { contains: cleanQuery, mode: 'insensitive' } },
          { college: { contains: cleanQuery, mode: 'insensitive' } },
          { department: { contains: cleanQuery, mode: 'insensitive' } },
          { skills: { some: { skillName: { contains: cleanQuery, mode: 'insensitive' } } } },
        ],
      },
      take: limit,
      orderBy: { xp: 'desc' },
      include: { skills: true, interests: true },
    });
  },

  createUser: async (data: {
    email: string;
    passwordHash: string;
    username: string;
    displayName: string;
    college?: string;
    department?: string;
    graduationYear?: number;
    role?: any;
  }) => {
    return prisma.user.create({
      data: {
        ...data,
        role: data.role || 'STUDENT',
      },
    });
  },

  updateProfile: async (userId: string, data: any) => {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  },

  addSkill: async (userId: string, skillData: {
    skillName: string;
    category: string;
    proficiency: any;
    yearsOfExperience: number;
    evidenceUrl?: string;
  }) => {
    return prisma.userSkill.upsert({
      where: {
        userId_skillName: { userId, skillName: skillData.skillName },
      },
      update: {
        category: skillData.category,
        proficiency: skillData.proficiency,
        yearsOfExperience: skillData.yearsOfExperience,
        evidenceUrl: skillData.evidenceUrl || null,
        isVerified: !!skillData.evidenceUrl,
      },
      create: {
        userId,
        skillName: skillData.skillName,
        category: skillData.category,
        proficiency: skillData.proficiency,
        yearsOfExperience: skillData.yearsOfExperience,
        evidenceUrl: skillData.evidenceUrl || null,
        isVerified: !!skillData.evidenceUrl,
      },
    });
  },
};
