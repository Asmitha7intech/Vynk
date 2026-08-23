const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content.trim() + '\n', 'utf8');
  console.log('Created:', filePath);
}

const root = path.resolve(__dirname, '..');

writeFile(path.join(root, 'packages/database/prisma/seed.ts'), `
import { PrismaClient, Role, SkillProficiency, VynkStatus, PostType, CrewRole, QuestDifficulty, MentorshipStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting VYNK database seed...');

  // Clean existing tables in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.xPTransaction.deleteMany();
  await prisma.quizAnswer?.deleteMany?.().catch(() => {});
  await prisma.quizAttempt.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.dailyChallengeAttempt.deleteMany();
  await prisma.dailyChallenge.deleteMany();
  await prisma.mentorshipRequest.deleteMany();
  await prisma.mentorProfile.deleteMany();
  await prisma.teamInvitation.deleteMany();
  await prisma.teamAgreement.deleteMany();
  await prisma.teamRequirement.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.projectMilestone.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.savedPost.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.project.deleteMany();
  await prisma.team.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.userInterest.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('vynkPass123!', 10);

  // 1. Create Students
  const alex = await prisma.user.create({
    data: {
      email: 'alex.chen@mit.edu',
      username: 'alexchen',
      displayName: 'Alex Chen',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200',
      headline: 'Full-Stack Craftsman & Distributed Systems Geek',
      bio: 'Building scalable realtime systems. Hackathon enthusiast (3x winner). Searching for an ML specialist for the upcoming Global AI Hackathon!',
      college: 'MIT',
      department: 'Computer Science',
      graduationYear: 2026,
      role: Role.STUDENT,
      xp: 1450,
      level: 6,
      reputationScore: 480,
      streakDays: 14,
      githubUrl: 'https://github.com/alexchen',
      linkedinUrl: 'https://linkedin.com/in/alexchen',
      portfolioUrl: 'https://alexchen.dev',
      isAvailableForCrews: true,
      skills: {
        create: [
          { skillName: 'React / Next.js', category: 'Frontend', proficiency: SkillProficiency.EXPERT, yearsOfExperience: 3.5, isVerified: true, evidenceUrl: 'https://github.com/alexchen/next-realtime' },
          { skillName: 'TypeScript', category: 'Frontend', proficiency: SkillProficiency.EXPERT, yearsOfExperience: 3, isVerified: true },
          { skillName: 'Fastify / Node.js', category: 'Backend', proficiency: SkillProficiency.ADVANCED, yearsOfExperience: 3, isVerified: true },
          { skillName: 'PostgreSQL / Prisma', category: 'Database', proficiency: SkillProficiency.ADVANCED, yearsOfExperience: 2.5, isVerified: true },
          { skillName: 'Redis PubSub', category: 'Backend', proficiency: SkillProficiency.INTERMEDIATE, yearsOfExperience: 1.5, isVerified: false }
        ]
      },
      interests: {
        create: [
          { name: 'Distributed Systems', category: 'Technical' },
          { name: 'AI Agents', category: 'Technical' },
          { name: 'Hackathons', category: 'Activity' },
          { name: 'Open Source', category: 'Activity' }
        ]
      }
    }
  });

  const maya = await prisma.user.create({
    data: {
      email: 'maya.lin@stanford.edu',
      username: 'mayalin_ai',
      displayName: 'Maya Lin',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
      bannerUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200',
      headline: 'ML Researcher | Vision & Multimodal LLMs',
      bio: 'Junior studying AI/ML at Stanford. Working on multimodal embeddings and on-device vision models. Love turning papers into production code.',
      college: 'Stanford University',
      department: 'AI & Data Science',
      graduationYear: 2027,
      role: Role.STUDENT,
      xp: 1820,
      level: 7,
      reputationScore: 590,
      streakDays: 21,
      githubUrl: 'https://github.com/mayalin-ai',
      linkedinUrl: 'https://linkedin.com/in/mayalin-ai',
      isAvailableForCrews: true,
      skills: {
        create: [
          { skillName: 'Python', category: 'Backend', proficiency: SkillProficiency.EXPERT, yearsOfExperience: 4, isVerified: true },
          { skillName: 'PyTorch', category: 'AI/ML', proficiency: SkillProficiency.EXPERT, yearsOfExperience: 3, isVerified: true, evidenceUrl: 'https://github.com/mayalin-ai/vision-transformer' },
          { skillName: 'pgvector / Embeddings', category: 'Database', proficiency: SkillProficiency.ADVANCED, yearsOfExperience: 2, isVerified: true },
          { skillName: 'Hugging Face', category: 'AI/ML', proficiency: SkillProficiency.ADVANCED, yearsOfExperience: 2.5, isVerified: true },
          { skillName: 'FastAPI', category: 'Backend', proficiency: SkillProficiency.INTERMEDIATE, yearsOfExperience: 1.5, isVerified: true }
        ]
      },
      interests: {
        create: [
          { name: 'Computer Vision', category: 'Technical' },
          { name: 'Multimodal AI', category: 'Technical' },
          { name: 'Healthcare Tech', category: 'Domain' },
          { name: 'Research Papers', category: 'Activity' }
        ]
      }
    }
  });

  const devon = await prisma.user.create({
    data: {
      email: 'devon.vance@berkeley.edu',
      username: 'devondesign',
      displayName: 'Devon Vance',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      bannerUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=1200',
      headline: 'Product Designer & Design Systems Enthusiast',
      bio: 'Bridging design and code. Figma wizard obsessed with micro-interactions, dark mode aesthetics, and zero-latency user interfaces.',
      college: 'UC Berkeley',
      department: 'Human-Computer Interaction / Design',
      graduationYear: 2026,
      role: Role.STUDENT,
      xp: 980,
      level: 4,
      reputationScore: 320,
      streakDays: 8,
      portfolioUrl: 'https://devonvance.design',
      isAvailableForCrews: true,
      skills: {
        create: [
          { skillName: 'Figma / UI Design', category: 'Design', proficiency: SkillProficiency.EXPERT, yearsOfExperience: 4, isVerified: true },
          { skillName: 'Tailwind CSS', category: 'Frontend', proficiency: SkillProficiency.ADVANCED, yearsOfExperience: 3, isVerified: true },
          { skillName: 'Framer Motion', category: 'Frontend', proficiency: SkillProficiency.ADVANCED, yearsOfExperience: 2, isVerified: true },
          { skillName: 'User Research', category: 'Product', proficiency: SkillProficiency.INTERMEDIATE, yearsOfExperience: 2, isVerified: false }
        ]
      },
      interests: {
        create: [
          { name: 'Design Systems', category: 'Design' },
          { name: 'UX Engineering', category: 'Technical' },
          { name: 'Accessibility', category: 'Product' }
        ]
      }
    }
  });

  const priya = await prisma.user.create({
    data: {
      email: 'priya.sharma@cmu.edu',
      username: 'priyacodes',
      displayName: 'Priya Sharma',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
      bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200',
      headline: 'Cybersecurity & Blockchain Security Researcher',
      bio: 'Breaking protocols to make them unbreakable. CTF captain, smart contract auditing, zero-knowledge proofs.',
      college: 'Carnegie Mellon University',
      department: 'Information Security',
      graduationYear: 2026,
      role: Role.STUDENT,
      xp: 1650,
      level: 6,
      reputationScore: 510,
      streakDays: 19,
      githubUrl: 'https://github.com/priyasharma-sec',
      isAvailableForCrews: true,
      skills: {
        create: [
          { skillName: 'Rust', category: 'Backend', proficiency: SkillProficiency.ADVANCED, yearsOfExperience: 2.5, isVerified: true },
          { skillName: 'Solidity / ZK-Proofs', category: 'Security', proficiency: SkillProficiency.ADVANCED, yearsOfExperience: 2, isVerified: true },
          { skillName: 'C / C++', category: 'Systems', proficiency: SkillProficiency.ADVANCED, yearsOfExperience: 3, isVerified: true },
          { skillName: 'Cryptography', category: 'Security', proficiency: SkillProficiency.ADVANCED, yearsOfExperience: 3, isVerified: true }
        ]
      },
      interests: {
        create: [
          { name: 'Zero-Knowledge Proofs', category: 'Technical' },
          { name: 'CTF Competitions', category: 'Activity' },
          { name: 'AppSec', category: 'Security' }
        ]
      }
    }
  });

  // 2. Create Mentors
  const drArun = await prisma.user.create({
    data: {
      email: 'arun.kumar@google.com',
      username: 'dr_arun_ml',
      displayName: 'Dr. Arun Kumar',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
      bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200',
      headline: 'Staff ML Engineer @ Google DeepMind | AI Mentor',
      bio: '10+ years scaling neural architectures and foundation models. Passionate about helping students transition from toy models to production systems.',
      college: 'Stanford Alumni',
      department: 'Computer Science & AI',
      role: Role.MENTOR,
      xp: 4500,
      level: 9,
      reputationScore: 990,
      streakDays: 45,
      isAvailableForMentorship: true,
      mentorProfile: {
        create: {
          headline: 'Staff ML Engineer @ Google DeepMind',
          companyOrCollege: 'Google DeepMind',
          yearsOfExperience: 10,
          about: 'I mentor motivated students building AI/ML applications, preparing for technical interviews, or publishing high-impact research papers.',
          expertiseCategories: ['AI/ML', 'Computer Vision', 'MLOps & Deployment', 'Career & Research Strategy'],
          skills: ['PyTorch', 'TensorFlow', 'Distributed Training', 'LLM Fine-Tuning', 'System Design'],
          weeklyHoursAvailable: 4,
          maxMentees: 5,
          isAcceptingRequests: true,
          totalMenteesHelped: 42,
          rating: 4.95
        }
      }
    }
  });

  const sarahFounder = await prisma.user.create({
    data: {
      email: 'sarah@hyperbuild.io',
      username: 'sarah_builds',
      displayName: 'Sarah Jenkins',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
      headline: 'Founder @ HyperBuild (YC W24) | ex-Stripe Tech Lead',
      bio: 'Built and scaled developer infrastructure to millions of requests/sec. Guiding student founders on MVP architecture and hackathon pitching.',
      college: 'MIT Alumni',
      department: 'EECS',
      role: Role.MENTOR,
      xp: 3800,
      level: 8,
      reputationScore: 920,
      isAvailableForMentorship: true,
      mentorProfile: {
        create: {
          headline: 'YC Founder & ex-Stripe Principal Architect',
          companyOrCollege: 'HyperBuild (YC W24)',
          yearsOfExperience: 8,
          about: 'Focusing on developer tools, backend scalability, hackathon execution, and early-stage startup mechanics.',
          expertiseCategories: ['Startups & MVPs', 'Full-Stack Scalability', 'Hackathon Strategy', 'Product Management'],
          skills: ['TypeScript', 'Fastify / Express', 'Postgres Optimization', 'Cloudflare Workers', 'Pitching'],
          weeklyHoursAvailable: 3,
          maxMentees: 4,
          isAcceptingRequests: true,
          totalMenteesHelped: 29,
          rating: 5.0
        }
      }
    }
  });

  // 3. Create Vynk Connections (Social Graph)
  await prisma.connection.create({
    data: {
      senderId: alex.id,
      receiverId: maya.id,
      status: VynkStatus.ACCEPTED
    }
  });

  await prisma.connection.create({
    data: {
      senderId: devon.id,
      receiverId: alex.id,
      status: VynkStatus.ACCEPTED
    }
  });

  await prisma.connection.create({
    data: {
      senderId: priya.id,
      receiverId: alex.id,
      status: VynkStatus.PENDING
    }
  });

  // 4. Create Voyages (Project Portfolios)
  const neuroVision = await prisma.project.create({
    data: {
      title: 'NeuroVision: Real-Time Edge Video Analytics',
      slug: 'neurovision-ai',
      tagline: 'Sub-15ms edge inference pipeline for clinical surgery assistance.',
      description: 'NeuroVision combines lightweight custom YOLOv9 models with WebAssembly and WebRTC to deliver real-time surgical tool tracking directly in the operating theater browser without cloud latency.',
      coverImageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1000',
      technologies: ['PyTorch', 'WebAssembly', 'WebRTC', 'React', 'FastAPI', 'pgvector'],
      githubUrl: 'https://github.com/mayalin-ai/neurovision-edge',
      demoUrl: 'https://neurovision-demo.vercel.app',
      status: 'HACKATHON_WINNER',
      xpRewarded: 500,
      likesCount: 142,
      viewsCount: 1890,
      creatorId: maya.id,
      members: {
        create: [
          { userId: maya.id, role: 'ML & Model Architecture', contributions: 'Custom YOLO model quantisation and tensor inference engine.' },
          { userId: alex.id, role: 'Full-Stack & WebRTC Pipeline', contributions: 'Built the zero-latency WebRTC streaming server in Node & WebSockets.' }
        ]
      },
      milestones: {
        create: [
          { title: 'Model Quantization (INT8)', description: 'Quantized PyTorch weights for on-device inference.', isCompleted: true },
          { title: 'WebAssembly Pipeline', description: 'Ported C++ inference runtime to browser wasm.', isCompleted: true },
          { title: 'Clinical Trial Simulation', description: 'Tested against 500+ annotated surgical video sequences.', isCompleted: false }
        ]
      }
    }
  });

  // 5. Create Crews (Teams) & Team Agreements
  const aiCrew = await prisma.team.create({
    data: {
      name: 'NeuroVision AI Hack Squad',
      slug: 'neurovision-hack-squad',
      tagline: 'Competing in the Global HealthTech Hackathon 2026',
      description: 'We are building an on-device multimodal diagnostic assistant for emergency healthcare workers. Looking for a talented UI/UX engineer and a Backend specialist to complete our 4-person crew!',
      category: 'Healthcare & AI',
      targetHackathon: 'MIT Grand Hack 2026',
      maxMembers: 4,
      commitmentHoursPerWeek: 12,
      captainId: maya.id,
      isRecruiting: true,
      members: {
        create: [
          { userId: maya.id, role: CrewRole.CAPTAIN, assignedRoleName: 'ML Lead & Model Architect' },
          { userId: alex.id, role: CrewRole.LEAD, assignedRoleName: 'Distributed Systems & Backend' }
        ]
      },
      requirements: {
        create: [
          {
            roleName: 'UI/UX & Design Systems Lead',
            requiredSkills: ['Figma / UI Design', 'Tailwind CSS', 'Framer Motion'],
            description: 'Design and implement the high-contrast emergency room dashboard with accessible visual hierarchy.',
            priority: 'CRITICAL',
            isFilled: false
          },
          {
            roleName: 'Mobile & Hardware IoT Specialist',
            requiredSkills: ['React Native', 'BLE / WebBluetooth', 'C++'],
            description: 'Connect wearable vital sensors with our edge inference engine.',
            priority: 'HIGH',
            isFilled: false
          }
        ]
      },
      agreement: {
        create: {
          commitmentDescription: 'Team members commit to active communication and delivery of their agreed modules before the demo date.',
          weeklyHours: 12,
          primaryChannel: 'VYNK Crew Messenger',
          decisionProtocol: 'CONSENSUS',
          codeStandardRules: ['TypeScript strict mode', 'PR review before merge', 'Clean commit messages'],
          meetingSchedule: 'Monday & Thursday 8:00 PM EST',
          acceptedUserIds: [maya.id, alex.id]
        }
      }
    }
  });

  // 6. Create Daily Technical Challenges (Quests)
  const challenge1 = await prisma.dailyChallenge.create({
    data: {
      title: 'Python Slicing & Memory References',
      category: 'Python',
      difficulty: QuestDifficulty.INTERMEDIATE,
      snippet: `x = [1, 2, 3, 4]
y = x[::-1]
y[0] = 99
print(x[3])`,
      question: 'What is the exact output of this Python snippet?',
      options: ['99', '4', 'IndexError', 'None'],
      correctOptionIndex: 1,
      explanation: 'Slicing a list in Python (e.g. x[::-1]) creates a brand-new shallow copy. Modifying y[0] does not mutate original list x, so x[3] remains 4.',
      xpAward: 20,
      activeDate: '2026-08-22'
    }
  });

  // 7. Create Weekly Timed Quizzes
  const quiz1 = await prisma.quiz.create({
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

  const quiz2 = await prisma.quiz.create({
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

  // 8. Create Badges (Bounties)
  const badge1 = await prisma.badge.create({
    data: {
      code: 'FIRST_VOYAGE',
      title: 'First Voyage',
      description: 'Showcased and published your first technical project portfolio.',
      iconName: 'Rocket',
      category: 'COLLABORATION',
      xpThreshold: 250
    }
  });

  const badge2 = await prisma.badge.create({
    data: {
      code: 'CREW_CAPTAIN',
      title: 'Crew Captain',
      description: 'Formed a collaborative crew and published a verified Team Agreement.',
      iconName: 'ShieldAlert',
      category: 'COLLABORATION',
      xpThreshold: 500
    }
  });

  const badge3 = await prisma.badge.create({
    data: {
      code: 'QUIZ_MASTER',
      title: 'Quiz Champion',
      description: 'Achieved a top 5% score in the weekly technical challenge.',
      iconName: 'Trophy',
      category: 'LEARNING',
      xpThreshold: 750
    }
  });

  const badge4 = await prisma.badge.create({
    data: {
      code: 'STREAK_TITAN',
      title: 'Streak Titan',
      description: 'Maintained a 14+ day continuous learning and challenge streak.',
      iconName: 'Flame',
      category: 'LEARNING',
      xpThreshold: 1000
    }
  });

  // Assign initial badges
  await prisma.userBadge.create({ data: { badgeId: badge1.id, userId: alex.id } });
  await prisma.userBadge.create({ data: { badgeId: badge1.id, userId: maya.id } });
  await prisma.userBadge.create({ data: { badgeId: badge2.id, userId: maya.id } });
  await prisma.userBadge.create({ data: { badgeId: badge4.id, userId: alex.id } });
  await prisma.userBadge.create({ data: { badgeId: badge4.id, userId: maya.id } });

  // 9. Create Social Feed Posts
  const post1 = await prisma.post.create({
    data: {
      authorId: maya.id,
      type: PostType.VOYAGE_LAUNCH,
      title: '🚀 Launching NeuroVision — Edge Video Analytics for Surgery',
      content: 'Super thrilled to share what Alex Chen and I have been building over the past 3 weeks! We managed to run sub-15ms object detection directly on client hardware with WebAssembly. Check out our project and live demo!',
      tags: ['AI', 'ComputerVision', 'PyTorch', 'WebAssembly', 'OpenSource'],
      voyageId: neuroVision.id,
      likesCount: 38,
      commentsCount: 5,
      sharesCount: 12
    }
  });

  const post2 = await prisma.post.create({
    data: {
      authorId: devon.id,
      type: PostType.LEARNING_NOTE,
      title: '🎨 Why micro-interactions matter more than flashy animations in developer tools',
      content: 'When designing for engineers, clarity beats decoration every single time. A 150ms spring transition with instant keyboard shortcuts will make users feel 10x faster than a 600ms bezier curve. What are your favorite UI details in modern tools?',
      tags: ['Design', 'UX', 'Frontend', 'DeveloperExperience'],
      likesCount: 54,
      commentsCount: 8,
      sharesCount: 4
    }
  });

  const post3 = await prisma.post.create({
    data: {
      authorId: drArun.id,
      type: PostType.OPPORTUNITY,
      title: '💡 Research Fellowship & Mentorship: Multimodal Systems',
      content: 'Opening up 2 new mentorship slots for undergraduate and master students working on foundation model quantization and efficient inference. If you have an active Voyage in PyTorch or Rust, send a mentorship request with your project details!',
      tags: ['Mentorship', 'DeepLearning', 'Research', 'Opportunity'],
      likesCount: 112,
      commentsCount: 14,
      sharesCount: 29
    }
  });

  console.log('✅ Seed finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`);

console.log('Database seed script created successfully!');
