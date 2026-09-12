const fs = require('fs');
const path = require('path');

// 1. Create packages/database/src/local-store.ts
const localStorePath = path.resolve(__dirname, '../packages/database/src/local-store.ts');
const localStoreContent = `import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'vynk_db.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export interface LocalDbState {
  users: any[];
  userSkills: any[];
  userInterests: any[];
  connections: any[];
  follows: any[];
  posts: any[];
  comments: any[];
  reactions: any[];
  savedPosts: any[];
  teams: any[];
  teamMembers: any[];
  teamRequirements: any[];
  teamAgreements: any[];
  teamInvitations: any[];
  projects: any[];
  projectMembers: any[];
  projectMilestones: any[];
  dailyChallenges: any[];
  dailyChallengeAttempts: any[];
  quizzes: any[];
  quizQuestions: any[];
  quizAttempts: any[];
  mentorProfiles: any[];
  mentorshipRequests: any[];
  badges: any[];
  userBadges: any[];
  xpTransactions: any[];
  notifications: any[];
  messages: any[];
  conversations: any[];
  conversationMembers: any[];
  institutions: any[];
  departments: any[];
  studentVerifications: any[];
  analyticsEvents: any[];
}

const defaultPasswordHash = bcrypt.hashSync('vynkPass123!', 10);

function createInitialState(): LocalDbState {
  const users = [
    {
      id: 'usr_alexchen_001',
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
      role: 'STUDENT',
      xp: 1450,
      level: 6,
      reputationScore: 480,
      streakDays: 14,
      githubUrl: 'https://github.com/alexchen',
      linkedinUrl: 'https://linkedin.com/in/alexchen',
      portfolioUrl: 'https://alexchen.dev',
      isAvailableForCrews: true,
      isAmbassador: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'usr_mayalin_002',
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
      role: 'STUDENT',
      xp: 1820,
      level: 7,
      reputationScore: 590,
      streakDays: 21,
      githubUrl: 'https://github.com/mayalin-ai',
      linkedinUrl: 'https://linkedin.com/in/mayalin-ai',
      isAvailableForCrews: true,
      isAmbassador: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'usr_devon_003',
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
      role: 'STUDENT',
      xp: 980,
      level: 4,
      reputationScore: 320,
      streakDays: 8,
      portfolioUrl: 'https://devonvance.design',
      isAvailableForCrews: true,
      isAmbassador: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'usr_elena_004',
      email: 'elena.rostova@cmu.edu',
      username: 'elenarobotics',
      displayName: 'Elena Rostova',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
      bannerUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200',
      headline: 'Robotics & Embedded Systems Engineer',
      bio: 'Working on ROS2 autonomous rovers and computer vision at the edge. Building hardware-accelerated algorithms in Rust & C++.',
      college: 'Carnegie Mellon University',
      department: 'Robotics & Mechanical Engineering',
      graduationYear: 2026,
      role: 'STUDENT',
      xp: 1320,
      level: 5,
      reputationScore: 410,
      streakDays: 12,
      githubUrl: 'https://github.com/elena-robotics',
      isAvailableForCrews: true,
      isAmbassador: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'usr_marcus_005',
      email: 'marcus.vance@alum.mit.edu',
      username: 'marcus_vance',
      displayName: 'Marcus Vance',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
      bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200',
      headline: 'Staff AI Systems Engineer @ Google | MIT Alum',
      bio: 'MIT CS class of 2021. 5+ years building large-scale distributed training infrastructure. Offering mentorship on system design, distributed systems, and tech careers.',
      college: 'MIT',
      department: 'Computer Science (Alumni)',
      graduationYear: 2021,
      role: 'MENTOR',
      xp: 4500,
      level: 10,
      reputationScore: 920,
      streakDays: 45,
      linkedinUrl: 'https://linkedin.com/in/marcus-vance',
      isAvailableForCrews: false,
      isAmbassador: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  const userSkills = [
    { id: 'usk_1', userId: 'usr_alexchen_001', skillName: 'React / Next.js', category: 'Frontend', proficiency: 'EXPERT', yearsOfExperience: 3.5, isVerified: true, evidenceUrl: 'https://github.com/alexchen/next-realtime' },
    { id: 'usk_2', userId: 'usr_alexchen_001', skillName: 'TypeScript', category: 'Frontend', proficiency: 'EXPERT', yearsOfExperience: 3, isVerified: true },
    { id: 'usk_3', userId: 'usr_alexchen_001', skillName: 'Fastify / Node.js', category: 'Backend', proficiency: 'ADVANCED', yearsOfExperience: 3, isVerified: true },
    { id: 'usk_4', userId: 'usr_alexchen_001', skillName: 'PostgreSQL / Prisma', category: 'Database', proficiency: 'ADVANCED', yearsOfExperience: 2.5, isVerified: true },
    { id: 'usk_5', userId: 'usr_mayalin_002', skillName: 'Python', category: 'Backend', proficiency: 'EXPERT', yearsOfExperience: 4, isVerified: true },
    { id: 'usk_6', userId: 'usr_mayalin_002', skillName: 'PyTorch', category: 'AI/ML', proficiency: 'EXPERT', yearsOfExperience: 3, isVerified: true, evidenceUrl: 'https://github.com/mayalin-ai/vision-transformer' },
    { id: 'usk_7', userId: 'usr_mayalin_002', skillName: 'pgvector / Embeddings', category: 'Database', proficiency: 'ADVANCED', yearsOfExperience: 2, isVerified: true },
    { id: 'usk_8', userId: 'usr_devon_003', skillName: 'Figma / UI Design', category: 'Design', proficiency: 'EXPERT', yearsOfExperience: 4, isVerified: true },
    { id: 'usk_9', userId: 'usr_devon_003', skillName: 'Tailwind CSS', category: 'Frontend', proficiency: 'ADVANCED', yearsOfExperience: 3, isVerified: true },
    { id: 'usk_10', userId: 'usr_elena_004', skillName: 'ROS2 / Robotics', category: 'Hardware', proficiency: 'EXPERT', yearsOfExperience: 3, isVerified: true },
    { id: 'usk_11', userId: 'usr_elena_004', skillName: 'Rust / C++', category: 'Systems', proficiency: 'ADVANCED', yearsOfExperience: 2.5, isVerified: true },
  ];

  const userInterests = [
    { id: 'uint_1', userId: 'usr_alexchen_001', name: 'Distributed Systems', category: 'Technical' },
    { id: 'uint_2', userId: 'usr_alexchen_001', name: 'AI Agents', category: 'Technical' },
    { id: 'uint_3', userId: 'usr_alexchen_001', name: 'Hackathons', category: 'Activity' },
    { id: 'uint_4', userId: 'usr_mayalin_002', name: 'Computer Vision', category: 'Technical' },
    { id: 'uint_5', userId: 'usr_mayalin_002', name: 'Multimodal AI', category: 'Technical' },
    { id: 'uint_6', userId: 'usr_devon_003', name: 'Design Systems', category: 'Design' },
    { id: 'uint_7', userId: 'usr_elena_004', name: 'Autonomous Rovers', category: 'Hardware' },
  ];

  const badges = [
    { id: 'bdg_1', name: 'First Voyage', code: 'FIRST_VOYAGE', description: 'Shipped your first verified project portfolio on VYNK.', iconUrl: '🚀', tier: 'BRONZE', xpReward: 100 },
    { id: 'bdg_2', name: 'Crew Captain', code: 'CREW_CAPTAIN', description: 'Founded a squad and recruited cross-department talent.', iconUrl: '👑', tier: 'GOLD', xpReward: 250 },
    { id: 'bdg_3', name: 'Streak Titan (14 Days)', code: 'STREAK_TITAN', description: 'Maintained a 14-day consecutive builder streak.', iconUrl: '🔥', tier: 'SILVER', xpReward: 200 },
  ];

  const userBadges = [
    { id: 'ub_1', userId: 'usr_alexchen_001', badgeId: 'bdg_1', unlockedAt: new Date().toISOString() },
    { id: 'ub_2', userId: 'usr_alexchen_001', badgeId: 'bdg_2', unlockedAt: new Date().toISOString() },
    { id: 'ub_3', userId: 'usr_mayalin_002', badgeId: 'bdg_1', unlockedAt: new Date().toISOString() },
    { id: 'ub_4', userId: 'usr_mayalin_002', badgeId: 'bdg_3', unlockedAt: new Date().toISOString() },
  ];

  const projects = [
    {
      id: 'voy_nexus_001',
      title: 'NexusAI — Multimodal Campus Assistant',
      tagline: 'Autonomous AI assistant that indexes campus course lectures and generates interactive 3D study mind maps.',
      description: 'Built during the MIT Spring Hackathon. Uses vector embeddings, Whisper for speech-to-text, and WebGL for real-time 3D knowledge graphs.',
      category: 'AI_ML',
      status: 'SHIPPED',
      demoUrl: 'https://nexusai.demo.vynk.app',
      repoUrl: 'https://github.com/alexchen/nexus-ai',
      techStack: ['Next.js', 'PyTorch', 'FastAPI', 'pgvector', 'Three.js', 'Tailwind CSS'],
      likesCount: 68,
      viewsCount: 420,
      featured: true,
      ownerId: 'usr_alexchen_001',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'voy_pulse_002',
      title: 'PulseSense — Wearable Vital Analytics',
      tagline: 'Edge IoT wearable measuring student stress, posture, and HRV during hackathons.',
      description: 'Custom PCB with ESP32-S3, real-time Bluetooth Low Energy stream to a high-speed React dashboard.',
      category: 'HARDWARE_IOT',
      status: 'SHIPPED',
      demoUrl: 'https://pulsesense.vynk.app',
      repoUrl: 'https://github.com/elena-robotics/pulse-sense',
      techStack: ['C++', 'FreeRTOS', 'ESP32', 'React', 'Tailwind CSS', 'Web Bluetooth'],
      likesCount: 47,
      viewsCount: 290,
      featured: true,
      ownerId: 'usr_elena_004',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  const teams = [
    {
      id: 'crew_lumina_001',
      name: 'Lumina Autonomous Lab',
      slug: 'lumina-autonomous-lab',
      tagline: 'Building zero-latency vision navigation for autonomous campus delivery rovers.',
      description: 'Targeting the Global University Rover Challenge 2026. We have the chassis built and need an ML researcher and a UI lead.',
      category: 'ROBOTICS_AI',
      targetHackathon: 'University Rover Challenge 2026',
      maxMembers: 5,
      commitmentHoursPerWeek: 12,
      captainId: 'usr_elena_004',
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  const teamRequirements = [
    { id: 'treq_1', teamId: 'crew_lumina_001', roleName: 'Lead Computer Vision Researcher', requiredSkills: ['PyTorch', 'Computer Vision', 'Python'], priority: 'HIGH' },
    { id: 'treq_2', teamId: 'crew_lumina_001', roleName: 'Mission Control UI / UX Designer', requiredSkills: ['Figma', 'React', 'Tailwind CSS'], priority: 'MEDIUM' },
  ];

  const teamMembers = [
    { id: 'tmem_1', teamId: 'crew_lumina_001', userId: 'usr_elena_004', role: 'CAPTAIN', assignedRoleName: 'Hardware & Systems Lead', isLead: true, joinedAt: new Date().toISOString() },
    { id: 'tmem_2', teamId: 'crew_lumina_001', userId: 'usr_alexchen_001', role: 'CONTRIBUTOR', assignedRoleName: 'Full-Stack Telemetry Engineer', isLead: false, joinedAt: new Date().toISOString() },
  ];

  const teamAgreements = [
    {
      id: 'tagr_1',
      teamId: 'crew_lumina_001',
      termsContent: 'Commitment to 10+ hrs/wk, weekly sprint standup every Tuesday 8pm EST, and open Apache-2.0 open-source release.',
      commitmentDescription: 'Active squad collaboration with weekly sprint checkins.',
      weeklyHours: 12,
      primaryChannel: 'VYNK Crew Messenger',
      decisionProtocol: 'CONSENSUS',
      codeStandardRules: ['TypeScript strict mode', 'PR review before merge'],
      meetingSchedule: 'Tuesday 8pm EST',
      signedBy: ['usr_elena_004', 'usr_alexchen_001'],
      acceptedUserIds: ['usr_elena_004', 'usr_alexchen_001'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  const posts = [
    {
      id: 'post_001',
      authorId: 'usr_alexchen_001',
      type: 'VOYAGE_LAUNCH',
      title: 'Just launched NexusAI on VYNK Voyages! 🚀',
      content: 'Excited to release NexusAI! It indexes course lectures using Whisper and generates real-time 3D knowledge graphs. Check out the demo and drop feedback!',
      mediaUrls: [],
      tags: ['ai', 'nextjs', 'voyage', 'opensource'],
      voyageId: 'voy_nexus_001',
      likesCount: 34,
      commentsCount: 6,
      sharesCount: 12,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'post_002',
      authorId: 'usr_mayalin_002',
      type: 'HACKATHON_DISPATCH',
      title: 'Looking for a Systems / Hardware teammate for Stanford AI Hackathon! 🧠⚙️',
      content: 'We are training an on-device quantization model for drone edge cameras. Need someone with Embedded C / Rust or ROS2 experience to interface with our PyTorch pipeline.',
      mediaUrls: [],
      tags: ['hackathon', 'crews', 'robotics', 'pytorch'],
      likesCount: 28,
      commentsCount: 4,
      sharesCount: 8,
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  const dailyChallenges = [
    {
      id: 'dc_001',
      date: new Date().toISOString().slice(0, 10),
      title: 'Optimizing PostgreSQL JSONB Query Indexing',
      codeSnippet: `// Which GIN index operator class provides optimal performance for JSONB containment (@>) queries?
