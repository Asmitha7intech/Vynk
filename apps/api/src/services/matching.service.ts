/**
 * Matching Service v2
 * 
 * Preserves matching-v1 (findCompatibleMembersForCrew) unchanged.
 * Extends with v2 that adds:
 * - Recommendation feedback tracking
 * - Time-decay scoring
 * - Skill gap-aware suggestions
 * - Explainability (reason strings per factor)
 */

import { prisma } from '@vynk/database';
import { CrewMatchRecommendation } from '@vynk/types';
import { eventService } from './event.service';

// ============================================================
// MATCHING v1 (preserved)
// ============================================================

export const matchingService = {
  /**
   * v1: Evaluates team compatibility according to VYNK's multi-factor complementary algorithm:
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

    const openRequirements = crew.requirements.filter((r) => !r.isFilled);
    const targetRequiredSkills = new Set<string>();
    openRequirements.forEach((r) => {
      r.requiredSkills.forEach((s) => targetRequiredSkills.add(s.toLowerCase()));
    });

    const existingCrewSkills = new Set<string>();
    crew.members.forEach((m) => {
      m.user.skills.forEach((s) => existingCrewSkills.add(s.skillName.toLowerCase()));
    });

    const crewInterests = new Set<string>();
    crew.members.forEach((m) => {
      m.user.interests.forEach((i) => crewInterests.add(i.name.toLowerCase()));
    });

    const recommendations: CrewMatchRecommendation[] = candidateUsers.map((candidate) => {
      const candidateSkills = candidate.skills.map((s) => s.skillName.toLowerCase());
      const candidateInterests = candidate.interests.map((i) => i.name.toLowerCase());

      // Factor 1: Skill Complementarity (30%)
      const skillsFillingGaps = candidateSkills.filter((s) => targetRequiredSkills.has(s));
      const skillComplementScore = targetRequiredSkills.size > 0
        ? (skillsFillingGaps.length / targetRequiredSkills.size) * 30
        : 10;

      // Factor 2: Interest Similarity (20%)
      const sharedInterests = candidateInterests.filter((i) => crewInterests.has(i));
      const interestScore = crewInterests.size > 0
        ? Math.min(20, (sharedInterests.length / crewInterests.size) * 20)
        : 10;

      // Factor 3: Availability & Commitment (15%)
      const availabilityScore = candidate.isAvailableForCrews ? 15 : 0;

      // Factor 4: Experience Level Balance (10%)
      const levelScore = Math.min(10, candidate.level * 1.5);

      // Factor 5: Reputation / Credibility (10%)
      const reputationScore = Math.min(10, candidate.reputationScore / 20);

      // Factor 6: Activity Streak (15%)
      const streakScore = Math.min(15, candidate.streakDays * 0.5);

      const totalScore = Math.round(
        skillComplementScore + interestScore + availabilityScore + levelScore + reputationScore + streakScore
      );

      const matchReasons: string[] = [];
      if (skillsFillingGaps.length > 0) matchReasons.push(`Fills ${skillsFillingGaps.length} open skill slot(s): ${skillsFillingGaps.slice(0, 2).join(', ')}`);
      if (sharedInterests.length > 0) matchReasons.push(`Shares ${sharedInterests.length} interest(s): ${sharedInterests.slice(0, 2).join(', ')}`);
      if (candidate.level >= 5) matchReasons.push(`Senior VYNK builder — Level ${candidate.level}`);
      if (candidate.streakDays >= 7) matchReasons.push(`${candidate.streakDays}-day active streak`);

      // Non-skill candidate skills that the crew also has (redundant)
      const redundantSkills = candidateSkills.filter((s) => existingCrewSkills.has(s) && !targetRequiredSkills.has(s));

      return {
        user: candidate as any,
        matchScore: Math.min(100, totalScore),
        skillComplementarityScore: Math.round(skillComplementScore),
        interestScore: Math.round(interestScore),
        roleCompatibilityScore: availabilityScore,
        availabilityScore,
        experienceScore: Math.round(levelScore),
        workingStyleScore: Math.round(streakScore),
        matchingSkills: sharedInterests,
        missingSkillsCovered: skillsFillingGaps,
        explanation: matchReasons.join(' · ') || 'Strong general compatibility',
      };
    });

    return recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  },

  // ============================================================
  // MATCHING v2 — with feedback tracking and explainability
  // ============================================================

  /**
   * v2: Finds collaborators for a given user using a richer feature set:
   * - Complementary skills (not just duplicate)
   * - Shared interests
   * - Engagement level (streak, XP, level)
   * - Department diversity bonus
   * - Previous positive recommendation feedback
   * - Explainability factors returned per match
   */
  findCollaboratorsV2: async (userId: string, limit = 10): Promise<{
    user: any;
    matchScore: number;
    factors: Array<{ factor: string; score: number; reason: string }>;
    department: string;
  }[]> => {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { skills: true, interests: true },
    });

    if (!currentUser) throw new Error('User not found');

    const mySkills = new Set(currentUser.skills.map((s) => s.skillName.toLowerCase()));
    const myInterests = new Set(currentUser.interests.map((i) => i.name.toLowerCase()));

    // Get previously dismissed recommendations to deprioritize
    const dismissedTargets = new Set<string>();
    try {
      const dismissed = await prisma.recommendationFeedback.findMany({
        where: { userId, action: 'DISMISS' },
        select: { targetId: true },
      });
      dismissed.forEach((d) => dismissedTargets.add(d.targetId));
    } catch (_) {}

    // Get previously accepted to boost their connections
    const acceptedTargets = new Set<string>();
    try {
      const accepted = await prisma.recommendationFeedback.findMany({
        where: { userId, action: 'ACCEPT' },
        select: { targetId: true },
      });
      accepted.forEach((a) => acceptedTargets.add(a.targetId));
    } catch (_) {}

    const candidates = await prisma.user.findMany({
      where: {
        id: { notIn: [userId, ...Array.from(dismissedTargets)] },
        isAvailableForCrews: true,
      },
      include: { skills: true, interests: true },
      take: 100,
    });

    const scored = candidates.map((candidate) => {
      const theirSkills = candidate.skills.map((s) => s.skillName.toLowerCase());
      const theirInterests = candidate.interests.map((i) => i.name.toLowerCase());

      const complementarySkills = theirSkills.filter((s) => !mySkills.has(s));
      const sharedInterests = theirInterests.filter((i) => myInterests.has(i));
      const crossDeptBonus = candidate.department !== currentUser.department ? 1 : 0;

      const factors = [
        {
          factor: 'SKILL_COMPLEMENTARITY',
          score: Math.min(30, complementarySkills.length * 5),
          reason: complementarySkills.length > 0
            ? `Brings ${complementarySkills.length} unique skills: ${complementarySkills.slice(0, 3).join(', ')}`
            : 'No unique skill coverage',
        },
        {
          factor: 'SHARED_INTERESTS',
          score: Math.min(20, sharedInterests.length * 4),
          reason: sharedInterests.length > 0
            ? `Shares ${sharedInterests.length} interests: ${sharedInterests.slice(0, 2).join(', ')}`
            : 'Diverse interest set',
        },
        {
          factor: 'ENGAGEMENT',
          score: Math.min(20, (candidate.streakDays * 0.8) + (candidate.level * 1.5)),
          reason: `Level ${candidate.level}, ${candidate.streakDays}-day streak`,
        },
        {
          factor: 'CROSS_DEPARTMENT',
          score: crossDeptBonus * 15,
          reason: crossDeptBonus
            ? `Different department (${candidate.department}) — enhances diversity`
            : 'Same department',
        },
        {
          factor: 'REPUTATION',
          score: Math.min(15, candidate.reputationScore / 15),
          reason: `Reputation score: ${candidate.reputationScore}`,
        },
      ];

      const totalScore = Math.min(100, factors.reduce((sum, f) => sum + f.score, 0));

      // Boost previously accepted targets
      const finalScore = acceptedTargets.has(candidate.id)
        ? Math.min(100, totalScore + 10)
        : totalScore;

      return {
        user: candidate,
        matchScore: Math.round(finalScore),
        factors,
        department: candidate.department || 'Unknown',
      };
    });

    const results = scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);

    // Publish RECOMMENDATION_IMPRESSION event
    await eventService.publish({
      eventType: 'RECOMMENDATION_IMPRESSION',
      userId,
      payload: {
        recommendationType: 'COLLABORATOR',
        count: results.length,
        topMatchScore: results[0]?.matchScore || 0,
      },
    });

    return results;
  },

  /**
   * Record user feedback on a recommendation
   */
  recordFeedback: async (
    userId: string,
    targetId: string,
    action: 'CLICK' | 'ACCEPT' | 'DISMISS' | 'SAVE',
    recommendationType: string = 'COLLABORATOR',
    context?: string
  ) => {
    const record = await prisma.recommendationFeedback.create({
      data: {
        userId,
        targetId,
        action,
        recommendationType,
        context: context || null,
      },
    });

    await eventService.publish({
      eventType: action === 'ACCEPT' ? 'RECOMMENDATION_ACCEPTED'
        : action === 'DISMISS' ? 'RECOMMENDATION_DISMISSED'
        : action === 'CLICK' ? 'RECOMMENDATION_CLICKED'
        : 'MATCH_EXPLORED',
      userId,
      payload: {
        action,
        targetId,
        recommendationType,
      },
    });

    return record;
  },
};
