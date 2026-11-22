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

  findByEmail: async (rawEmail: string) => {
    if (!rawEmail) return null;
    const email = rawEmail.trim().toLowerCase();

    // 1. Direct match with normalized email
    try {
      const direct = await prisma.user.findUnique({
        where: { email },
      });
      if (direct) return direct;
    } catch {}

    // 2. Case-insensitive lookup
    try {
      const first = await prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
      });
      if (first) return first;
    } catch {}

    // 3. Resilient scan fallback for localStore/PGlite
    try {
      const allUsers = await prisma.user.findMany();
      const match = allUsers.find(
        (u) => u.email?.trim().toLowerCase() === email
      );
      return match || null;
    } catch {
      return null;
    }
  },

  findByUsername: async (identifier: string) => {
    const include = {
      skills: true,
      interests: true,
      badges: {
        include: { badge: true },
      },
    };

    // 1. Direct exact username match
    let user = await prisma.user.findUnique({
      where: { username: identifier },
      include,
    });
    if (user) return user;

    // 2. Direct ID match (for routing via /profile/:id)
    try {
      user = await prisma.user.findUnique({
        where: { id: identifier },
        include,
      });
      if (user) return user;
    } catch {}

    // 3. Case-insensitive username match
    try {
      user = await prisma.user.findFirst({
        where: {
          username: {
            equals: identifier,
            mode: 'insensitive',
          },
        },
        include,
      });
      if (user) return user;
    } catch {}

    // 4. In-memory fallback for localStore if case-insensitive query mode isn't supported
    const allUsers = await prisma.user.findMany({ include });
    const target = allUsers.find(
      (u) =>
        u.username?.toLowerCase() === identifier.toLowerCase() ||
        u.id === identifier
    );
    return target || null;
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
    // Strip privileged/immutable fields from direct profile updates
    const { xp, level, role, mustChangePassword, passwordHash, ...safeData } = data;
    return prisma.user.update({
      where: { id: userId },
      data: safeData,
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