CREATE INDEX idx_user_skills ON "User" USING gin (skills jsonb_path_ops);`,
      questionText: 'What is the key performance difference between default jsonb_ops and jsonb_path_ops in PostgreSQL GIN indexes?',
      options: [
        'jsonb_path_ops creates smaller indexes and is faster for @> containment queries',
        'jsonb_ops only supports boolean flags',
        'jsonb_path_ops does not support hash operations',
        'There is no performance difference between the two'
      ],
      correctOptionIndex: 0,
      explanation: 'jsonb_path_ops hashes each path and value into a single hash value, resulting in significantly smaller GIN indexes that execute containment (@>) queries faster than default jsonb_ops.',
      xpReward: 25,
      category: 'DATABASE',
      createdAt: new Date().toISOString(),
    }
  ];

  return {
    users,
    userSkills,
    userInterests,
    connections: [],
    follows: [],
    posts,
    comments: [],
    reactions: [],
    savedPosts: [],
    teams,
    teamMembers,
    teamRequirements,
    teamAgreements,
    teamInvitations: [],
    projects,
    projectMembers: [],
    projectMilestones: [],
    dailyChallenges,
    dailyChallengeAttempts: [],
    quizzes: [],
    quizQuestions: [],
    quizAttempts: [],
    mentorProfiles: [],
    mentorshipRequests: [],
    badges,
    userBadges,
    xpTransactions: [],
    notifications: [],
    messages: [],
    conversations: [],
    conversationMembers: [],
    institutions: [
      { id: 'inst_mit', name: 'Massachusetts Institute of Technology', domain: 'mit.edu', logoUrl: null, verified: true },
      { id: 'inst_stanford', name: 'Stanford University', domain: 'stanford.edu', logoUrl: null, verified: true },
      { id: 'inst_berkeley', name: 'UC Berkeley', domain: 'berkeley.edu', logoUrl: null, verified: true },
      { id: 'inst_cmu', name: 'Carnegie Mellon University', domain: 'cmu.edu', logoUrl: null, verified: true },
    ],
    departments: [
      { id: 'dept_cs', name: 'Computer Science', code: 'CS', institutionId: 'inst_mit' },
      { id: 'dept_ai', name: 'AI & Data Science', code: 'AI', institutionId: 'inst_stanford' },
      { id: 'dept_design', name: 'Design / HCI', code: 'DES', institutionId: 'inst_berkeley' },
      { id: 'dept_robotics', name: 'Robotics Engineering', code: 'ROB', institutionId: 'inst_cmu' },
    ],
    studentVerifications: [],
    analyticsEvents: [],
  };
}

class LocalStore {
  private state: LocalDbState;

  constructor() {
    ensureDataDir();
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.state = JSON.parse(raw);
      } catch {
        this.state = createInitialState();
        this.save();
      }
    } else {
      this.state = createInitialState();
      this.save();
    }
  }

  public save() {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), 'utf8');
  }

  public getState() {
    return this.state;
  }

  // Model accessors with Prisma-like API
  public get user() {
    return {
      findUnique: async ({ where, include }: any) => {
        const user = this.state.users.find(u => {
          if (where.id && u.id === where.id) return true;
          if (where.email && u.email.toLowerCase() === where.email.toLowerCase()) return true;
          if (where.username && u.username.toLowerCase() === where.username.toLowerCase()) return true;
          return false;
        });
        if (!user) return null;
        return this.enrichUser(user, include);
      },
      findFirst: async ({ where, include }: any = {}) => {
        const user = this.state.users.find(u => this.matchesWhere(u, where));
        if (!user) return null;
        return this.enrichUser(user, include);
      },
      findMany: async ({ where, take, orderBy, include }: any = {}) => {
        let list = this.state.users.filter(u => this.matchesWhere(u, where));
        if (orderBy?.xp === 'desc') {
          list.sort((a, b) => (b.xp || 0) - (a.xp || 0));
        }
        if (take) list = list.slice(0, take);
        return list.map(u => this.enrichUser(u, include));
      },
      create: async ({ data, include }: any) => {
        const id = data.id || 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const newUser = {
          id,
          email: data.email,
          emailVerified: false,
          passwordHash: data.passwordHash,
          username: data.username,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl || null,
          bannerUrl: data.bannerUrl || null,
          bio: data.bio || null,
          headline: data.headline || null,
          college: data.college || 'MIT',
          department: data.department || 'Computer Science',
          graduationYear: data.graduationYear || 2026,
          role: data.role || 'STUDENT',
          xp: data.xp || 0,
          level: data.level || 1,
          reputationScore: 100,
          streakDays: 1,
          githubUrl: data.githubUrl || null,
          linkedinUrl: data.linkedinUrl || null,
          portfolioUrl: data.portfolioUrl || null,
          isAvailableForCrews: true,
          isAmbassador: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.state.users.push(newUser);
        this.save();
        return this.enrichUser(newUser, include);
      },
      update: async ({ where, data, include }: any) => {
        const idx = this.state.users.findIndex(u => u.id === where.id || (where.email && u.email === where.email));
        if (idx === -1) throw new Error('User not found');
        this.state.users[idx] = { ...this.state.users[idx], ...data, updatedAt: new Date().toISOString() };
        this.save();
        return this.enrichUser(this.state.users[idx], include);
      },
      count: async () => this.state.users.length,
    };
  }

  public get userSkill() {
    return {
      findMany: async ({ where }: any = {}) => this.state.userSkills.filter(s => this.matchesWhere(s, where)),
      upsert: async ({ where, update, create }: any) => {
        const userId = where?.userId_skillName?.userId || create.userId;
        const skillName = where?.userId_skillName?.skillName || create.skillName;
        const idx = this.state.userSkills.findIndex(s => s.userId === userId && s.skillName === skillName);
        if (idx !== -1) {
          this.state.userSkills[idx] = { ...this.state.userSkills[idx], ...update };
          this.save();
          return this.state.userSkills[idx];
        }
        const newSkill = { id: 'usk_' + Date.now(), userId, skillName, ...create };
        this.state.userSkills.push(newSkill);
        this.save();
        return newSkill;
      },
    };
  }

  public get post() {
    return {
      findMany: async ({ where, take, orderBy, include }: any = {}) => {
        let list = this.state.posts.filter(p => this.matchesWhere(p, where));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (take) list = list.slice(0, take);
        return list.map(p => this.enrichPost(p, include));
      },
      findUnique: async ({ where, include }: any) => {
        const p = this.state.posts.find(x => x.id === where.id);
        if (!p) return null;
        return this.enrichPost(p, include);
      },
      create: async ({ data, include }: any) => {
        const id = 'post_' + Date.now();
        const newPost = {
          id,
          authorId: data.authorId,
          type: data.type || 'TEXT',
          title: data.title || null,
          content: data.content,
          mediaUrls: data.mediaUrls || [],
          tags: data.tags || [],
          voyageId: data.voyageId || null,
          likesCount: 0,
          commentsCount: 0,
          sharesCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.state.posts.unshift(newPost);
        this.save();
        return this.enrichPost(newPost, include);
      },
      update: async ({ where, data, include }: any) => {
        const idx = this.state.posts.findIndex(p => p.id === where.id);
        if (idx === -1) throw new Error('Post not found');
        this.state.posts[idx] = { ...this.state.posts[idx], ...data, updatedAt: new Date().toISOString() };
        this.save();
        return this.enrichPost(this.state.posts[idx], include);
      },
    };
  }

  public get team() {
    return {
      findMany: async ({ where, include }: any = {}) => {
        const list = this.state.teams.filter(t => this.matchesWhere(t, where));
        return list.map(t => this.enrichTeam(t, include));
      },
      findUnique: async ({ where, include }: any) => {
        const t = this.state.teams.find(x => (where.id && x.id === where.id) || (where.slug && x.slug === where.slug));
        if (!t) return null;
        return this.enrichTeam(t, include);
      },
      create: async ({ data, include }: any) => {
        const id = 'crew_' + Date.now();
        const slug = data.slug || data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'crew-' + Date.now();
        const newTeam = {
          id,
          name: data.name || data.title,
          slug,
          tagline: data.tagline || '',
          description: data.description,
          category: data.category,
          targetHackathon: data.targetHackathon || data.eventContext || null,
          maxMembers: data.maxMembers || 5,
          commitmentHoursPerWeek: data.commitmentHoursPerWeek || 10,
          captainId: data.captainId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.state.teams.unshift(newTeam);

        // Add captain as member
        this.state.teamMembers.push({
          id: 'tmem_' + Date.now(),
          teamId: id,
          userId: data.captainId,
          role: 'CAPTAIN',
          assignedRoleName: 'Captain & Creator',
          isLead: true,
          joinedAt: new Date().toISOString(),
        });

        // Add default agreement
        this.state.teamAgreements.push({
          id: 'tagr_' + Date.now(),
          teamId: id,
          termsContent: 'Default VYNK Squad Collaboration Terms: Commit to active communication and delivery.',
          commitmentDescription: 'Active squad collaboration with weekly sprint checkins.',
          weeklyHours: newTeam.commitmentHoursPerWeek,
          primaryChannel: 'VYNK Crew Messenger',
          decisionProtocol: 'CONSENSUS',
          codeStandardRules: ['TypeScript strict mode', 'PR review before merge'],
          meetingSchedule: 'Weekly checkin',
          signedBy: [data.captainId],
          acceptedUserIds: [data.captainId],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        if (data.requirements?.create) {
          for (const req of data.requirements.create) {
            this.state.teamRequirements.push({
              id: 'treq_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
              teamId: id,
              roleName: req.roleName,
              requiredSkills: req.requiredSkills || [],
              priority: req.priority || 'MEDIUM',
            });
          }
        }

        this.save();
        return this.enrichTeam(newTeam, include);
      },
    };
  }

  public get project() {
    return {
      findMany: async ({ where, include }: any = {}) => {
        const list = this.state.projects.filter(p => this.matchesWhere(p, where));
        return list.map(p => this.enrichProject(p, include));
      },
      findUnique: async ({ where, include }: any) => {
        const p = this.state.projects.find(x => x.id === where.id);
        if (!p) return null;
        return this.enrichProject(p, include);
      },
      create: async ({ data, include }: any) => {
        const id = 'voy_' + Date.now();
        const newProj = {
          id,
          title: data.title,
          tagline: data.tagline || '',
          description: data.description,
          category: data.category || 'FULLSTACK',
          status: data.status || 'SHIPPED',
          demoUrl: data.demoUrl || null,
          repoUrl: data.repoUrl || null,
          techStack: data.techStack || [],
          likesCount: 0,
          viewsCount: 1,
          featured: false,
          ownerId: data.ownerId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.state.projects.unshift(newProj);
        this.save();
        return this.enrichProject(newProj, include);
      },
    };
  }

  public get dailyChallenge() {
    return {
      findFirst: async ({ where }: any = {}) => {
        const today = new Date().toISOString().slice(0, 10);
        return this.state.dailyChallenges.find(c => c.date === today) || this.state.dailyChallenges[0] || null;
      },
      findUnique: async ({ where }: any) => this.state.dailyChallenges.find(c => c.id === where.id) || null,
    };
  }

  public get dailyChallengeAttempt() {
    return {
      findUnique: async ({ where }: any) => {
        const userId = where?.userId_challengeId?.userId;
        const challengeId = where?.userId_challengeId?.challengeId;
        return this.state.dailyChallengeAttempts.find(a => a.userId === userId && a.challengeId === challengeId) || null;
      },
      create: async ({ data }: any) => {
        const newAttempt = { id: 'dca_' + Date.now(), ...data, createdAt: new Date().toISOString() };
        this.state.dailyChallengeAttempts.push(newAttempt);
        this.save();
        return newAttempt;
      },
    };
  }

  public get connection() {
    return {
      findMany: async ({ where, include }: any = {}) => {
        const list = this.state.connections.filter(c => this.matchesWhere(c, where));
        return list.map(c => ({
          ...c,
          sender: this.enrichUser(this.state.users.find(u => u.id === c.senderId), include?.sender?.include),
          receiver: this.enrichUser(this.state.users.find(u => u.id === c.receiverId), include?.receiver?.include),
        }));
      },
      findFirst: async ({ where }: any = {}) => this.state.connections.find(c => this.matchesWhere(c, where)) || null,
      create: async ({ data }: any) => {
        const newConn = { id: 'conn_' + Date.now(), status: 'PENDING', ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        this.state.connections.push(newConn);
        this.save();
        return newConn;
      },
    };
  }

  public get xPTransaction() {
    return {
      create: async ({ data }: any) => {
        const newTx = { id: 'xpt_' + Date.now(), ...data, createdAt: new Date().toISOString() };
        this.state.xpTransactions.push(newTx);
        this.save();
        return newTx;
      },
    };
  }

  public get teamAgreement() {
    return {
      upsert: async ({ where, update, create }: any) => {
        const teamId = where.teamId;
        const idx = this.state.teamAgreements.findIndex(a => a.teamId === teamId);
        if (idx !== -1) {
          const current = this.state.teamAgreements[idx];
          if (update?.signedBy?.push) {
            const pushId = update.signedBy.push;
            if (!current.signedBy.includes(pushId)) current.signedBy.push(pushId);
          }
          this.save();
          return current;
        }
        const newAgr = { id: 'tagr_' + Date.now(), teamId, ...create };
        this.state.teamAgreements.push(newAgr);
        this.save();
        return newAgr;
      },
      update: async ({ where, data }: any) => {
        const idx = this.state.teamAgreements.findIndex(a => a.teamId === where.teamId);
        if (idx !== -1) {
          this.state.teamAgreements[idx] = { ...this.state.teamAgreements[idx], ...data };
          this.save();
          return this.state.teamAgreements[idx];
        }
        return null;
      },
    };
  }

  public get institution() {
    return {
      findMany: async () => this.state.institutions,
    };
  }

  public get department() {
    return {
      findMany: async () => this.state.departments,
    };
  }

  public async $transaction(actions: any[]) {
    const results = [];
    for (const action of actions) {
      results.push(await action);
    }
    return results;
  }

  // Helpers
  private matchesWhere(item: any, where?: any): boolean {
    if (!where) return true;
    for (const key of Object.keys(where)) {
      if (key === 'OR' && Array.isArray(where.OR)) {
        const matchOr = where.OR.some((cond: any) => this.matchesWhere(item, cond));
        if (!matchOr) return false;
        continue;
      }
      if (key === 'AND' && Array.isArray(where.AND)) {
        const matchAnd = where.AND.every((cond: any) => this.matchesWhere(item, cond));
        if (!matchAnd) return false;
        continue;
      }
      const val = where[key];
      if (val === undefined) continue;
      if (typeof val === 'object' && val !== null) {
        if (val.contains) {
          const str = String(item[key] || '');
          if (!str.toLowerCase().includes(val.contains.toLowerCase())) return false;
          continue;
        }
        if (val.equals !== undefined) {
          if (item[key] !== val.equals) return false;
          continue;
        }
        if (val.in && Array.isArray(val.in)) {
          if (!val.in.includes(item[key])) return false;
          continue;
        }
      } else {
        if (item[key] !== val) return false;
      }
    }
    return true;
  }

  private enrichUser(u: any, include?: any) {
    if (!u) return null;
    const userCopy = { ...u };
    if (include?.skills) {
      userCopy.skills = this.state.userSkills.filter(s => s.userId === u.id);
    }
    if (include?.interests) {
      userCopy.interests = this.state.userInterests.filter(i => i.userId === u.id);
    }
    if (include?.badges) {
      userCopy.badges = this.state.userBadges
        .filter(b => b.userId === u.id)
        .map(ub => ({ ...ub, badge: this.state.badges.find(b => b.id === ub.badgeId) }));
    }
    return userCopy;
  }

  private enrichPost(p: any, include?: any) {
    if (!p) return null;
    const postCopy = { ...p };
    postCopy.author = this.enrichUser(this.state.users.find(u => u.id === p.authorId));
    if (p.voyageId) {
      postCopy.voyage = this.state.projects.find(x => x.id === p.voyageId) || null;
    }
    return postCopy;
  }

  private enrichTeam(t: any, include?: any) {
    if (!t) return null;
    const teamCopy = { ...t };
    teamCopy.captain = this.enrichUser(this.state.users.find(u => u.id === t.captainId));
    teamCopy.members = this.state.teamMembers
      .filter(m => m.teamId === t.id)
      .map(m => ({ ...m, user: this.enrichUser(this.state.users.find(u => u.id === m.userId), { skills: true }) }));
    teamCopy.requirements = this.state.teamRequirements.filter(r => r.teamId === t.id);
    teamCopy.agreement = this.state.teamAgreements.find(a => a.teamId === t.id) || null;
    return teamCopy;
  }

  private enrichProject(p: any, include?: any) {
    if (!p) return null;
    const projCopy = { ...p };
    projCopy.owner = this.enrichUser(this.state.users.find(u => u.id === p.ownerId));
    return projCopy;
  }
}

export const localStore = new LocalStore();
`;

