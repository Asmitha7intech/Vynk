const fs = require('fs');
const path = require('path');

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

  findBySlug: (slug: string) => prisma.team.findUnique({
    where: { slug },
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

  createCrew: (captainId: string, data: any) => {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return prisma.team.create({
      data: {
        name: data.name,
        slug,
        tagline: data.tagline,
        description: data.description,
        category: data.category,
        targetHackathon: data.targetHackathon,
        maxMembers: data.maxMembers,
        commitmentHoursPerWeek: data.commitmentHoursPerWeek,
        deadline: data.deadline ? new Date(data.deadline) : null,
        captainId,
        members: {
          create: {
            userId: captainId,
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
            acceptedUserIds: [captainId],
          },
        },
      },
      include: {
        captain: true,
        members: { include: { user: true } },
        requirements: true,
        agreement: true,
      },
    });
  },

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
`;

let userRepoContent = fs.readFileSync(userRepoPath, 'utf8');
if (!userRepoContent.includes('search:')) {
  userRepoContent = userRepoContent.replace(
    'searchUsers: async (query: string, limit = 20) => {',
    'search: async (query: string, limit = 20) => {\n    return userRepository.searchUsers(query, limit);\n  },\n\n  searchUsers: async (query: string, limit = 20) => {'
  );
}

fs.writeFileSync(crewRepoPath, crewRepoContent.trim() + '\n', 'utf8');
fs.writeFileSync(userRepoPath, userRepoContent.trim() + '\n', 'utf8');
console.log('Aligned crew.repository.ts and user.repository.ts');
