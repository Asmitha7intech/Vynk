import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@vynk/database';
import { authService } from '../src/services/auth.service';
import { userService } from '../src/services/user.service';
import { messageService } from '../src/services/message.service';
import { questService } from '../src/services/quest.service';
import { postRepository } from '../src/repositories/post.repository';
import { userRepository } from '../src/repositories/user.repository';

describe('VYNK Master Verification — Full Multi-User Student Platform Lifecycle', () => {
  let studentA: any;
  let studentB: any;
  let directConversation: any;
  const uniqueKey = Date.now().toString().slice(-6);

  beforeAll(async () => {
    // 1. Register User A with default CIT fallback
    studentA = await authService.register({
      email: `test_student_a_${uniqueKey}@citchennai.net`,
      password: 'StrongPassword123!',
      username: `test_stud_a_${uniqueKey}`,
      displayName: `Verified Student A`,
      college: '', // Deliberately omitted to test CIT default
      department: 'Computer Science and Engineering',
      graduationYear: 2026,
    });

    // 2. Register User B
    studentB = await authService.register({
      email: `test_student_b_${uniqueKey}@cit.edu.in`,
      password: 'StrongPassword123!',
      username: `test_stud_b_${uniqueKey}`,
      displayName: `Verified Student B`,
      college: 'Chennai Institute of Technology',
      department: 'Artificial Intelligence & Data Science',
      graduationYear: 2025,
    });
  });

  afterAll(async () => {
    // Clean up test records so production/active database is never polluted
    try {
      if (studentA?.id) {
        await prisma.post.deleteMany({ where: { authorId: studentA.id } });
        await prisma.message.deleteMany({ where: { senderId: studentA.id } });
        await prisma.conversationMember.deleteMany({ where: { userId: studentA.id } });
        await prisma.user.delete({ where: { id: studentA.id } }).catch(() => {});
      }
      if (studentB?.id) {
        await prisma.post.deleteMany({ where: { authorId: studentB.id } });
        await prisma.message.deleteMany({ where: { senderId: studentB.id } });
        await prisma.conversationMember.deleteMany({ where: { userId: studentB.id } });
        await prisma.user.delete({ where: { id: studentB.id } }).catch(() => {});
      }
    } catch {}
  });

  describe('1. Authentication, Institution Defaults & Profile Persistence', () => {
    it('defaults omitted college to CIT for Student A', async () => {
      expect(studentA.college).toBe('CIT');
      const persistedA = await userRepository.findById(studentA.id);
      expect(persistedA?.college).toBe('CIT');
    });

    it('preserves explicitly chosen institution for Student B', async () => {
      expect(studentB.college).toBe('Chennai Institute of Technology');
      const persistedB = await userRepository.findById(studentB.id);
      expect(persistedB?.college).toBe('Chennai Institute of Technology');
    });

    it('updates Student A profile with authentic bio and skills and persists', async () => {
      const updated = await userService.updateProfile(studentA.id, {
        bio: 'Building low-latency WebAssembly inference engines and distributed systems.',
        headline: 'Systems & ML Student Engineer',
        skills: ['Rust', 'WebAssembly', 'C++', 'TypeScript', 'PostgreSQL'],
        githubUrl: 'https://github.com/alpha-chen',
      });

      expect(updated.bio).toBe('Building low-latency WebAssembly inference engines and distributed systems.');
      expect(updated.headline).toBe('Systems & ML Student Engineer');
      expect((updated as any).skills).toContain('WebAssembly');
      expect((updated as any).skills).toContain('Rust');

      const reloaded = await userRepository.findById(studentA.id);
      expect(reloaded?.bio).toBe('Building low-latency WebAssembly inference engines and distributed systems.');
    });
  });

  describe('2. Direct Messaging & Conversation Lifecycle', () => {
    it('creates or retrieves direct conversation between Student A and Student B', async () => {
      directConversation = await messageService.getOrCreateDirectConversation(studentA.id, studentB.id);
      expect(directConversation).toBeDefined();
      expect(directConversation.id).toBeDefined();
      expect(directConversation.type).toBe('DIRECT');

      const memberIds = directConversation.members.map((m: any) => m.id);
      expect(memberIds).toContain(studentA.id);
      expect(memberIds).toContain(studentB.id);
    });

    it('retrieves the same conversation when requested reversely by Student B', async () => {
      const convReverse = await messageService.getOrCreateDirectConversation(studentB.id, studentA.id);
      expect(convReverse.id).toBe(directConversation.id);
    });

    it('persists message sent from Student A to Student B', async () => {
      const msg = await messageService.sendMessage(
        directConversation.id,
        studentA.id,
        'Hey Beta! Would you like to collaborate on the distributed systems voyage?'
      );

      expect(msg).toBeDefined();
      expect(msg.content).toContain('distributed systems voyage');
      expect(msg.senderId).toBe(studentA.id);

      // Verify conversation history
      const history = await messageService.getConversationMessages(directConversation.id, studentB.id);
      expect(history.length).toBeGreaterThanOrEqual(1);
      const latest = history[history.length - 1];
      expect(latest.content).toBe('Hey Beta! Would you like to collaborate on the distributed systems voyage?');
      expect(latest.senderId).toBe(studentA.id);
    });

    it('allows Student B to reply and marks read state', async () => {
      const reply = await messageService.sendMessage(
        directConversation.id,
        studentB.id,
        'Absolutely Alpha! Count me in. Let us review the architecture tomorrow.'
      );
      expect(reply.senderId).toBe(studentB.id);

      const markReadRes = await messageService.markConversationRead(directConversation.id, studentA.id);
      expect(markReadRes.success).toBe(true);
    });
  });

  describe('3. Quests & Arena Quiz Server-Side Scoring & Reward Idempotency', () => {
    let activeQuiz: any;

    it('retrieves active arena quizzes from the catalog', async () => {
      const quizzes = await questService.listQuizzes();
      expect(quizzes.length).toBeGreaterThan(0);
      activeQuiz = quizzes[0];
      expect(activeQuiz.questions.length).toBeGreaterThan(0);
    });

    it('evaluates quiz submission server-side and awards XP', async () => {
      // Find full quiz with answer key internally for testing
      const fullQuiz = await prisma.quiz.findUnique({
        where: { id: activeQuiz.id },
        include: { questions: true },
      });

      const userAnswers = fullQuiz!.questions.map((q: any) => ({
        questionId: q.id,
        selectedOptionIndex: q.correctOptionIndex, // Answer all correctly
      }));

      const result = await questService.submitQuiz(
        studentA.id,
        activeQuiz.id,
        120, // 2 minutes spent
        userAnswers
      );

      expect(result.score).toBe(fullQuiz!.questions.length);
      expect(result.percentage).toBe(100);
      expect(result.xpEarned).toBeGreaterThan(0);
      expect(result.feedback).toBeDefined();
      expect(result.feedback.length).toBe(fullQuiz!.questions.length);
      expect(result.feedback[0].isCorrect).toBe(true);
    });

    it('enforces idempotency and prevents duplicate XP farming on repeat attempts', async () => {
      const fullQuiz = await prisma.quiz.findUnique({
        where: { id: activeQuiz.id },
        include: { questions: true },
      });

      const userAnswers = fullQuiz!.questions.map((q: any) => ({
        questionId: q.id,
        selectedOptionIndex: q.correctOptionIndex,
      }));

      const secondAttempt = await questService.submitQuiz(
        studentA.id,
        activeQuiz.id,
        90,
        userAnswers
      );

      // Score is recorded but XP earned should be 0 because it was already completed
      expect(secondAttempt.percentage).toBe(100);
      expect(secondAttempt.xpEarned).toBe(0);
    });
  });

  describe('4. Rich Social Post Creation & Feed Retrieval', () => {
    let createdPost: any;

    it('creates a post with text, emojis, tags, and media attachment', async () => {
      createdPost = await postRepository.createPost(studentA.id, {
        title: 'Sub-15ms edge inference with WebAssembly 🚀',
        content: 'Excited to release our open-source benchmarks! 🔥⚡ We managed to run sub-15ms object detection directly on client hardware with WebAssembly. Check out our demo video below!',
        type: 'VOYAGE_LAUNCH',
        tags: ['WebAssembly', 'EdgeAI', 'Rust', 'Performance'],
        mediaUrls: ['/uploads/posts/media-wasm-demo.mp4'],
      });

      expect(createdPost).toBeDefined();
      expect(createdPost.id).toBeDefined();
      expect(createdPost.title).toContain('WebAssembly 🚀');
      expect(createdPost.content).toContain('🔥⚡');
      expect(createdPost.mediaUrls).toContain('/uploads/posts/media-wasm-demo.mp4');
      expect(createdPost.tags).toContain('WebAssembly');
    });

    it('retrieves the post in the global feed with author metadata', async () => {
      const feedPosts = await postRepository.listFeed(20);
      expect(feedPosts.length).toBeGreaterThan(0);

      const found = feedPosts.find((p: any) => p.id === createdPost.id);
      expect(found).toBeDefined();
      expect(found!.author.id).toBe(studentA.id);
      expect(found!.author.displayName).toBe(studentA.displayName);
      expect(found!.mediaUrls[0]).toBe('/uploads/posts/media-wasm-demo.mp4');
    });
  });
});
