import { prisma } from '@vynk/database';

export const adminService = {
  getSystemAnalytics: async () => {
    const [totalUsers, totalVoyages, totalCrews, totalPosts, totalQuizAttempts] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.team.count(),
      prisma.post.count(),
      prisma.quizAttempt.count(),
    ]);

    return {
      totalUsers,
      totalVoyages,
      totalCrews,
      totalPosts,
      totalQuizAttempts,
      systemStatus: 'HEALTHY',
    };
  },

  listReports: (status = 'PENDING') => prisma.report.findMany({
    where: { status },
    include: { reporter: true },
    orderBy: { createdAt: 'desc' },
  }),

  resolveReport: (reportId: string, status: 'ACTIONED' | 'DISMISSED') => prisma.report.update({
    where: { id: reportId },
    data: { status },
  }),
};
