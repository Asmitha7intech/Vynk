import { prisma } from '@vynk/database';

export const questRepository = {
  getTodayChallenge: (dateStr: string) => prisma.dailyChallenge.findFirst({
    where: { activeDate: dateStr },
  }),

  getChallengeAttempt: (challengeId: string, userId: string) => prisma.dailyChallengeAttempt.findUnique({
    where: {
      challengeId_userId: { challengeId, userId },
    },
  }),

  createChallengeAttempt: (data: { challengeId: string; userId: string; selectedOptionIndex: number; isCorrect: boolean; xpEarned: number }) =>
    prisma.dailyChallengeAttempt.create({ data }),

  listQuizzes: () => prisma.quiz.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      category: true,
      difficulty: true,
      timeLimitMinutes: true,
      xpReward: true,
      isWeeklySpecial: true,
      _count: { select: { questions: true } },
    },
    orderBy: { createdAt: 'desc' },
  }),

  getQuizWithQuestions: (id: string) => prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: true,
    },
  }),

  recordQuizAttempt: (data: any) => prisma.quizAttempt.create({
    data,
  }),
};
