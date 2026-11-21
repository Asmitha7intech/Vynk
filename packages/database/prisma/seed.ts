import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { PrismaClient, QuestDifficulty } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: Database seed script cannot execute in production environment.');
  }

  if (process.env.ALLOW_DB_RESET !== 'true') {
    console.warn('⚠️ Seed aborted: ALLOW_DB_RESET=true is required to execute seed script and wipe data.');
    console.warn('This protects real student accounts and production data from accidental deletion.');
    return;
  }

  console.log('🌱 Starting VYNK database reference data seed (zero synthetic users, posts, or voyages)...');

  // Clean reference data tables in order
  await prisma.quizAttempt.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.dailyChallengeAttempt.deleteMany();
  await prisma.dailyChallenge.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();

  // 1. Create Daily Technical Challenges (Quests)
  await prisma.dailyChallenge.create({
    data: {
      title: 'Python Slicing & Memory References',
      category: 'Python',
      difficulty: QuestDifficulty.INTERMEDIATE,
      snippet: 'x = [1, 2, 3, 4]\ny = x[::-1]\ny[0] = 99\nprint(x[3])',
      question: 'What is the exact output of this Python snippet?',
      options: ['99', '4', 'IndexError', 'None'],
      correctOptionIndex: 1,
      explanation: 'Slicing a list in Python (e.g. x[::-1]) creates a brand-new shallow copy. Modifying y[0] does not mutate original list x, so x[3] remains 4.',
      xpAward: 20,
      activeDate: new Date().toISOString().split('T')[0]
    }
  });

  // 2. Create Weekly Timed Quizzes
  await prisma.quiz.create({
    data: {
      title: 'Algorithms, Data Structures & Complexity',
      slug: 'dsa-and-complexity-championship',
      description: 'Test your grasp on time complexity, recursion, graph traversals, and dynamic programming heuristics.',
      category: 'DSA & Systems',
      difficulty: QuestDifficulty.ADVANCED,
      timeLimitMinutes: 8,
      xpReward: 100,
      isWeeklySpecial: true,
      questions: {
        create: [
          {
            question: 'What is the tightest worst-case time complexity of finding the Median in an unsorted array of size N using Quickselect?',
            codeSnippet: null,
            options: ['O(N)', 'O(N log N)', 'O(N^2)', 'O(log N)'],
            correctOptionIndex: 2,
            explanation: 'While Quickselect runs in O(N) average time, its worst-case (with adversarial pivot choices) degrades to O(N^2). Introselect or Median-of-Medians achieves guaranteed O(N).',
            topic: 'Divide & Conquer'
          },
          {
            question: 'Which graph algorithm can correctly detect negative cycles in a directed weighted graph?',
            codeSnippet: null,
            options: ['Dijkstra with Fibonacci Heap', 'Bellman-Ford Algorithm', 'Kruskal Algorithm', 'Prim Algorithm'],
            correctOptionIndex: 1,
            explanation: 'The Bellman-Ford algorithm relaxes edges N-1 times and detects negative cycles on the N-th pass if any distance value continues to decrease.',
            topic: 'Graph Theory'
          },
          {
            question: 'In a LRU (Least Recently Used) cache with O(1) get and put operations, which combination of data structures is optimal?',
            codeSnippet: null,
            options: ['Array + Binary Search', 'Doubly Linked List + Hash Map', 'Heap + Queue', 'Red-Black Tree + Stack'],
            correctOptionIndex: 1,
            explanation: 'A Doubly Linked List provides O(1) node removal and insertion at head/tail, while a Hash Map provides O(1) key-to-node lookup.',
            topic: 'System Design & Data Structures'
          },
          {
            question: 'What is the recurrence relation for the Merge Sort algorithm on an input of size N?',
            codeSnippet: null,
            options: ['T(N) = 2T(N/2) + O(N)', 'T(N) = T(N-1) + O(N)', 'T(N) = 2T(N/2) + O(1)', 'T(N) = T(N/2) + O(N)'],
            correctOptionIndex: 0,
            explanation: 'Merge sort divides the array into 2 halves of size N/2 and takes O(N) linear time to merge the sorted subarrays: T(N) = 2T(N/2) + O(N), yielding O(N log N) via Master Theorem.',
            topic: 'Asymptotic Analysis'
          }
        ]
      }
    }
  });

  await prisma.quiz.create({
    data: {
      title: 'Modern Full-Stack & Distributed Architecture',
      slug: 'full-stack-distributed-architecture',
      description: 'Validate your knowledge on WebSockets, database indexing, caching strategies, and event loops.',
      category: 'Full-Stack',
      difficulty: QuestDifficulty.INTERMEDIATE,
      timeLimitMinutes: 10,
      xpReward: 80,
      isWeeklySpecial: false,
      questions: {
        create: [
          {
            question: 'What header is sent by the client to initiate a WebSocket upgrade handshake from HTTP/1.1?',
            options: ['Upgrade: websocket', 'Connection: keep-alive', 'Accept: application/socket', 'Transfer-Encoding: chunked'],
            correctOptionIndex: 0,
            explanation: 'The standard WebSocket upgrade request includes "Upgrade: websocket" and "Connection: Upgrade".',
            topic: 'Networking'
          },
          {
            question: 'In PostgreSQL, which index type is specifically optimized for multidimensional vector similarity search (embeddings)?',
            options: ['B-Tree', 'HNSW / IVFFlat (pgvector)', 'GIN', 'BRIN'],
            correctOptionIndex: 1,
            explanation: 'pgvector provides HNSW (Hierarchical Navigable Small World) and IVFFlat indexes for high-speed approximate nearest neighbor vector searches.',
            topic: 'Databases'
          }
        ]
      }
    }
  });

  // 3. Create Reference Badges
  await prisma.badge.create({
    data: {
      code: 'FIRST_VOYAGE',
      title: 'First Voyage',
      description: 'Showcased and published your first technical project portfolio.',
      iconName: 'Rocket',
      category: 'COLLABORATION',
      xpThreshold: 250
    }
  });

  await prisma.badge.create({
    data: {
      code: 'CREW_CAPTAIN',
      title: 'Crew Captain',
      description: 'Formed a collaborative crew and published a verified Team Agreement.',
      iconName: 'ShieldAlert',
      category: 'COLLABORATION',
      xpThreshold: 500
    }
  });

  await prisma.badge.create({
    data: {
      code: 'QUIZ_MASTER',
      title: 'Quiz Champion',
      description: 'Achieved a top 5% score in the weekly technical challenge.',
      iconName: 'Trophy',
      category: 'LEARNING',
      xpThreshold: 750
    }
  });

  await prisma.badge.create({
    data: {
      code: 'STREAK_TITAN',
      title: 'Streak Titan',
      description: 'Maintained a 14+ day continuous learning and challenge streak.',
      iconName: 'Flame',
      category: 'LEARNING',
      xpThreshold: 1000
    }
  });

  console.log('✅ Curated reference data seeded successfully (0 synthetic users or posts created).');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
