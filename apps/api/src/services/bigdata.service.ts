import { prisma } from '@vynk/database';

export const bigDataService = {
  // 1. Campus Skill Heatmap (Density & Scarcity by Department)
  getCampusSkillHeatmap: async (college?: string) => {
    const users = await prisma.user.findMany({
      where: college ? { college } : undefined,
      select: {
        department: true,
        skills: {
          select: {
            skillName: true,
            proficiency: true,
            isVerified: true,
          },
        },
      },
    });

    const heatmap: Record<string, Record<string, number>> = {};
    const totalBySkill: Record<string, number> = {};

    for (const u of users) {
      const dept = u.department || 'General';
      if (!heatmap[dept]) heatmap[dept] = {};

      for (const s of u.skills) {
        const skill = s.skillName;
        heatmap[dept][skill] = (heatmap[dept][skill] || 0) + 1;
        totalBySkill[skill] = (totalBySkill[skill] || 0) + 1;
      }
    }

    return {
      departments: Object.keys(heatmap),
      matrix: heatmap,
      skillTotals: totalBySkill,
      analyzedStudentCount: users.length,
    };
  },

  // 2. Department Collaboration Matrix (Crews and Voyages with multi-dept members)
  getDepartmentCollaborationMatrix: async () => {
    const crews = await prisma.team.findMany({
      include: {
        members: {
          include: {
            user: { select: { department: true } },
          },
        },
      },
    });

    const pairs: Record<string, number> = {};

    for (const crew of crews) {
      const depts = Array.from(new Set(crew.members.map((m) => m.user.department || 'General')));
      for (let i = 0; i < depts.length; i++) {
        for (let j = i + 1; j < depts.length; j++) {
          const key = [depts[i], depts[j]].sort().join(' <-> ');
          pairs[key] = (pairs[key] || 0) + 1;
        }
      }
    }

    const sortedPairs = Object.entries(pairs)
      .map(([pair, count]) => ({ pair, collaborationsCount: count }))
      .sort((a, b) => b.collaborationsCount - a.collaborationsCount);

    return {
      crossDepartmentCollaborations: sortedPairs,
      totalCrewsAnalyzed: crews.length,
    };
  },

  // 3. Skill Demand vs Supply
  getSkillDemandSupply: async () => {
    const [requirements, userSkills] = await Promise.all([
      prisma.teamRequirement.findMany({
        select: { requiredSkills: true, isFilled: true },
      }),
      prisma.userSkill.findMany({
        select: { skillName: true },
      }),
    ]);

    const demand: Record<string, number> = {};
    for (const req of requirements) {
      if (!req.isFilled) {
        for (const s of req.requiredSkills) {
          demand[s] = (demand[s] || 0) + 1;
        }
      }
    }

    const supply: Record<string, number> = {};
    for (const us of userSkills) {
      supply[us.skillName] = (supply[us.skillName] || 0) + 1;
    }

    const allSkills = Array.from(new Set([...Object.keys(demand), ...Object.keys(supply)]));
    const comparison = allSkills.map((skill) => ({
      skill,
      demandedByCrews: demand[skill] || 0,
      suppliedByStudents: supply[skill] || 0,
      gap: (demand[skill] || 0) - (supply[skill] || 0),
    }));

    comparison.sort((a, b) => b.demandedByCrews - a.demandedByCrews);

    return {
      topDemandedSkills: comparison.slice(0, 15),
      totalOpenRoles: requirements.filter((r) => !r.isFilled).length,
    };
  },
};
