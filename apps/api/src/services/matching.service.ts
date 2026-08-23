import { prisma } from '@vynk/database';
import { CrewMatchRecommendation } from '@vynk/types';

export const matchingService = {
  /**
   * Evaluates team compatibility according to VYNK's multi-factor complementary algorithm:
   * 30% Skill Complementarity (Fills missing team skill requirements)
   * 20% Interest Similarity
   * 15% Role Compatibility
   * 15% Availability & Commitment Alignment
   * 10% Experience Level Balance
   * 10% Working Style / Hackathon Chemistry
   */
  findCompatibleMembersForCrew: async (crewId: string, limit = 10): Promise<CrewMatchRecommendation[]> => {
    const crew = await prisma.team.findUnique({
      where: { id: crewId },
      include: {
        members: { include: { user: { include: { skills: true, interests: true } } } },
        requirements: true,
        agreement: true,
      },
    });

    if (!crew) throw new Error('Crew not found');

    const existingMemberIds = crew.members.map((m) => m.userId);
    const candidateUsers = await prisma.user.findMany({
      where: {
        id: { notIn: existingMemberIds },
        isAvailableForCrews: true,
      },
      include: {
        skills: true,
        interests: true,
      },
      take: 50,
    });

    // Extract all open/missing skill requirements for the crew
    const openRequirements = crew.requirements.filter((r) => !r.isFilled);
    const targetRequiredSkills = new Set<string>();
    openRequirements.forEach((r) => {
      r.requiredSkills.forEach((s) => targetRequiredSkills.add(s.toLowerCase()));
    });

    // Existing crew skills to detect redundancy vs complementarity
    const existingCrewSkills = new Set<string>();
    crew.members.forEach((m) => {
      m.user.skills.forEach((s) => existingCrewSkills.add(s.skillName.toLowerCase()));
    });

    // Existing crew interests
    const crewInterests = new Set<string>();
    crew.members.forEach((m) => {
      m.user.interests.forEach((i) => crewInterests.add(i.name.toLowerCase()));
    });

    const recommendations: CrewMatchRecommendation[] = candidateUsers.map((candidate) => {
      const candidateSkills = candidate.skills.map((s) => s.skillName.toLowerCase());
      const candidateInterests = candidate.interests.map((i) => i.name.toLowerCase());

      // 1. Skill Complementarity (30%)
      const coveredMissingSkills: string[] = [];
      targetRequiredSkills.forEach((reqSkill) => {
        if (candidateSkills.some((cs) => cs.includes(reqSkill) || reqSkill.includes(cs))) {
          coveredMissingSkills.push(reqSkill);
        }
      });

      const skillComplementarityScore = targetRequiredSkills.size > 0
        ? Math.min(100, Math.round((coveredMissingSkills.length / targetRequiredSkills.size) * 100))
        : 75;

      // 2. Interest Similarity (20%)
      let matchingInterestsCount = 0;
      candidateInterests.forEach((ci) => {
        if (crewInterests.has(ci) || ci.includes(crew.category.toLowerCase())) {
          matchingInterestsCount++;
        }
      });
      const interestScore = Math.min(100, Math.round((matchingInterestsCount / Math.max(1, crewInterests.size)) * 100) + 40);

      // 3. Role Compatibility (15%)
      const roleCompatibilityScore = coveredMissingSkills.length > 0 ? 95 : 60;

      // 4. Availability & Commitment (15%)
      const availabilityScore = candidate.isAvailableForCrews ? 90 : 40;

      // 5. Experience (10%)
      const avgYears = candidate.skills.reduce((acc, s) => acc + s.yearsOfExperience, 0) / Math.max(1, candidate.skills.length);
      const experienceScore = Math.min(100, Math.round(avgYears * 25));

      // 6. Working Style & Consistency (10%)
      const workingStyleScore = Math.min(100, candidate.streakDays * 5 + candidate.level * 6);

      // Total Weighted Score (0 - 100)
      const totalScore = Math.round(
        0.30 * skillComplementarityScore +
        0.20 * interestScore +
        0.15 * roleCompatibilityScore +
        0.15 * availabilityScore +
        0.10 * experienceScore +
        0.10 * workingStyleScore
      );

      // Generate explainable rationale
      const explanations: string[] = [];
      if (coveredMissingSkills.length > 0) {
        explanations.push(`Directly covers missing roles with skills in ${coveredMissingSkills.slice(0, 2).join(', ')}`);
      } else {
        explanations.push(`Brings strong general background in ${candidate.department || 'engineering'}`);
      }

      if (matchingInterestsCount > 0) {
        explanations.push(`Shared focus in ${crew.category}`);
      }

      if (candidate.streakDays >= 7) {
        explanations.push(`Active builder with ${candidate.streakDays}-day streak`);
      }

      return {
        user: candidate as any,
        matchScore: totalScore,
        skillComplementarityScore,
        interestScore,
        roleCompatibilityScore,
        availabilityScore,
        experienceScore,
        workingStyleScore,
        matchingSkills: candidate.skills.map((s) => s.skillName),
        missingSkillsCovered: coveredMissingSkills,
        explanation: explanations.join(' • '),
      };
    });

    return recommendations.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
  },
};
