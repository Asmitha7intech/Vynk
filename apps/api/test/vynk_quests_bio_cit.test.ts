import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@vynk/database';
import { authService } from '../src/services/auth.service';
import { questService } from '../src/services/quest.service';
import { userRepository } from '../src/repositories/user.repository';
import { RegisterSchema } from '@vynk/validation';

describe('VYNK Master Verification — CIT Default, Bio Field & Quests Arena Lifecycle', () => {
  let testUser: any;
  const uniqueSuffix = Date.now().toString().slice(-6);

  beforeAll(async () => {
    // Register a fresh student builder to verify CIT default & bio persistence
    testUser = await authService.register({
      email: `cit_builder_${uniqueSuffix}@citchennai.net`,
      password: 'SecurePassword123!',
      username: `cit_builder_${uniqueSuffix}`,
      displayName: 'CIT Builder One',
      college: '', // Omitted to test CIT default fallback
      department: 'Computer Science and Engineering',
      graduationYear: 2026,
    });
  });

  describe('Phase 2 & 3: CIT Default Institution & Bio Field Integrity', () => {
    it('should default new registrations without institution to CIT', async () => {
      expect(testUser.college).toBe('CIT');
      const persisted = await userRepository.findById(testUser.id);
      expect(persisted?.college).toBe('CIT');
    });

    it('should permit citchennai.net and cit.edu.in institutional email domains in RegisterSchema', () => {
      const validCitEmail = RegisterSchema.safeParse({
        email: 'student@citchennai.net',
        password: 'Password123!',
        username: 'cit_student',
        displayName: 'CIT Student',
        college: 'CIT',
        department: 'CSE',
      });
      expect(validCitEmail.success).toBe(true);

      const validCitEduIn = RegisterSchema.safeParse({
        email: 'scholar@cit.edu.in',
        password: 'Password123!',
        username: 'cit_scholar',
        displayName: 'CIT Scholar',
        college: 'CIT',
        department: 'AIDS',
      });
      expect(validCitEduIn.success).toBe(true);
    });

    it('should save, persist, and update custom user bio without synthetic injection', async () => {
      const customBio = 'Full-stack builder passionate about autonomous multi-agent systems and WebAssembly.';
      
      const updated = await userRepository.updateProfile(testUser.id, {
        bio: customBio,
        headline: 'AI & Systems Specialist @ CIT',
      });

      expect(updated.bio).toBe(customBio);
      expect(updated.headline).toBe('AI & Systems Specialist @ CIT');

      // Re-query fresh from database
      const fresh = await userRepository.findById(testUser.id);
      expect(fresh?.bio).toBe(customBio);
      expect(fresh?.headline).toBe('AI & Systems Specialist @ CIT');
    });
  });

  describe('Phase 6: Quests & Arena Complete Lifecycle & Integrity', () => {
    it('should load diverse quizzes across multiple technical categories', async () => {
      const quizzes = await questService.listQuizzes();
      expect(quizzes.length).toBeGreaterThanOrEqual(10);

      const categories = new Set(quizzes.map((q: any) => q.category));
      expect(categories.size).toBeGreaterThanOrEqual(8);
      expect(categories.has('DSA & Algorithms')).toBe(true);
      expect(categories.has('Python')).toBe(true);
      expect(categories.has('Web Development')).toBe(true);
      expect(categories.has('Cybersecurity')).toBe(true);
    });

    it('should not leak correct answers or explanations prior to challenge submission', async () => {
      const res = await questService.getDailyChallenge(testUser.id);
      expect(res.challenge).toBeDefined();
      expect(res.isCompleted).toBe(false);
      expect(res.challenge.correctOptionIndex).toBeUndefined();
      expect(res.challenge.explanation).toBeUndefined();
    });

    it('should evaluate daily challenge submissions server-side and award participation/victory XP', async () => {
      const res = await questService.getDailyChallenge(testUser.id);
      const challengeId = res.challenge.id;

      // Submit an answer
      const submitRes = await questService.submitChallenge(testUser.id, challengeId, 0);
      expect(submitRes.attempt).toBeDefined();
      expect(typeof submitRes.isCorrect).toBe('boolean');
      expect(submitRes.xpEarned).toBeGreaterThan(0);
      expect(submitRes.explanation).toBeDefined();

      // Subsequent attempt must be blocked
      await expect(
        questService.submitChallenge(testUser.id, challengeId, 0)
      ).rejects.toThrow(/already attempted/i);
    });

    it('should sanitize quiz questions and evaluate scores strictly server-side', async () => {
      const quizzes = await questService.listQuizzes();
      const dsaQuiz = quizzes.find((q: any) => q.category === 'DSA & Algorithms') || quizzes[0];

      const fullQuiz = await questService.getQuiz(dsaQuiz.id);
      expect(fullQuiz).toBeDefined();
      if (!fullQuiz) throw new Error('Quiz not found');
      expect(fullQuiz.questions.length).toBeGreaterThanOrEqual(4);

      // Verify no question in the quiz leaks correctOptionIndex
      for (const q of fullQuiz.questions) {
        expect((q as any).correctOptionIndex).toBeUndefined();
        expect((q as any).explanation).toBeUndefined();
      }

      // Submit attempt
      const answers = fullQuiz.questions.map((q: any) => ({
        questionId: q.id,
        selectedOptionIndex: 1, // sample answer
      }));

      const submitRes = await questService.submitQuiz(testUser.id, dsaQuiz.id, 120, answers);
      expect(submitRes.score).toBeDefined();
      expect(submitRes.maxScore).toBe(fullQuiz.questions.length);
      expect(submitRes.percentage).toBeDefined();
      expect(submitRes.weakTopics).toBeDefined();
      expect(submitRes.recommendedTopics).toBeDefined();
      expect(submitRes.feedback).toBeDefined();
      expect(submitRes.feedback.length).toBe(fullQuiz.questions.length);

      // Verify each feedback item now reveals the explanation for learning
      for (const fb of submitRes.feedback) {
        expect(fb.explanation).toBeDefined();
      }
    });

    it('should enforce XP reward idempotency and prevent duplicate XP farming on repeat attempts', async () => {
      const quizzes = await questService.listQuizzes();
      const targetQuiz = quizzes[1];

      const fullQuiz = await questService.getQuiz(targetQuiz.id);
      if (!fullQuiz) throw new Error('Quiz not found');
      const answers = fullQuiz.questions.map((q: any) => ({
        questionId: q.id,
        selectedOptionIndex: 0,
      }));

      // First submission
      const firstSubmit = await questService.submitQuiz(testUser.id, targetQuiz.id, 90, answers);
      const firstXp = firstSubmit.xpEarned;

      // Second identical submission
      const secondSubmit = await questService.submitQuiz(testUser.id, targetQuiz.id, 80, answers);
      // Because score did not improve, no additional duplicate XP is awarded!
      expect(secondSubmit.xpEarned).toBe(0);
    });
  });
});
