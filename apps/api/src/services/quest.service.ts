import { questRepository } from '../repositories/quest.repository';
import { gamificationRepository } from '../repositories/gamification.repository';

export const questService = {
  getDailyChallenge: async (userId?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const challenge = await questRepository.getTodayChallenge(today) || await questRepository.getTodayChallenge('2026-08-22');
    if (!challenge) throw new Error('No active daily challenge available for today.');

    let isCompleted = false;
    let myAttempt = null;

    if (userId) {
      myAttempt = await questRepository.getChallengeAttempt(challenge.id, userId);
      isCompleted = !!myAttempt;
    }

    return {
      challenge,
      isCompleted,
      myAttempt,
    };
  },

  submitChallenge: async (userId: string, challengeId: string, selectedOptionIndex: number) => {
    const existing = await questRepository.getChallengeAttempt(challengeId, userId);
    if (existing) throw new Error('You have already attempted today\'s challenge.');

    const challenge = await questRepository.getTodayChallenge(new Date().toISOString().split('T')[0])
      || await questRepository.getTodayChallenge('2026-08-22');
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

    return {
      attempt,
      isCorrect,
      correctOptionIndex: challenge.correctOptionIndex,
      explanation: challenge.explanation,
      xpEarned,
    };
  },

  listQuizzes: () => questRepository.listQuizzes(),

  getQuiz: (id: string) => questRepository.getQuizWithQuestions(id),

  submitQuiz: async (userId: string, quizId: string, timeSpentSeconds: number, answers: { questionId: string; selectedOptionIndex: number }[]) => {
    const quiz = await questRepository.getQuizWithQuestions(quizId);
    if (!quiz) throw new Error('Quiz not found');

    let correctCount = 0;
    const weakTopicsMap: Record<string, number> = {};
    const recordedAnswers = answers.map((a) => {
      const q = quiz.questions.find((question) => question.id === a.questionId);
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
    const xpEarned = Math.round((percentage / 100) * quiz.xpReward) + (percentage >= 80 ? 50 : 0);

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

    return {
      attempt,
      score: correctCount,
      maxScore,
      percentage,
      xpEarned,
      weakTopics,
      recommendedTopics,
    };
  },
};
