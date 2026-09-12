import { prisma } from '@vynk/database';

export const crossDepartmentService = {
  getCrossDepartmentMatches: async (userId: string, limit = 10) => {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { skills: true, interests: true },
    });

    if (!currentUser) return [];

    const userDept = currentUser.department || 'General';
    const userCollege = currentUser.college;

    // Find students from DIFFERENT departments (same college prioritized)
    const candidates = await prisma.user.findMany({
      where: {
        id: { not: userId },
        ...(userCollege ? { college: userCollege } : {}),
        department: { not: userDept },
      },
      include: {
        skills: true,
        interests: true,
      },
      take: 40,
      orderBy: { xp: 'desc' },
    });

    const userSkillNames = new Set(currentUser.skills.map((s) => s.skillName.toLowerCase()));
    const userInterestNames = new Set(currentUser.interests.map((i) => i.name.toLowerCase()));

    const scoredMatches = candidates.map((candidate) => {
      const candidateSkills = candidate.skills.map((s) => s.skillName);
      const candidateInterests = candidate.interests.map((i) => i.name);

      // Complementary skills = skills candidate has that current user does NOT have
      const complementary = candidateSkills.filter((s) => !userSkillNames.has(s.toLowerCase()));

      // Shared interests = overlap in domains
      const sharedInterests = candidateInterests.filter((i) => userInterestNames.has(i.toLowerCase()));

      // Complementarity score
      let score = 50; // baseline for cross-department diversity
      score += Math.min(complementary.length * 10, 30);
      score += Math.min(sharedInterests.length * 5, 20);

      const candidateDept = candidate.department || 'General';
      let matchReason = "Cross-department match from " + candidateDept;
      if (complementary.length > 0) {
        matchReason = "Brings complementary skills (" + complementary.slice(0, 2).join(', ') + ") from " + candidateDept;
      } else if (sharedInterests.length > 0) {
        matchReason = "Shares " + sharedInterests.slice(0, 2).join(', ') + " interests in " + candidateDept;
      }

      return {
        user: candidate,
        sharedInterests,
        complementarySkills: complementary,
        department: candidateDept,
        matchScore: Math.min(score, 99),
        matchReason,
      };
    });

    scoredMatches.sort((a, b) => b.matchScore - a.matchScore);
    return scoredMatches.slice(0, limit);
  },
};
