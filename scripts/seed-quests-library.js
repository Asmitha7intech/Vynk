import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../data/vynk_db.json');

const raw = fs.readFileSync(dbPath, 'utf8');
const db = JSON.parse(raw);

const now = new Date().toISOString();
const todayStr = now.split('T')[0];

// ============================================================================
// 12 DAILY CHALLENGES (ONE PER TECHNICAL DISCIPLINE)
// ============================================================================
const dailyChallenges = [
  {
    id: 'chal-dsa-001',
    title: 'Cycle Detection in Directed Graphs',
    category: 'DSA & Algorithms',
    difficulty: 'INTERMEDIATE',
    snippet: `// Directed Graph with nodes 0, 1, 2, 3
adj[0] = [1];
adj[1] = [2];
adj[2] = [3];
adj[3] = [1]; // Back edge`,
    question: 'Which traversal state pattern accurately detects a cycle in a directed graph using DFS?',
    options: [
      'Checking if an adjacent vertex is currently in the active recursion call stack (GRAY node)',
      'Checking if an adjacent vertex has ever been visited previously (BLACK node)',
      'Running BFS from any vertex and verifying if visited count exceeds 2 * V',
      'Checking if the sum of in-degrees equals the sum of out-degrees'
    ],
    correctOptionIndex: 0,
    explanation: 'In directed graph DFS, 3-color marking is used: WHITE (unvisited), GRAY (currently in recursion call stack), and BLACK (fully explored). Encountering a GRAY node confirms a back-edge and hence a cycle.',
    xpAward: 25,
    activeDate: todayStr,
    createdAt: now
  },
  {
    id: 'chal-python-002',
    title: 'Python Mutable Default Arguments',
    category: 'Python',
    difficulty: 'INTERMEDIATE',
    snippet: `def append_item(val, items=[]):
    items.append(val)
    return items

print(append_item(1))
print(append_item(2))`,
    question: 'What is the exact stdout output of this Python snippet?',
    options: [
      '[1] then [2]',
      '[1] then [1, 2]',
      '[1] then []',
      'TypeError: default argument cannot be mutated'
    ],
    correctOptionIndex: 1,
    explanation: 'Default arguments in Python are evaluated once at function definition time, not upon each call. Because a list is mutable, successive calls reuse the exact same list instance.',
    xpAward: 20,
    activeDate: '2026-10-17',
    createdAt: now
  },
  {
    id: 'chal-react-003',
    title: 'React 19 Server Components vs Client Directives',
    category: 'Web Development',
    difficulty: 'ADVANCED',
    snippet: `'use client';
import { useState } from 'react';
// What can this component NOT directly do?`,
    question: 'In modern React / Next.js architecture, which capability is prohibited inside a "use client" component file?',
    options: [
      'Using browser APIs like localStorage and window',
      'Using React state hooks like useState and useReducer',
      'Directly importing Node.js native filesystem modules like "fs/promises" or querying databases directly',
      'Passing props down to other Client Components'
    ],
    correctOptionIndex: 2,
    explanation: '"use client" marks boundaries shipped to the browser. Browser runtimes do not have access to server-exclusive modules like node:fs or database connection pools.',
    xpAward: 25,
    activeDate: '2026-10-16',
    createdAt: now
  },
  {
    id: 'chal-node-004',
    title: 'Node.js Event Loop Phase Ordering',
    category: 'Backend Architecture',
    difficulty: 'ADVANCED',
    snippet: `setImmediate(() => console.log('Immediate'));
setTimeout(() => console.log('Timeout'), 0);
process.nextTick(() => console.log('NextTick'));
Promise.resolve().then(() => console.log('Promise'));`,
    question: 'Which callback executes first among the four scheduled operations?',
    options: [
      'Timeout',
      'Immediate',
      'Promise',
      'NextTick'
    ],
    correctOptionIndex: 3,
    explanation: 'process.nextTick queue has priority over all other microtask and macrotask queues. It drains immediately after the current JavaScript execution before the next phase or microtask promise queue.',
    xpAward: 30,
    activeDate: '2026-10-15',
    createdAt: now
  },
  {
    id: 'chal-db-005',
    title: 'Database Isolation: Phantom Reads',
    category: 'Databases & SQL',
    difficulty: 'INTERMEDIATE',
    snippet: `BEGIN TRANSACTION;
SELECT COUNT(*) FROM students WHERE gpa > 3.8;
-- Another concurrent transaction inserts a student with GPA 3.9 & commits
SELECT COUNT(*) FROM students WHERE gpa > 3.8;
COMMIT;`,
    question: 'Which minimum SQL standard isolation level guarantees prevention of Phantom Reads?',
    options: [
      'Read Uncommitted',
      'Read Committed',
      'Repeatable Read',
      'Serializable'
    ],
    correctOptionIndex: 3,
    explanation: 'Serializable isolation is the highest level and guarantees prevention of dirty reads, non-repeatable reads, and phantom reads using predicate locks or two-phase locking.',
    xpAward: 25,
    activeDate: '2026-10-14',
    createdAt: now
  },
  {
    id: 'chal-ai-006',
    title: 'Transformer Self-Attention Time Complexity',
    category: 'AI & Machine Learning',
    difficulty: 'ADVANCED',
    snippet: `Attention(Q, K, V) = softmax( (Q * K^T) / sqrt(d_k) ) * V
where Q, K, V have sequence length N and dimension d`,
    question: 'What is the computational complexity of standard Scaled Dot-Product Attention with respect to sequence length N?',
    options: [
      'O(N * d)',
      'O(N^2 * d)',
      'O(N * log N)',
      'O(d^2 * N)'
    ],
    correctOptionIndex: 1,
    explanation: 'Multiplying the query matrix (N x d) by the transposed key matrix (d x N) yields an N x N attention matrix, requiring O(N^2 * d) operations. This quadratic scaling is the primary motivation for FlashAttention.',
    xpAward: 30,
    activeDate: '2026-10-13',
    createdAt: now
  },
  {
    id: 'chal-sec-007',
    title: 'CSRF Defense Mechanisms in Modern SPAs',
    category: 'Cybersecurity',
    difficulty: 'INTERMEDIATE',
    snippet: `Set-Cookie: session_id=xyz123; HttpOnly; Secure; SameSite=Strict`,
    question: 'Why does setting SameSite=Strict on session cookies effectively mitigate Cross-Site Request Forgery (CSRF)?',
    options: [
      'It prevents client-side JavaScript from reading document.cookie',
      'It encrypts the payload using asymmetric AES-GCM',
      'It instructs the browser never to send the cookie on cross-site requests, including third-party link clicks',
      'It regenerates the token automatically every 60 seconds'
    ],
    correctOptionIndex: 2,
    explanation: 'SameSite=Strict prevents the browser from attaching the cookie to any cross-origin HTTP request or navigation originated from an external third-party domain.',
    xpAward: 25,
    activeDate: '2026-10-12',
    createdAt: now
  },
  {
    id: 'chal-dist-008',
    title: 'CAP Theorem in Network Partitions',
    category: 'Distributed Systems',
    difficulty: 'INTERMEDIATE',
    snippet: `Network partition occurs between Datacenter A and Datacenter B.
Nodes cannot communicate over the WAN link.`,
    question: 'When a network partition is unavoidable, what trade-off must a distributed datastore fundamentally make according to the CAP theorem?',
    options: [
      'Consistency vs Durability',
      'Consistency vs Availability',
      'Availability vs Encryption',
      'Partition Tolerance vs Latency'
    ],
    correctOptionIndex: 1,
    explanation: 'Under network partitioning (P), a system must choose either to refuse writes/reads on disconnected nodes (CP - Consistency) or accept writes on all nodes with potential state divergence (AP - Availability).',
    xpAward: 25,
    activeDate: '2026-10-11',
    createdAt: now
  },
  {
    id: 'chal-bigdata-009',
    title: 'Spark Narrow vs Wide Dependencies',
    category: 'Big Data & Pipelines',
    difficulty: 'ADVANCED',
    snippet: `val rdd1 = sc.parallelize(1 to 1000)
val rdd2 = rdd1.map(x => (x % 10, x))
val rdd3 = rdd2.groupByKey()`,
    question: 'Why does groupByKey() produce a Wide Dependency and shuffle operation in Apache Spark?',
    options: [
      'Because each partition depends strictly on at most one parent partition',
      'Because data with the same key must be redistributed across multiple network nodes and partitions',
      'Because it triggers immediate eager evaluation to driver RAM',
      'Because Spark compresses integers using Snappy'
    ],
    correctOptionIndex: 1,
    explanation: 'Wide dependencies require a network shuffle because records with matching keys from arbitrary partitions across the cluster must be collocated into destination partitions.',
    xpAward: 30,
    activeDate: '2026-10-10',
    createdAt: now
  },
  {
    id: 'chal-ui-010',
    title: "Fitts's Law in Modern UI Layouts",
    category: 'UI/UX Design',
    difficulty: 'EASY',
    snippet: `MT = a + b * log2(2D / W)
where MT = Movement Time, D = Distance, W = Target Width`,
    question: "According to Fitts's Law, how can you reduce user acquisition time for a critical primary action button?",
    options: [
      'Decrease the button size and place it in the center of the viewport',
      'Increase the button target size and place it closer to the user cursor or screen edges',
      'Remove all hover animations to eliminate GPU frame latency',
      'Use only low-contrast monochrome icons'
    ],
    correctOptionIndex: 1,
    explanation: "Fitts's Law states that target acquisition time is a function of target distance and target size. Larger targets placed closer to the user or anchored to screen edges are significantly faster to acquire.",
    xpAward: 20,
    activeDate: '2026-10-09',
    createdAt: now
  },
  {
    id: 'chal-apt-011',
    title: 'Algorithmic Probability & Combinatorics',
    category: 'Aptitude & Reasoning',
    difficulty: 'INTERMEDIATE',
    snippet: `A hash table has 10 buckets. 3 items are inserted uniformly at random with replacement.`,
    question: 'What is the exact probability that all 3 items hash to distinct buckets?',
    options: [
      '0.720 (10 * 9 * 8 / 1000)',
      '0.333',
      '0.900',
      '0.512'
    ],
    correctOptionIndex: 0,
    explanation: 'The first item has 10/10 choices, the second 9/10, and the third 8/10. Total probability = (10/10) * (9/10) * (8/10) = 720 / 1000 = 0.72.',
    xpAward: 25,
    activeDate: '2026-10-08',
    createdAt: now
  },
  {
    id: 'chal-devops-012',
    title: 'Docker Image Layer Optimization & Caching',
    category: 'DevOps & Systems',
    difficulty: 'INTERMEDIATE',
    snippet: `FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build`,
    question: 'What is the primary architectural flaw in this Dockerfile with respect to build cache efficiency?',
    options: [
      'Alpine Linux images cannot run Node.js applications',
      'Copying the entire source before "npm install" busts the package cache on every single code change',
      'WORKDIR must be /usr/src/app according to POSIX standard',
      'npm install requires root privileges'
    ],
    correctOptionIndex: 1,
    explanation: 'Copying "package.json" and "pnpm-lock.yaml" first and running the install before copying the rest of the application code preserves the layer cache when code edits do not alter dependencies.',
    xpAward: 25,
    activeDate: '2026-10-07',
    createdAt: now
  }
];

