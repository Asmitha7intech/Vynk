import { prisma } from '@vynk/database';

export const userRepository = {
  findById: (id: string) => prisma.user.findUnique({
    where: { id },
    include: {
      skills: true,
      interests: true,
      mentorProfile: true,
      badges: { include: { badge: true } },
    },
  }),

  findByEmail: (email: string) => prisma.user.findUnique({
    where: { email },
    include: {
      skills: true,
      interests: true,
      mentorProfile: true,
    },
  }),

  findByUsername: (username: string) => prisma.user.findUnique({
    where: { username },
    include: {
      skills: true,
      interests: true,
      mentorProfile: true,
      badges: { include: { badge: true } },
    },
  }),

  search: (query: string, limit = 20) => prisma.user.findMany({
    where: {
      OR: [
        { displayName: { contains: query, mode: 'insensitive' } },
        { username: { contains: query, mode: 'insensitive' } },
        { college: { contains: query, mode: 'insensitive' } },
        { department: { contains: query, mode: 'insensitive' } },
        { skills: { some: { skillName: { contains: query, mode: 'insensitive' } } } },
      ],
    },
    include: {
      skills: true,
      interests: true,
    },
    take: limit,
  }),

  updateProfile: (id: string, data: any) => prisma.user.update({
    where: { id },
    data,
    include: { skills: true, interests: true, badges: { include: { badge: true } } },
  }),

  addSkill: (userId: string, skill: any) => prisma.userSkill.upsert({
    where: {
      userId_skillName: {
        userId,
        skillName: skill.skillName,
      },
    },
    update: skill,
    create: { ...skill, userId },
  }),

  addInterest: (userId: string, interest: any) => prisma.userInterest.upsert({
    where: {
      userId_name: {
        userId,
        name: interest.name,
      },
    },
    update: interest,
    create: { ...interest, userId },
  }),
};
