import { questRepository } from '../repositories/quest.repository';
import { gamificationRepository } from '../repositories/gamification.repository';
import { eventService } from './event.service';
import { prisma } from '@vynk/database';

export const questService = {
  getDailyChallenge: async (userId?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const challenge = await questRepository.getTodayChallenge(today)
      || await questRepository.getTodayChallenge('2026-08-22')
      || await questRepository.getLatestChallenge();
    if (!challenge) throw new Error('No active daily challenge available for today.');

    let isCompleted = false;
    let myAttempt = null;

    if (userId) {
      myAttempt = await questRepository.getChallengeAttempt(challenge.id, userId);
      isCompleted = !!myAttempt;
    }

    // Security & Integrity: Never leak correct answer or explanation before submission
    const sanitizedChallenge = {
      ...challenge,
      correctOptionIndex: isCompleted ? challenge.correctOptionIndex : undefined,
      explanation: isCompleted ? challenge.explanation : undefined,
    };

    return {
      challenge: sanitizedChallenge,
      isCompleted,
      myAttempt,
    };
  },

  submitChallenge: async (userId: string, challengeId: string, selectedOptionIndex: number) => {
    const existing = await questRepository.getChallengeAttempt(challengeId, userId);
    if (existing) throw new Error('You have already attempted today\'s challenge.');

    const challenge = await questRepository.getChallengeById(challengeId)
      || await questRepository.getTodayChallenge(new Date().toISOString().split('T')[0])
      || await questRepository.getTodayChallenge('2026-08-22')
      || await questRepository.getLatestChallenge();
    if (!challenge || challenge.id !== challengeId) throw new Error('Invalid or expired challenge.');

    const isCorrect = challenge.correctOptionIndex === selectedOptionIndex;
    const xpEarned = isCorrect ? challenge.xpAward : 5; // 5 participation XP

    const attempt = await questRepository.createChallengeAttempt({
      challengeId,
      userId,
      selectedOptionIndex,
      isCorrect,
      xpEarned,
    });

    if (xpEarned > 0) {
      await gamificationRepository.addXPTransaction(
        userId,
        xpEarned,
        `Daily Challenge ${isCorrect ? 'Victory' : 'Participation'}: ${challenge.title}`,
        'DAILY_CHALLENGE',
        challengeId
      );
    }

    await eventService.publish({
      eventType: 'DAILY_CHALLENGE_ATTEMPTED',
      userId,
      payload: {
        challengeId,
        userId,
        selectedOptionIndex,
        isCorrect,
        xpEarned,
        category: challenge.category,
      },
    });

    return {
      attempt,
      isCorrect,
      correctOptionIndex: challenge.correctOptionIndex,
      explanation: challenge.explanation,
      xpEarned,
    };
  },

  listQuizzes: async () => {
    const list = await questRepository.listQuizzes();
    // Sanitize questions so correct answers are not exposed in listing
    return list.map((quiz: any) => ({
      ...quiz,
      questions: (quiz.questions || []).map((q: any) => ({
        id: q.id,
        quizId: q.quizId,
        question: q.question,
        codeSnippet: q.codeSnippet,
        options: q.options,
        topic: q.topic,
      })),
    }));
  },

  getQuiz: async (id: string) => {
    const quiz = await questRepository.getQuizWithQuestions(id);
    if (!quiz) return null;

    // Sanitize questions
    return {
      ...quiz,
      questions: (quiz.questions || []).map((q: any) => ({
        id: q.id,
        quizId: q.quizId,
        question: q.question,
        codeSnippet: q.codeSnippet,
        options: q.options,
        topic: q.topic,
      })),
    };
  },

  submitQuiz: async (userId: string, quizId: string, timeSpentSeconds: number, answers: { questionId: string; selectedOptionIndex: number }[]) => {
    const quiz = await questRepository.getQuizWithQuestions(quizId);
    if (!quiz) throw new Error('Quiz not found');

    let correctCount = 0;
    const weakTopicsMap: Record<string, number> = {};
    const recordedAnswers = answers.map((a) => {
      const q = quiz.questions.find((question: any) => question.id === a.questionId);
      const isCorrect = q ? q.correctOptionIndex === a.selectedOptionIndex : false;
      if (isCorrect) {
        correctCount++;
      } else if (q) {
        weakTopicsMap[q.topic] = (weakTopicsMap[q.topic] || 0) + 1;
      }
      return {
        questionId: a.questionId,
        selectedIndex: a.selectedOptionIndex,
        isCorrect,
      };
    });

    const maxScore = quiz.questions.length;
    const percentage = Math.round((correctCount / maxScore) * 100);
    const calculatedXp = Math.round((percentage / 100) * quiz.xpReward) + (percentage >= 80 ? 50 : 0);

    // XP Integrity: Check previous attempts for idempotency / anti-farming
    const previousAttempts = await prisma.quizAttempt.findMany({
      where: { quizId, userId },
    });

    let bestPreviousPercentage = 0;
    if (previousAttempts && previousAttempts.length > 0) {
      bestPreviousPercentage = Math.max(...previousAttempts.map((att: any) => att.percentage || 0));
    }

    let xpEarned = 0;
    if (previousAttempts.length === 0) {
      // First attempt earns calculated XP
      xpEarned = calculatedXp;
    } else if (percentage > bestPreviousPercentage) {
      // Improved score on retry earns the delta improvement XP
      const previousBestXp = Math.round((bestPreviousPercentage / 100) * quiz.xpReward) + (bestPreviousPercentage >= 80 ? 50 : 0);
      xpEarned = Math.max(0, calculatedXp - previousBestXp);
    } else {
      // Replays with equal or lower scores earn 0 new XP
      xpEarned = 0;
    }

    const weakTopics = Object.keys(weakTopicsMap);
    const recommendedTopics = weakTopics.length > 0 ? weakTopics.map((t) => `${t} Mastery & Heuristics`) : ['Advanced System Design'];

    const attempt = await questRepository.recordQuizAttempt({
      quizId,
      userId,
      score: correctCount,
      maxScore,
      percentage,
      timeSpentSeconds,
      xpEarned,
      answers: recordedAnswers,
      weakTopics,
      recommendedTopics,
    });

    if (xpEarned > 0) {
      await gamificationRepository.addXPTransaction(
        userId,
        xpEarned,
        `Completed Quiz: ${quiz.title} (${percentage}%)`,
        'QUIZ_COMPLETION',
        quizId
      );
    }

    await eventService.publish({
      eventType: 'QUIZ_COMPLETED',
      userId,
      payload: {
        quizId,
        userId,
        score: correctCount,
        maxScore,
        percentage,
        xpEarned,
        category: quiz.category,
        weakTopics,
      },
    });

    // Provide detailed review feedback with correct answers and explanations
    const detailedFeedback = recordedAnswers.map((ans) => {
      const q = quiz.questions.find((question: any) => question.id === ans.questionId);
      return {
        questionId: ans.questionId,
        question: q?.question,
        selectedIndex: ans.selectedIndex,
        correctOptionIndex: q?.correctOptionIndex,
        isCorrect: ans.isCorrect,
        explanation: q?.explanation,
        topic: q?.topic,
      };
    });

    return {
      attempt,
      score: correctCount,
      maxScore,
      percentage,
      xpEarned,
      weakTopics,
      recommendedTopics,
      feedback: detailedFeedback,
    };
  },
};