// ============================================================================
// 12 ARENA QUIZZES (ONE PER TECHNICAL DISCIPLINE WITH 5-6 QUESTIONS EACH)
// ============================================================================
const quizzesData = [
  {
    quiz: {
      id: 'quiz-dsa-001',
      title: 'Algorithms, Data Structures & Complexity Championship',
      slug: 'dsa-and-complexity-championship',
      description: 'Test your grasp on time complexity, recursion, graph traversals, and dynamic programming heuristics.',
      category: 'DSA & Algorithms',
      difficulty: 'ADVANCED',
      timeLimitMinutes: 10,
      xpReward: 100,
      isWeeklySpecial: true,
      startsAt: null,
      expiresAt: null,
      createdAt: now
    },
    questions: [
      {
        id: 'qq-dsa-1',
        question: 'What is the tightest worst-case time complexity of Quickselect when using randomized pivot selection?',
        codeSnippet: null,
        options: ['O(N)', 'O(N log N)', 'O(N^2)', 'O(log N)'],
        correctOptionIndex: 2,
        explanation: 'While randomized Quickselect runs in O(N) expected time, adversarial or worst-case pivot choices still degrade to O(N^2). Introselect or Median-of-Medians guarantees worst-case O(N).',
        topic: 'Sorting & Selection'
      },
      {
        id: 'qq-dsa-2',
        question: 'Which graph algorithm correctly detects negative cycles in a directed weighted graph?',
        codeSnippet: null,
        options: ['Dijkstra with Fibonacci Heap', 'Bellman-Ford Algorithm', 'Kruskal Algorithm', 'Prim Algorithm'],
        correctOptionIndex: 1,
        explanation: 'The Bellman-Ford algorithm relaxes all edges V-1 times and detects negative weight cycles on the V-th pass if any distance continues to decrease.',
        topic: 'Graph Theory'
      },
      {
        id: 'qq-dsa-3',
        question: 'In a binary search tree of N elements, what is the worst-case space complexity of recursive inorder traversal?',
        codeSnippet: null,
        options: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
        correctOptionIndex: 2,
        explanation: 'In a completely degenerate (skewed) binary search tree, the recursion depth equals the height of the tree, which is N.',
        topic: 'Trees & Traversals'
      },
      {
        id: 'qq-dsa-4',
        question: 'What is the optimal time complexity to compute the Longest Increasing Subsequence of an array of size N?',
        codeSnippet: null,
        options: ['O(N^3)', 'O(N^2)', 'O(N log N)', 'O(N)'],
        correctOptionIndex: 2,
        explanation: 'Patience sorting with binary search (or tail array with bisect) achieves O(N log N) time complexity compared to standard O(N^2) DP.',
        topic: 'Dynamic Programming'
      },
      {
        id: 'qq-dsa-5',
        question: 'Which heap operation runs in worst-case O(1) amortized time in a Fibonacci Heap?',
        codeSnippet: null,
        options: ['Delete Min', 'Insert & Decrease Key', 'Extract Min & Delete', 'Find Min only'],
        correctOptionIndex: 1,
        explanation: 'Fibonacci heaps achieve O(1) amortized time for Insert, Union, and Decrease-Key operations, making them theoretically ideal for Dijkstra.',
        topic: 'Priority Queues & Heaps'
      }
    ]
  },
  {
    quiz: {
      id: 'quiz-python-002',
      title: 'Python Memory & Runtime Architecture Arena',
      slug: 'python-memory-runtime-arena',
      description: 'Master reference counting, generator coroutines, GIL synchronization, and dunder mechanisms.',
      category: 'Python',
      difficulty: 'INTERMEDIATE',
      timeLimitMinutes: 8,
      xpReward: 80,
      isWeeklySpecial: false,
      startsAt: null,
      expiresAt: null,
      createdAt: now
    },
    questions: [
      {
        id: 'qq-py-1',
        question: 'How does CPython manage memory reclamation for reference cycles (e.g. A references B, B references A)?',
        codeSnippet: null,
        options: ['Reference counting alone immediately frees them', 'A generational cyclic garbage collector periodically traverses container objects', 'Manual free() calls in the interpreter loop', 'Reference cycles cause unavoidable memory leaks in CPython'],
        correctOptionIndex: 1,
        explanation: 'CPython pairs reference counting with a 3-generation cyclic garbage collector (gc module) that detects unreachable reference loops.',
        topic: 'Memory Management'
      },
      {
        id: 'qq-py-2',
        question: 'What is the output of isinstance(True, int) in standard Python 3?',
        codeSnippet: null,
        options: ['True', 'False', 'TypeError', 'None'],
        correctOptionIndex: 0,
        explanation: 'In Python, bool is a subclass of int. True and False inherit from int with values 1 and 0 respectively.',
        topic: 'Object Model'
      },
      {
        id: 'qq-py-3',
        question: 'What happens when a generator function encounters a "return value" statement in Python?',
        codeSnippet: null,
        options: ['The generator emits the value as a yielded item', 'It raises StopIteration(value), storing the return value in the exception payload', 'It raises SyntaxError in generator context', 'The generator freezes without stopping'],
        correctOptionIndex: 1,
        explanation: 'Returning from a generator raises StopIteration with the return value attached to the e.value attribute, which coroutines utilize in PEP 380.',
        topic: 'Generators & Coroutines'
      },
      {
        id: 'qq-py-4',
        question: 'Which GIL (Global Interpreter Lock) behavior is true in CPython 3.12 and earlier?',
        codeSnippet: null,
        options: ['CPU-bound Python threads execute simultaneously across all available physical cores', 'Only one thread can execute Python bytecode at a time, though I/O operations release the lock', 'The GIL completely prevents race conditions on complex shared states', 'The GIL is disabled when using multiprocessing'],
        correctOptionIndex: 1,
        explanation: 'The GIL prevents concurrent bytecode execution in multi-threaded CPython. However, long-running I/O or native C extensions release the GIL.',
        topic: 'Concurrency & GIL'
      },
      {
        id: 'qq-py-5',
        question: 'What is the purpose of __slots__ in a Python class definition?',
        codeSnippet: 'class FastPoint:\n    __slots__ = ("x", "y")',
        options: ['To enforce strict static type checking', 'To prevent dynamic __dict__ creation per instance, drastically saving memory', 'To make class instances immutable', 'To auto-generate getter and setter properties'],
        correctOptionIndex: 1,
        explanation: 'Defining __slots__ replaces the default per-instance dictionary (__dict__) with a compact array of descriptors, saving significant RAM when instantiating millions of objects.',
        topic: 'Performance Optimization'
      }
    ]
  },
  {
    quiz: {
      id: 'quiz-react-003',
      title: 'React 19 & Modern Frontend Engineering',
      slug: 'react-19-modern-frontend',
      description: 'Deep dive into reconciliation, hooks lifecycle, concurrency, hydration, and component architecture.',
      category: 'Web Development',
      difficulty: 'INTERMEDIATE',
      timeLimitMinutes: 8,
      xpReward: 85,
      isWeeklySpecial: true,
      startsAt: null,
      expiresAt: null,
      createdAt: now
    },
    questions: [
      {
        id: 'qq-react-1',
        question: 'What is the primary role of keys in React list reconciliation?',
        codeSnippet: null,
        options: ['Keys uniquely identify DOM elements across browser tabs', 'Keys help React identify which items have changed, been added, or been removed between renders', 'Keys enforce CSS layout z-indexing', 'Keys prevent component re-renders entirely'],
        correctOptionIndex: 1,
        explanation: 'React uses keys to correlate Virtual DOM nodes with physical DOM elements across re-renders, preventing unwanted recreation of component state.',
        topic: 'Reconciliation'
      },
      {
        id: 'qq-react-2',
        question: 'When does the cleanup function of a useEffect hook execute?',
        codeSnippet: 'useEffect(() => {\n  const sub = api.subscribe();\n  return () => sub.unsubscribe();\n}, [dep]);',
        options: ['Only when the user closes the browser tab', 'Before running the effect on subsequent renders when dependencies change, and on unmount', 'Immediately after every DOM render before the main effect runs', 'Never if the dependency array has items'],
        correctOptionIndex: 1,
        explanation: 'React invokes the effect cleanup function before re-executing the effect with updated dependencies, and once more when the component is unmounted.',
        topic: 'Hooks Lifecycle'
      },
      {
        id: 'qq-react-3',
        question: 'What does React.startTransition do in concurrent React?',
        codeSnippet: null,
        options: ['Applies a CSS transition animation', 'Marks non-urgent UI updates as interruptible transitions, keeping input fields responsive', 'Forces synchronous layout reflow', 'Delays network requests by 500ms'],
        correctOptionIndex: 1,
        explanation: 'startTransition flags state updates as transitions that can be interrupted by higher-priority user interactions such as keystrokes or clicks.',
        topic: 'Concurrent Features'
      },
      {
        id: 'qq-react-4',
        question: 'Why must React hooks strictly be called at the top level of a component?',
        codeSnippet: null,
        options: ['To ensure hooks are registered on the global window object', 'React relies on call order across renders to associate internal state with each hook call', 'It is required by the JavaScript ECMAScript specification', 'To allow garbage collection of hook closures'],
        correctOptionIndex: 1,
        explanation: 'React stores fiber state in a singly linked list. It relies on the identical sequence of hook calls on every render to map state slots accurately.',
        topic: 'Rules of Hooks'
      },
      {
        id: 'qq-react-5',
        question: 'What causes a React hydration mismatch error during SSR?',
        codeSnippet: null,
        options: ['Database connection timeout on backend', 'The server-rendered HTML markup does not match the client Virtual DOM generated on initial render', 'Using HTTP instead of HTTPS', 'Using CSS modules'],
        correctOptionIndex: 1,
        explanation: 'Hydration attaches event listeners to pre-rendered HTML. If client-side initial render produces differing markup (e.g. window checks, timestamps), hydration fails.',
        topic: 'Server-Side Rendering'
      }
    ]
  },
  {
    quiz: {
      id: 'quiz-backend-004',
      title: 'Fastify, Node.js & High-Throughput APIs',
      slug: 'fastify-nodejs-backend-architecture',
      description: 'Evaluate your knowledge on request lifecycles, JSON serialization schema compilation, and streams.',
      category: 'Backend Architecture',
      difficulty: 'ADVANCED',
      timeLimitMinutes: 10,
      xpReward: 90,
      isWeeklySpecial: false,
      startsAt: null,
      expiresAt: null,
      createdAt: now
    },
    questions: [
      {
        id: 'qq-be-1',
        question: 'Why does Fastify achieve significantly higher throughput than Express for JSON serialization?',
        codeSnippet: null,
        options: ['Fastify compiles JSON schemas into optimized inline string concatenator functions with fast-json-stringify', 'Fastify uses WebAssembly for all network routing', 'Fastify skips HTTP header validation', 'Fastify runs on the GPU'],
        correctOptionIndex: 0,
        explanation: 'Fastify uses JSON schema validation and fast-json-stringify, which compiles pre-computed string serialization functions rather than traversing JSON.stringify generically.',
        topic: 'Fastify Serialization'
      },
      {
        id: 'qq-be-2',
        question: 'What problem occurs when a readable stream produces data faster than a writable stream can consume it?',
        codeSnippet: null,
        options: ['Deadlock', 'Buffer overflow & uncontrolled memory expansion (Backpressure problem)', 'Zero-copy memory corruption', 'Immediate socket termination'],
        correctOptionIndex: 1,
        explanation: 'Without backpressure management, unconsumed chunks accumulate in the readable stream internal buffer, consuming unbounded memory. .pipe() or stream.pipeline handles this automatically.',
        topic: 'Node.js Streams'
      },
      {
        id: 'qq-be-3',
        question: 'In Node.js clustering, how does the master process distribute incoming TCP connections among worker processes on modern Linux?',
        codeSnippet: null,
        options: ['Using a shared database lock', 'Round-robin (or OS SO_REUSEPORT) via the master process distributing socket handles', 'Each worker process binds to a different port number', 'Workers poll the file descriptor table'],
        correctOptionIndex: 1,
        explanation: 'The master process listens on the port, accepts incoming connections, and hands off client socket handles to worker processes using IPC round-robin distribution.',
        topic: 'Cluster & Multi-process'
      },
      {
        id: 'qq-be-4',
        question: 'Which Fastify lifecycle hook is best suited for JWT authentication before route business logic executes?',
        codeSnippet: null,
        options: ['onSend', 'preHandler / onRequest', 'onResponse', 'onError'],
        correctOptionIndex: 1,
        explanation: 'onRequest or preHandler hooks intercept requests before handler execution to verify credentials and attach userPayload.',
        topic: 'Fastify Lifecycle'
      },
      {
        id: 'qq-be-5',
        question: 'What happens when an unhandled Promise rejection occurs in Node.js v16+?',
        codeSnippet: null,
        options: ['It is silently logged and ignored', 'Node.js terminates the process with a non-zero exit code (crash)', 'The event loop pauses for 5 seconds', 'The rejection converts to an unhandled DOM event'],
        correctOptionIndex: 1,
        explanation: 'Node.js defaults to unhandledRejection=throw, crashing the process to prevent executing in corrupted or undefined asynchronous states.',
        topic: 'Error Handling'
      }
    ]
  },
  {
    quiz: {
      id: 'quiz-db-005',
      title: 'Databases, Indexing & SQL Query Optimization',
      slug: 'databases-indexing-sql-optimization',
      description: 'Understand B-Trees, composite indexes, query execution plans, and write-ahead logs.',
      category: 'Databases & SQL',
      difficulty: 'INTERMEDIATE',
      timeLimitMinutes: 10,
      xpReward: 90,
      isWeeklySpecial: true,
      startsAt: null,
      expiresAt: null,
      createdAt: now
    },
    questions: [
      {
        id: 'qq-db-1',
        question: 'Why are B+ Trees favored over Binary Search Trees for disk-based relational database indexes?',
        codeSnippet: null,
        options: ['B+ Trees have fewer nodes than binary trees', 'High fan-out minimizes the depth of the tree, drastically reducing disk I/O seeks', 'B+ Trees do not require sorting', 'B+ Trees run exclusively in L1 CPU cache'],
        correctOptionIndex: 1,
        explanation: 'Disk reads occur in blocks (pages). B+ trees have a high branching factor (fan-out of hundreds), allowing millions of rows to be searched in only 3 to 4 disk page accesses.',
        topic: 'Storage Engines & Trees'
      },
      {
        id: 'qq-db-2',
        question: 'Given a composite index on (department, college, graduationYear), which WHERE clause CANNOT use this index effectively?',
        codeSnippet: null,
        options: ['WHERE department = "CS" AND college = "CIT"', 'WHERE department = "CS"', 'WHERE college = "CIT" AND graduationYear = 2026', 'WHERE department = "CS" AND college = "CIT" AND graduationYear = 2026'],
        correctOptionIndex: 2,
        explanation: 'B-tree composite indexes obey the Leftmost Prefix Rule. A query filtering by (college, graduationYear) omits the leading column (department) and cannot seek the index.',
        topic: 'Composite Indexes'
      },
      {
        id: 'qq-db-3',
        question: 'What is the role of the Write-Ahead Log (WAL) in PostgreSQL and SQLite?',
        codeSnippet: null,
        options: ['It logs user passwords for security audits', 'It records state changes to sequential disk storage before modifying dirty data pages, guaranteeing ACID Durability', 'It stores cached query execution plans', 'It replicates data to cloud backups asynchronously'],
        correctOptionIndex: 1,
        explanation: 'WAL ensures durability by writing change operations sequentially before applying changes to random disk data pages. In crash recovery, unwritten page changes are replayed.',
        topic: 'ACID & Durability'
      },
      {
        id: 'qq-db-4',
        question: 'What does EXPLAIN ANALYZE do in PostgreSQL when troubleshooting slow queries?',
        codeSnippet: null,
        options: ['Rewrites the query using AI heuristics', 'Executes the query and displays actual run times, rows scanned, and plan steps', 'Dry runs the query without database locks', 'Generates foreign key constraints'],
        correctOptionIndex: 1,
        explanation: 'EXPLAIN shows estimated execution plans; EXPLAIN ANALYZE executes the statement to output actual elapsed times, buffer hits, and actual row counts per plan node.',
        topic: 'Query Plans'
      },
      {
        id: 'qq-db-5',
        question: 'What is a "Covering Index" in SQL optimization?',
        codeSnippet: null,
        options: ['An index that covers all tables in the database schema', 'An index containing all columns referenced in the query, allowing index-only scans without table lookup', 'An index that replaces the primary key', 'An encrypted index'],
        correctOptionIndex: 1,
        explanation: 'When an index contains every column requested by SELECT and WHERE, the database satisfies the entire query from index pages alone without touching the table heap.',
        topic: 'Index Optimization'
      }
    ]
  },
  {
    quiz: {
      id: 'quiz-ai-006',
      title: 'AI, LLMs & Neural Architecture Challenge',
      slug: 'ai-llm-neural-architecture',
      description: 'Explore embeddings, loss functions, KV cache, tokenizer mechanics, and prompt engineering principles.',
      category: 'AI & Machine Learning',
      difficulty: 'ADVANCED',
      timeLimitMinutes: 10,
      xpReward: 100,
      isWeeklySpecial: true,
      startsAt: null,
      expiresAt: null,
      createdAt: now
    },
    questions: [
      {
        id: 'qq-ai-1',
        question: 'Why is Key-Value (KV) Caching critical during auto-regressive LLM token generation?',
        codeSnippet: null,
        options: ['It caches previously generated text to disk', 'It prevents re-calculating keys and values for past prompt tokens on every newly generated token', 'It reduces GPU VRAM consumption to zero', 'It speeds up backpropagation during training'],
        correctOptionIndex: 1,
        explanation: 'In auto-regressive decoding, previous tokens do not change. Caching their Key and Value projections eliminates quadratic re-computation per token, turning generation into O(N) attention passes.',
        topic: 'LLM Inference Optimization'
      },
      {
        id: 'qq-ai-2',
        question: 'What is the purpose of Softmax temperature when sampling from an LLM probability distribution?',
        codeSnippet: 'probs = softmax(logits / temperature)',
        options: ['Controls the GPU chip temperature during tensor math', 'Lower temperature (<1.0) sharpens probabilities toward the top token; higher temperature flattens diversity', 'Measures network latency between client and inference server', 'Enforces strict safety guardrails'],
        correctOptionIndex: 1,
        explanation: 'Dividing logits by temperature scales the distribution: T -> 0 approaches argmax (deterministic greedy), while higher T increases probability mass for lower-ranked tokens.',
        topic: 'Decoding & Sampling'
      },
      {
        id: 'qq-ai-3',
        question: 'Which loss function is universally used to train standard classification models and next-token predictors?',
        codeSnippet: null,
        options: ['Mean Squared Error (MSE)', 'Cross-Entropy Loss (Negative Log-Likelihood)', 'Hinge Loss', 'Huber Loss'],
        correctOptionIndex: 1,
        explanation: 'Cross-entropy measures the distance between the model predicted probability distribution and the true target distribution (one-hot or ground truth token).',
        topic: 'Loss Functions'
      },
      {
        id: 'qq-ai-4',
        question: 'What is the primary architectural advantage of LoRA (Low-Rank Adaptation) for LLM fine-tuning?',
        codeSnippet: 'W_new = W_0 + (B * A) where rank r << d',
        options: ['It retrains all model parameters from scratch', 'It freezes base weights and trains small low-rank decomposition matrices, reducing trainable parameters by 99%+', 'It converts models into pure CPU binaries', 'It removes positional embeddings'],
        correctOptionIndex: 1,
        explanation: 'LoRA represents weight updates as delta W = B * A with low rank r. This allows multi-billion parameter models to be fine-tuned using consumer GPUs.',
        topic: 'Parameter-Efficient Fine-Tuning'
      },
      {
        id: 'qq-ai-5',
        question: 'Why is cosine similarity commonly used to compare high-dimensional vector embeddings over Euclidean distance?',
        codeSnippet: null,
        options: ['Cosine similarity measures angular alignment independent of embedding vector magnitudes', 'Cosine similarity takes O(1) time while Euclidean takes O(N^2)', 'Euclidean distance cannot be computed in Python', 'Cosine similarity only works on 2D vectors'],
        correctOptionIndex: 0,
        explanation: 'Cosine similarity evaluates the angle between vectors, normalizing for token length or document length differences in dense semantic space.',
        topic: 'Embeddings & Vector Search'
      }
    ]
  },
  {
    quiz: {
      id: 'quiz-sec-007',
      title: 'Cybersecurity, Web Exploits & Defense Arena',
      slug: 'cybersecurity-web-exploits-defense',
      description: 'Evaluate security postures against injection vectors, JWT vulnerabilities, timing attacks, and SSRF.',
      category: 'Cybersecurity',
      difficulty: 'INTERMEDIATE',
      timeLimitMinutes: 8,
      xpReward: 85,
      isWeeklySpecial: false,
      startsAt: null,
      expiresAt: null,
      createdAt: now
    },
    questions: [
      {
        id: 'qq-sec-1',
        question: 'Why are parameterized SQL queries immune to SQL Injection vulnerabilities?',
        codeSnippet: null,
        options: ['Parameters are automatically checked for SQL keywords like DROP and UNION', 'Parameters are sent separately from the SQL statement as data payloads, never parsed as executable code', 'Parameterized queries use SSL encryption on the wire', 'Database engines convert SQL to regex'],
        correctOptionIndex: 1,
        explanation: 'Prepared statements pre-compile the SQL statement structure. User parameters are bound strictly as data values, so special characters cannot alter the AST syntax tree.',
        topic: 'Injection Defense'
      },
      {
        id: 'qq-sec-2',
        question: 'What vulnerability occurs if a backend blindly accepts the "none" algorithm in a JWT header?',
        codeSnippet: null,
        options: ['DOS attack', 'Signature verification is bypassed, allowing attackers to forge arbitrary claims with no secret key', 'The database drops foreign keys', 'Memory leak in the crypto library'],
        correctOptionIndex: 1,
        explanation: 'The "alg: none" attack exploits libraries that treat tokens as verified without checking any cryptographic signature if the header requests "none".',
        topic: 'JWT Security'
      },
      {
        id: 'qq-sec-3',
        question: 'What is a Server-Side Request Forgery (SSRF) vulnerability?',
        codeSnippet: null,
        options: ['An attacker tricks a web server into making unauthorized HTTP requests to internal network services (e.g. AWS metadata 169.254.169.254)', 'An attacker steals cookies via cross-site script injection', 'An attacker spams public API endpoints', 'An attacker steals domain DNS records'],
        correctOptionIndex: 0,
        explanation: 'SSRF allows attackers to abuse backend server privileges to access internal private IPs, cloud instance metadata credentials, and unauthenticated internal microservices.',
        topic: 'Network Exploits'
      },
      {
        id: 'qq-sec-4',
        question: 'Why should password verification use a constant-time comparison function (e.g. crypto.timingSafeEqual)?',
        codeSnippet: null,
        options: ['To speed up string comparison', 'To eliminate timing side-channel attacks that deduce password characters by measuring microseconds', 'To prevent memory fragmentation', 'To format strings in UTF-8'],
        correctOptionIndex: 1,
        explanation: 'Standard string comparisons exit on the first mismatched character. Attackers can measure response time variations to infer secret characters one by one.',
        topic: 'Cryptographic Hardening'
      },
      {
        id: 'qq-sec-5',
        question: 'What does Content-Security-Policy (CSP) header primarily protect against?',
        codeSnippet: null,
        options: ['SQL injection', 'Cross-Site Scripting (XSS) and unauthorized resource loading', 'DDoS volumetric floods', 'Bcrypt password cracking'],
        correctOptionIndex: 1,
        explanation: 'CSP instructs modern browsers to restrict script execution sources, inline scripts, and untrusted asset loading, thwarting XSS payload execution.',
        topic: 'Browser Security'
      }
    ]
  },
  {
    quiz: {
      id: 'quiz-dist-008',
      title: 'Distributed Systems & Cloud Architecture',
      slug: 'distributed-systems-cloud-architecture',
      description: 'Test your understanding of Raft consensus, consistent hashing, message brokers, and fault tolerance.',
      category: 'Distributed Systems',
      difficulty: 'ADVANCED',
      timeLimitMinutes: 10,
      xpReward: 95,
      isWeeklySpecial: true,
      startsAt: null,
      expiresAt: null,
      createdAt: now
    },
    questions: [
      {
        id: 'qq-dist-1',
        question: 'In the Raft consensus algorithm, how does a leader maintain its authority and prevent split-brain elections?',
        codeSnippet: null,
        options: ['By locking the cluster database', 'By broadcasting periodic heartbeat AppendEntries RPCs to all followers', 'By running an election every 10 seconds', 'By using NTP synchronized atomic clocks'],
        correctOptionIndex: 1,
        explanation: 'A Raft leader sends periodic heartbeat AppendEntries RPCs. If a follower does not receive a heartbeat within its randomized election timeout, it assumes the leader died and initiates an election.',
        topic: 'Consensus & Raft'
      },
      {
        id: 'qq-dist-2',
        question: 'Why is Consistent Hashing preferred over hash(key) % N in distributed caching rings?',
        codeSnippet: null,
        options: ['It uses 100% fewer CPU cycles', 'Adding or removing a node only remaps K / N keys rather than almost every key in the cluster', 'It encrypts cache keys with AES', 'It prevents network latency completely'],
        correctOptionIndex: 1,
        explanation: 'With standard modulo hashing, changing N shifts virtually all keys to new nodes, causing cache stampedes. Consistent hashing only reallocates keys belonging to the adjacent node on the hash ring.',
        topic: 'Consistent Hashing'
      },
      {
        id: 'qq-dist-3',
        question: 'What is the role of a Dead Letter Queue (DLQ) in message-driven architectures like Kafka or RabbitMQ?',
        codeSnippet: null,
        options: ['Stores deleted customer messages for GDPR', 'Captures poisoned or repeatedly failing messages after retry limits without blocking the main event queue', 'Accelerates message delivery by 10x', 'Acts as a warm standby server'],
        correctOptionIndex: 1,
        explanation: 'A DLQ isolates malformed or unprocessable messages so consumers can continue processing healthy traffic without getting stuck in infinite failure retry loops.',
        topic: 'Event-Driven Systems'
      },
      {
        id: 'qq-dist-4',
        question: 'What is the primary function of a Circuit Breaker pattern (e.g. Netflix Hystrix) in microservices?',
        codeSnippet: null,
        options: ['Prevents cascading failures by fast-failing downstream calls when failure thresholds are exceeded', 'Balances HTTP requests equally across regions', 'Encrypts microservice RPC payloads', 'Performs zero-downtime database migrations'],
        correctOptionIndex: 0,
        explanation: 'When a downstream service degrades, the circuit breaker opens to fail immediately without waiting for timeouts, giving the struggling dependency time to recover.',
        topic: 'Resilience & Fault Tolerance'
      },
      {
        id: 'qq-dist-5',
        question: 'What is the Two-Phase Commit (2PC) protocol used for in distributed databases?',
        codeSnippet: null,
        options: ['High-speed sorting across partitions', 'Achieving atomic commit across multiple distributed nodes with Prepare and Commit phases', 'Electing a new master node', 'Encrypting inter-node traffic'],
        correctOptionIndex: 1,
        explanation: '2PC coordinates distributed transactions by first ensuring all participants can commit (Prepare), and then issuing the Commit order once unanimous agreement is reached.',
        topic: 'Distributed Transactions'
      }
    ]
  },
  {
    quiz: {
      id: 'quiz-bigdata-009',
      title: 'Big Data, Spark & Streaming Pipelines',
      slug: 'big-data-spark-streaming-pipelines',
      description: 'Explore columnar storage, Apache Spark internals, Kafka partition semantics, and Medallion architecture.',
      category: 'Big Data & Pipelines',
      difficulty: 'INTERMEDIATE',
      timeLimitMinutes: 10,
      xpReward: 90,
      isWeeklySpecial: false,
      startsAt: null,
      expiresAt: null,
      createdAt: now
    },
    questions: [
      {
        id: 'qq-bd-1',
        question: 'Why are columnar formats like Apache Parquet significantly faster for analytics queries than row-oriented JSON/CSV?',
        codeSnippet: null,
        options: ['Parquet compresses data using HTML', 'Parquet enables projection pushdown (only reading queried columns) and dictionary compression', 'Parquet eliminates the need for query plans', 'Parquet runs inside the JVM heap directly'],
        correctOptionIndex: 1,
        explanation: 'Columnar formats store data by column on disk. Analytic queries selecting 3 out of 100 columns skip reading 97% of disk bytes, while benefiting from high compression ratios.',
        topic: 'Storage & Parquet'
      },
      {
        id: 'qq-bd-2',
        question: 'In Apache Kafka, what is the maximum number of active consumers in a single Consumer Group that can read from a topic with 8 partitions?',
        codeSnippet: null,
        options: ['Unlimited', '8', '16', '1'],
        correctOptionIndex: 1,
        explanation: 'Kafka assigns each partition to exactly one consumer within a group. Any consumers exceeding the partition count will remain idle.',
        topic: 'Kafka Consumer Groups'
      },
      {
        id: 'qq-bd-3',
        question: 'In the Medallion Data Architecture (Bronze -> Silver -> Gold), what is the primary state of Silver data?',
        codeSnippet: null,
        options: ['Raw, untransformed JSON dumps direct from external webhooks', 'Cleaned, deduplicated, enriched, and schema-validated tables ready for analytical exploration', 'Aggregated business KPI dashboards only', 'Cold archive backup files'],
        correctOptionIndex: 1,
        explanation: 'Bronze holds raw ingested events; Silver provides cleansed, filtered, and conforming relational records; Gold stores pre-aggregated business metrics.',
        topic: 'Lakehouse Architecture'
      },
      {
        id: 'qq-bd-4',
        question: 'What is the purpose of the Catalyst Optimizer in Apache Spark SQL?',
        codeSnippet: null,
        options: ['Transfers data over optical fiber', 'Compiles logical query plans into optimized physical RDD execution plans using rule-based and cost-based optimizations', 'Manages worker memory garbage collection', 'Provides a real-time terminal UI'],
        correctOptionIndex: 1,
        explanation: 'Catalyst automatically pushes down predicates, prunes unneeded columns, and reorders joins to optimize physical distributed execution.',
        topic: 'Spark Catalyst'
      },
      {
        id: 'qq-bd-5',
        question: 'What is Watermarking in stream processing systems like Apache Flink or Spark Structured Streaming?',
        codeSnippet: null,
        options: ['Adding cryptographic signatures to data rows', 'A threshold mechanism to handle late-arriving out-of-order events before closing stateful aggregation windows', 'Cleaning corrupt database records', 'Encrypting telemetry events'],
        correctOptionIndex: 1,
        explanation: 'Watermarks define how long the engine waits for delayed out-of-order events before finalizing windowed aggregates and freeing state memory.',
        topic: 'Stream Processing'
      }
    ]
  },
  {
    quiz: {
      id: 'quiz-uiux-010',
      title: 'UI/UX Design, HCI Systems & Accessibility',
      slug: 'uiux-design-hci-systems-accessibility',
      description: 'Master usability heuristics, mental models, WCAG 2.2 accessibility, and micro-interaction principles.',
      category: 'UI/UX Design',
      difficulty: 'BEGINNER',
      timeLimitMinutes: 8,
      xpReward: 75,
      isWeeklySpecial: false,
      startsAt: null,
      expiresAt: null,
      createdAt: now
    },
    questions: [
      {
        id: 'qq-ui-1',
        question: 'According to Jakob Nielsen 10 Usability Heuristics, what does "Visibility of System Status" require?',
        codeSnippet: null,
        options: ['Displaying all internal server logs to the user', 'Keeping users informed about what is happening through appropriate feedback within a reasonable time (e.g. progress bars)', 'Showing the system IP address in the header', 'Hiding loading states to make apps feel instant'],
        correctOptionIndex: 1,
        explanation: 'Users must never be left guessing whether their click registered. Immediate feedback, progress spinners, or state transitions keep users confident.',
        topic: 'Nielsen Heuristics'
      },
      {
        id: 'qq-ui-2',
        question: 'What is the minimum WCAG 2.2 AA contrast ratio required for normal body text against its background?',
        codeSnippet: null,
        options: ['2:1', '3:1', '4.5:1', '7:1'],
        correctOptionIndex: 2,
        explanation: 'WCAG AA requires a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text (18pt+ or 14pt bold).',
        topic: 'Accessibility (WCAG)'
      },
      {
        id: 'qq-ui-3',
        question: 'What is the UX concept of "Cognitive Load"?',
        codeSnippet: null,
        options: ['The CPU load of running web applications', 'The total amount of mental effort and working memory required by a user to operate an interface', 'The time taken to download fonts', 'The number of animations per second'],
        correctOptionIndex: 1,
        explanation: 'Minimizing extraneous cognitive load (clutter, unclear hierarchies, ambiguous icons) allows users to focus on accomplishing their primary goal.',
        topic: 'Cognitive Psychology'
      },
      {
        id: 'qq-ui-4',
        question: 'Why should destructive operations (such as deleting an account or project) require an intentional friction step?',
        codeSnippet: null,
        options: ['To increase user engagement metrics', 'To prevent irreversible user errors and slips by introducing an explicit confirmation dialog or typed phrase', 'To allow the server to recharge its cache', 'To conform to mobile viewport standards'],
        correctOptionIndex: 1,
        explanation: 'Friction patterns protect users from accidental taps, especially for irreversible data loss actions.',
        topic: 'Error Prevention'
      },
      {
        id: 'qq-ui-5',
        question: 'What is a "Skeleton Screen" in modern responsive web applications?',
        codeSnippet: null,
        options: ['A dark theme mode using only white borders', 'A placeholder layout wireframe that mimics content geometry while data loads, reducing perceived wait time', 'A diagnostic tool for CSS grid errors', 'An HTML canvas game engine'],
        correctOptionIndex: 1,
        explanation: 'Skeleton screens provide visual continuity and communicate the arriving page structure, feeling significantly faster than generic spinner wheels.',
        topic: 'Perceived Performance'
      }
    ]
  },
  {
    quiz: {
      id: 'quiz-apt-011',
      title: 'Aptitude, Mathematical & Logical Heuristics',
      slug: 'aptitude-mathematical-logical-heuristics',
      description: 'Strengthen quantitative reasoning, combinatorics, series deduction, and critical problem solving.',
      category: 'Aptitude & Reasoning',
      difficulty: 'INTERMEDIATE',
      timeLimitMinutes: 10,
      xpReward: 85,
      isWeeklySpecial: false,
      startsAt: null,
      expiresAt: null,
      createdAt: now
    },
    questions: [
      {
        id: 'qq-apt-1',
        question: 'Find the next number in the series: 3, 7, 15, 31, 63, ?',
        codeSnippet: null,
        options: ['95', '127', '125', '112'],
        correctOptionIndex: 1,
        explanation: 'Each term follows the rule: next = (current * 2) + 1. (63 * 2) + 1 = 127.',
        topic: 'Number Series'
      },
      {
        id: 'qq-apt-2',
        question: 'A bag contains 5 red balls and 3 blue balls. If two balls are drawn at random without replacement, what is the probability that both are red?',
        codeSnippet: null,
        options: ['5/14', '25/64', '5/8', '15/56'],
        correctOptionIndex: 0,
        explanation: 'Probability = (5/8) * (4/7) = 20 / 56 = 5 / 14.',
        topic: 'Probability'
      },
      {
        id: 'qq-apt-3',
        question: 'If 8 developers can build a web application in 15 days, how many days will 12 developers take working at the same pace?',
        codeSnippet: null,
        options: ['10 days', '12 days', '8 days', '11.5 days'],
        correctOptionIndex: 0,
        explanation: 'Total developer-days = 8 * 15 = 120. Days for 12 developers = 120 / 12 = 10 days.',
        topic: 'Work & Time'
      },
      {
        id: 'qq-apt-4',
        question: 'In how many distinct ways can the letters of the word "SYSTEM" be arranged?',
        codeSnippet: null,
        options: ['720', '360', '120', '240'],
        correctOptionIndex: 1,
        explanation: 'SYSTEM has 6 letters with S repeated twice. Total permutations = 6! / 2! = 720 / 2 = 360.',
        topic: 'Permutations & Combinations'
      },
      {
        id: 'qq-apt-5',
        question: 'At what angle do the hands of a clock meet at 3:30?',
        codeSnippet: null,
        options: ['90 degrees', '75 degrees', '85 degrees', '60 degrees'],
        correctOptionIndex: 1,
        explanation: 'Angle = |(30 * hours) - (5.5 * minutes)| = |(30 * 3) - (5.5 * 30)| = |90 - 165| = 75 degrees.',
        topic: 'Clock & Angles'
      }
    ]
  },
  {
    quiz: {
      id: 'quiz-devops-012',
      title: 'DevOps, Containers, CI/CD & Linux Internals',
      slug: 'devops-containers-cicd-linux-internals',
      description: 'Master Docker namespaces, Linux file permissions, TLS handshakes, and CI/CD pipelines.',
      category: 'DevOps & Systems',
      difficulty: 'INTERMEDIATE',
      timeLimitMinutes: 10,
      xpReward: 90,
      isWeeklySpecial: true,
      startsAt: null,
      expiresAt: null,
      createdAt: now
    },
    questions: [
      {
        id: 'qq-devops-1',
        question: 'Which underlying Linux kernel features provide isolation and resource limits for Docker containers?',
        codeSnippet: null,
        options: ['Linux Namespaces (isolation) and cgroups (resource limits)', 'KVM hypervisor and QEMU hardware emulation', 'Systemd unit files and crontab', 'Chroot alone'],
        correctOptionIndex: 0,
        explanation: 'Namespaces isolate process trees (pid), networking (net), mounts (mnt), and users; Control Groups (cgroups) meter and constrain CPU, RAM, and I/O usage.',
        topic: 'Container Internals'
      },
      {
        id: 'qq-devops-2',
        question: 'What does the octal permission 755 mean on a Linux executable script?',
        codeSnippet: 'chmod 755 deploy.sh',
        options: ['Owner: Read/Write/Execute (rwx); Group & Others: Read/Execute (r-x)', 'Everyone has full read/write/execute permissions', 'Only root can run the file', 'Owner: Read only; Everyone else: Execute'],
        correctOptionIndex: 0,
        explanation: '7 = 4+2+1 (rwx) for owner; 5 = 4+0+1 (r-x) for group; 5 = 4+0+1 (r-x) for others.',
        topic: 'Linux Permissions'
      },
      {
        id: 'qq-devops-3',
        question: 'In a standard TLS 1.3 handshake, how many round trips (RTT) are required before application data can be sent?',
        codeSnippet: null,
        options: ['1-RTT (or 0-RTT on resumption)', '2-RTT', '3-RTT', '0-RTT always'],
        correctOptionIndex: 0,
        explanation: 'TLS 1.3 combines key exchange (ECDHE) into the initial ClientHello, cutting connection latency down to 1-RTT for new connections and 0-RTT for resumed sessions.',
        topic: 'Networking & TLS'
      },
      {
        id: 'qq-devops-4',
        question: 'What is a "Blue-Green Deployment" strategy?',
        codeSnippet: null,
        options: ['Deploying code only on alternating days of the week', 'Running two identical production environments (Blue and Green) and shifting load balancer router traffic instantly once verification passes', 'Deploying only to 5% of users at a time', 'A rollback strategy that restores database dumps'],
        correctOptionIndex: 1,
        explanation: 'Blue is live while Green is updated and smoke-tested. The router switches traffic to Green instantly, achieving zero downtime with trivial rollback.',
        topic: 'Deployment Strategies'
      },
      {
        id: 'qq-devops-5',
        question: 'What happens to files written inside a container writable layer when the container is deleted without volumes?',
        codeSnippet: null,
        options: ['They are permanently lost with the container deletion', 'They are saved to /var/log/docker automatically', 'They persist in the base Docker image', 'They move to the host root directory'],
        correctOptionIndex: 0,
        explanation: 'Containers have ephemeral writable storage layers. State must be mounted via Docker volumes or bind mounts to survive container lifecycle destruction.',
        topic: 'Docker Storage'
      }
    ]
  }
];

// Flatten quizzes and quizQuestions
const allQuizzes = quizzesData.map(d => d.quiz);
const allQuestions = quizzesData.flatMap(d => d.questions.map(q => ({
  id: q.id,
  quizId: d.quiz.id,
  question: q.question,
  codeSnippet: q.codeSnippet,
  options: q.options,
  correctOptionIndex: q.correctOptionIndex,
  explanation: q.explanation,
  topic: q.topic
})));

// Update database
db.dailyChallenges = dailyChallenges;
db.quizzes = allQuizzes;
db.quizQuestions = allQuestions;

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');

console.log('Successfully seeded Quests & Arena library:');
console.log(`- ${dailyChallenges.length} Daily Challenges across 12 categories`);
console.log(`- ${allQuizzes.length} Arena Quizzes across 12 technical categories`);
console.log(`- ${allQuestions.length} Distinct, verified technical quiz questions`);
