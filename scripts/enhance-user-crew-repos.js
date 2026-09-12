const fs = require('fs');
const path = require('path');

const userRepoPath = path.resolve(__dirname, '../apps/api/src/repositories/user.repository.ts');
const userRepoContent = `
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
`;

const crewServicePath = path.resolve(__dirname, '../apps/api/src/services/crew.service.ts');
const crewServiceContent = `
import { crewRepository } from '../repositories/crew.repository';
import { prisma } from '@vynk/database';

export const crewService = {
  listCrews: (category?: string) => crewRepository.listCrews(category),

  getCrew: (id: string) => crewRepository.findById(id),

  createCrew: async (captainId: string, data: any) => {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await crewRepository.findBySlug(slug);
    if (existing) {
      throw new Error('Crew name is already taken. Please choose another unique squad name.');
    }

    const crew = await crewRepository.createCrew(captainId, data);

    // Initial Team Agreement digital acceptance by Captain
    if (crew.agreement) {
      await prisma.teamAgreement.update({
        where: { teamId: crew.id },
        data: {
          acceptedUserIds: [captainId],
        },
      });
    }

    return crew;
  },

  joinCrew: async (crewId: string, userId: string, roleName?: string) => {
    const crew = await crewRepository.findById(crewId);
    if (!crew) throw new Error('Crew not found');

    if (crew.members.length >= crew.maxMembers) {
      throw new Error('Crew roster is already at maximum capacity.');
    }

    const isMember = crew.members.some((m) => m.userId === userId);
    if (isMember) {
      throw new Error('You are already an active member of this crew squad.');
    }

    return crewRepository.addMember(crewId, userId, 'CONTRIBUTOR', roleName || 'Contributor');
  },

  signTeamAgreement: async (crewId: string, userId: string) => {
    const agreement = await prisma.teamAgreement.findUnique({
      where: { teamId: crewId },
    });

    if (!agreement) throw new Error('Team agreement not found for this crew.');

    const alreadyAccepted = agreement.acceptedUserIds.includes(userId);
    if (alreadyAccepted) return agreement;

    return prisma.teamAgreement.update({
      where: { teamId: crewId },
      data: {
        acceptedUserIds: [...agreement.acceptedUserIds, userId],
      },
    });
  },
};
`;

fs.writeFileSync(userRepoPath, userRepoContent.trim() + '\n', 'utf8');
fs.writeFileSync(crewServicePath, crewServiceContent.trim() + '\n', 'utf8');
console.log('Updated user.repository.ts and crew.service.ts');