fs.writeFileSync(localStorePath, localStoreContent.trim() + '\n', 'utf8');
console.log('✓ Created packages/database/src/local-store.ts');

// 2. Update packages/database/src/index.ts
const dbIndexPath = path.resolve(__dirname, '../packages/database/src/index.ts');
const dbIndexContent = `export * from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { localStore } from './local-store';

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

const realPrisma = globalThis.prismaGlobal ?? new PrismaClient({
  log: ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = realPrisma;
}

// Resilient fallback proxy that executes localStore when PostgreSQL is unavailable
export const prisma: any = new Proxy(realPrisma, {
  get(target: any, prop: string | symbol) {
    // Check if target has property
    if (prop === '$transaction') {
      return async (actions: any[]) => {
        try {
          return await target.$transaction(actions);
        } catch (err: any) {
          return await localStore.$transaction(actions);
        }
      };
    }

    const modelTarget = target[prop];
    const storeTarget = (localStore as any)[prop];

    if (storeTarget) {
      return new Proxy(modelTarget || {}, {
        get(_mTarget, methodProp: string) {
          return async (...args: any[]) => {
            try {
              if (modelTarget && typeof modelTarget[methodProp] === 'function') {
                return await modelTarget[methodProp](...args);
              }
            } catch (err: any) {
              const msg = err?.message || '';
              if (msg.includes("Can't reach database server") || err?.code === 'P1001' || msg.includes('ECONNREFUSED')) {
                // Transparently fallback to persistent localStore
                if (typeof storeTarget[methodProp] === 'function') {
                  return await storeTarget[methodProp](...args);
                }
              }
              throw err;
            }

            if (typeof storeTarget[methodProp] === 'function') {
              return await storeTarget[methodProp](...args);
            }
            return null;
          };
        },
      });
    }

    return target[prop];
  },
});
`;

fs.writeFileSync(dbIndexPath, dbIndexContent.trim() + '\n', 'utf8');
console.log('✓ Updated packages/database/src/index.ts with transparent resilient database proxy');
`;

fs.writeFileSync(path.resolve(__dirname, 'build-resilient-db.js'), localStoreContent, 'utf8');
console.log('Created build-resilient-db.js');

