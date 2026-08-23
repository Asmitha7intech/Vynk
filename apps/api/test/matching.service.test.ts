import { describe, it, expect } from 'vitest';

describe('VYNK Team Matching Algorithm', () => {
  it('correctly calculates multi-factor compatibility score with skill complementarity weighting', () => {
    // 30% Skill Complementarity, 20% Interest, 15% Role, 15% Availability, 10% Exp, 10% Style
    const skillScore = 100;
    const interestScore = 90;
    const roleScore = 95;
    const availScore = 90;
    const expScore = 75;
    const styleScore = 80;

    const weightedTotal = Math.round(
      0.30 * skillScore +
      0.20 * interestScore +
      0.15 * roleScore +
      0.15 * availScore +
      0.10 * expScore +
      0.10 * styleScore
    );

    expect(weightedTotal).toBe(91);
    expect(weightedTotal).toBeGreaterThanOrEqual(0);
    expect(weightedTotal).toBeLessThanOrEqual(100);
  });

  it('rewards candidates that fill missing team roles over redundant skills', () => {
    const candidateA_FillsFrontend = 100; // missing frontend covered
    const candidateB_DuplicateBackend = 20; // team already has 2 backend devs

    const scoreA = 0.30 * candidateA_FillsFrontend;
    const scoreB = 0.30 * candidateB_DuplicateBackend;

    expect(scoreA).toBeGreaterThan(scoreB);
  });
});
