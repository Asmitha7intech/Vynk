import { prisma, CrewRole } from '@vynk/database';

export const crewRepository = {
  listAll: (category?: string) => prisma.team.findMany({
    where: category ? { category } : undefined,
    include: {
      captain: true,
      members: { include: { user: true } },
      requirements: true,
      agreement: true,
    },
    orderBy: { createdAt: 'desc' },
  }),

  findById: (id: string) => prisma.team.findUnique({
    where: { id },
    include: {
      captain: true,
      members: { include: { user: { include: { skills: true } } } },
      requirements: true,
      agreement: true,
      voyages: true,
    },
  }),

  create: (data: any) => prisma.team.create({
    data: {
      name: data.name,
      slug: data.slug,
      tagline: data.tagline,
      description: data.description,
      category: data.category,
      targetHackathon: data.targetHackathon,
      maxMembers: data.maxMembers,
      commitmentHoursPerWeek: data.commitmentHoursPerWeek,
      deadline: data.deadline ? new Date(data.deadline) : null,
      captainId: data.captainId,
      members: {
        create: {
          userId: data.captainId,
          role: CrewRole.CAPTAIN,
          assignedRoleName: 'Captain & Creator',
        },
      },
      requirements: {
        create: data.requirements,
      },
      agreement: {
        create: {
          commitmentDescription: 'Team members commit to active communication and delivery.',
          weeklyHours: data.commitmentHoursPerWeek,
          primaryChannel: 'VYNK Crew Messenger',
          decisionProtocol: 'CONSENSUS',
          codeStandardRules: ['TypeScript strict mode', 'PR review before merge'],
          meetingSchedule: 'Weekly checkin',
          acceptedUserIds: [data.captainId],
        },
      },
    },
    include: {
      captain: true,
      members: { include: { user: true } },
      requirements: true,
      agreement: true,
    },
  }),

  addMember: (crewId: string, userId: string, role: CrewRole, roleName: string) => prisma.teamMember.create({
    data: {
      teamId: crewId,
      userId,
      role,
      assignedRoleName: roleName,
    },
    include: { user: true },
  }),

  updateAgreement: (crewId: string, data: any) => prisma.teamAgreement.update({
    where: { teamId: crewId },
    data,
  }),
};
