/**
 * Trending Service
 * 
 * Computes trending content using time-decay scoring:
 * score = (engagements * W) / (hours_since_creation + 2)^gravity
 * 
 * where:
 *   W = engagement weight (reaction=1, comment=3, view=0.1)
 *   gravity = 1.8 (how quickly content decays)
 * 
 * This mirrors the Hacker News decay formula, tuned for a student platform.
 */

import { prisma } from '@vynk/database';

const GRAVITY = 1.8;

function computeTrendScore(
  reactions: number,
  comments: number,
  views: number,
  createdAt: Date | string
): number {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  const engagements = reactions * 1 + comments * 3 + views * 0.1;
  return engagements / Math.pow(ageHours + 2, GRAVITY);
}

export const trendingService = {
  /**
   * Get trending posts across the platform or for a given department
   */
  getTrendingPosts: async (department?: string, limit = 20) => {
    const posts = await prisma.post.findMany({
      where: {
        ...(department ? { author: { department } } : {}),
        createdAt: {
          // Only consider posts from last 7 days
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true, department: true, college: true, level: true } },
        _count: { select: { reactions: true, comments: true } },
      },
      take: 200,
    });

    const scored = posts.map((post) => ({
      ...post,
      trendScore: computeTrendScore(
        post._count.reactions,
        post._count.comments,
        0, // Post model does not track views separately
        post.createdAt
      ),
    }));

    return scored
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit);
  },

  /**
   * Get trending Voyages (projects) by engagement velocity
   */
  getTrendingVoyages: async (limit = 10) => {
    const voyages = await prisma.project.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      include: {
        creator: { select: { id: true, username: true, displayName: true, avatarUrl: true, department: true } },
        _count: { select: { members: true } },
      },
      take: 100,
    });

    const scored = voyages.map((voyage) => ({
      ...voyage,
      trendScore: computeTrendScore(
        voyage.likesCount,
        voyage._count.members * 2,
        voyage.viewsCount,
        voyage.createdAt
      ),
    }));

    return scored
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit);
  },

  /**
   * Get trending skills based on recent user profiles and posts
   */
  getTrendingSkills: async (limit = 15) => {
    const recentSkills = await prisma.userSkill.groupBy({
      by: ['skillName', 'category'],
      _count: { skillName: true },
      orderBy: { _count: { skillName: 'desc' } },
      take: limit,
    });

    return recentSkills.map((s) => ({
      skillName: s.skillName,
      category: s.category,
      userCount: s._count.skillName,
    }));
  },

  /**
   * Get trending crew categories (where most new crews are forming)
   */
  getTrendingCrewCategories: async () => {
    const categories = await prisma.team.groupBy({
      by: ['category'],
      _count: { category: true },
      where: {
        createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { _count: { category: 'desc' } },
      take: 10,
    });

    return categories.map((c) => ({
      category: c.category,
      activeCrews: c._count.category,
    }));
  },

  /**
   * Full trending dashboard
   */
  getTrendingDashboard: async (department?: string) => {
    const [posts, voyages, skills, crewCategories] = await Promise.all([
      trendingService.getTrendingPosts(department, 10),
      trendingService.getTrendingVoyages(5),
      trendingService.getTrendingSkills(10),
      trendingService.getTrendingCrewCategories(),
    ]);

    return {
      posts: posts.map(({ trendScore: _, ...p }) => p),
      voyages: voyages.map(({ trendScore: _, ...v }) => v),
      skills,
      crewCategories,
      generatedAt: new Date().toISOString(),
    };
  },
};
