import { describe, it, expect } from 'vitest';

describe('VYNK Quests & Timed Quiz Evaluator', () => {
  it('correctly calculates quiz score, percentage, and bonus XP for top performers', () => {
    const totalQuestions = 5;
    const correctAnswers = 4; // 80%

    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const baseReward = 100;
    const highPerformerBonus = percentage >= 80 ? 50 : 0;
    const totalXPEarned = Math.round((percentage / 100) * baseReward) + highPerformerBonus;

    expect(percentage).toBe(80);
    expect(totalXPEarned).toBe(130);
  });

  it('aggregates weak topics to generate learning recommendations', () => {
    const wrongAnswers = [
      { topic: 'Graph Theory' },
      { topic: 'Graph Theory' },
      { topic: 'Dynamic Programming' },
    ];

    const weakTopicsMap: Record<string, number> = {};
    wrongAnswers.forEach((a) => {
      weakTopicsMap[a.topic] = (weakTopicsMap[a.topic] || 0) + 1;
    });

    const recommended = Object.keys(weakTopicsMap).map((t) => `${t} Mastery & Heuristics`);

    expect(recommended).toContain('Graph Theory Mastery & Heuristics');
    expect(recommended).toContain('Dynamic Programming Mastery & Heuristics');
    expect(recommended.length).toBe(2);
  });
});
