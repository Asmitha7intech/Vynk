import { describe, it, expect } from 'vitest';

describe('VYNK Gamification & Progression Engine', () => {
  it('correctly calculates dynamic levels based on accumulated XP', () => {
    const calculateLevel = (xp: number) => Math.min(10, Math.max(1, Math.floor(Math.sqrt(xp / 50)) + 1));

    expect(calculateLevel(0)).toBe(1); // Level 1 Newcomer
    expect(calculateLevel(50)).toBe(2); // Level 2 Explorer
    expect(calculateLevel(250)).toBe(3); // Level 3 Learner
    expect(calculateLevel(500)).toBe(4); // Level 4 Builder
    expect(calculateLevel(1000)).toBe(5); // Level 5 Skilled Builder
    expect(calculateLevel(1800)).toBe(7); // Level 7 Expert
    expect(calculateLevel(4500)).toBe(10); // Level 10 Legend
  });

  it('calculates streak multipliers accurately', () => {
    const baseXP = 20;
    const calculateStreakXP = (streak: number) => {
      if (streak >= 14) return baseXP * 2;
      if (streak >= 7) return baseXP * 1.5;
      return baseXP;
    };

    expect(calculateStreakXP(3)).toBe(20);
    expect(calculateStreakXP(7)).toBe(30);
    expect(calculateStreakXP(21)).toBe(40);
  });
});
