import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Resolve storage file location
function getDbFilePath(): string {
  let curr = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.resolve(curr, 'pnpm-workspace.yaml'))) {
      return path.resolve(curr, 'data', 'vynk_db.json');
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  curr = __dirname;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.resolve(curr, 'pnpm-workspace.yaml'))) {
      return path.resolve(curr, 'data', 'vynk_db.json');
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return path.resolve(process.cwd(), 'data', 'vynk_db.json');
}

export interface DbState {
  users: any[];
  userSkills: any[];
  userInterests: any[];
  connections: any[];
  follows: any[];
  posts: any[];
  comments: any[];
  reactions: any[];
  savedPosts: any[];
  projects: any[];
  projectMembers: any[];
  projectMilestones: any[];
  teams: any[];
  teamMembers: any[];
  teamRequirements: any[];
  teamAgreements: any[];
  teamInvitations: any[];
  mentorProfiles: any[];
  mentorshipRequests: any[];
  dailyChallenges: any[];
  dailyChallengeAttempts: any[];
  quizzes: any[];
  quizQuestions: any[];
  quizAttempts: any[];
  xPTransactions: any[];
  badges: any[];
  userBadges: any[];
  conversations: any[];
  conversationMembers: any[];
  messages: any[];
  notifications: any[];
  events: any[];
  eventRegistrations: any[];
  communities: any[];
  communityMembers: any[];
  analyticsEvents: any[];
  searchHistories: any[];
  reports: any[];
  institutions: any[];
  studentVerifications: any[];
  departments: any[];
}

function createEmptyState(): DbState {
  return {
    users: [],
    userSkills: [],
    userInterests: [],
    connections: [],
    follows: [],
    posts: [],
    comments: [],
    reactions: [],
    savedPosts: [],
    projects: [],
    projectMembers: [],
    projectMilestones: [],
    teams: [],
    teamMembers: [],
    teamRequirements: [],
    teamAgreements: [],
    teamInvitations: [],
    mentorProfiles: [],
    mentorshipRequests: [],
    dailyChallenges: [],
    dailyChallengeAttempts: [],
    quizzes: [],
    quizQuestions: [],
    quizAttempts: [],
    xPTransactions: [],
    badges: [],
    userBadges: [],
    conversations: [],
    conversationMembers: [],
    messages: [],
    notifications: [],
    events: [],
    eventRegistrations: [],
    communities: [],
    communityMembers: [],
    analyticsEvents: [],
    searchHistories: [],
    reports: [],
    institutions: [],
    studentVerifications: [],
    departments: [],
  };
}

class LocalStoreEngine {
  private dbFilePath: string;
  public state: DbState;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.dbFilePath = getDbFilePath();
    this.state = createEmptyState();
    this.load();
  }

  public load(): void {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.state = { ...createEmptyState(), ...parsed };
        console.log(`[VYNK LocalStore] Loaded database from ${this.dbFilePath} (${this.state.users.length} users)`);
      } else {
        console.log(`[VYNK LocalStore] No database file found at ${this.dbFilePath}. Initializing with seed data...`);
        this.seedInitialData();
        this.saveSync();
      }
    } catch (err) {
      console.warn(`[VYNK LocalStore] Failed to load ${this.dbFilePath}, reinitializing:`, err);
      this.seedInitialData();
      this.saveSync();
    }
  }

  public save(): void {
    this.saveSync();
  }

  public saveSync(): void {
    try {
      const dir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tmpPath = `${this.dbFilePath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.state, null, 2), 'utf-8');
      fs.renameSync(tmpPath, this.dbFilePath);
    } catch (err) {
      console.error('[VYNK LocalStore] Error saving database to disk:', err);
    }
  }

  public seedInitialData(): void {
    const state = this.state;
    const defaultPasswordHash = bcrypt.hashSync('vynkPass123!', 10);
    const now = new Date().toISOString();

    // 1. Institutions
    const mitInstId = 'inst-mit-001';
    const stanfordInstId = 'inst-stanford-002';
    const berkeleyInstId = 'inst-berkeley-003';
    const cmuInstId = 'inst-cmu-004';
    const citInstId = 'inst-cit-005';

    state.institutions = [
      {
        id: mitInstId,
        name: 'Massachusetts Institute of Technology (MIT)',
        slug: 'mit',
        domains: ['mit.edu'],
        city: 'Cambridge',
        country: 'US',
        isApproved: true,
        createdAt: now,
      },
      {
        id: stanfordInstId,
        name: 'Stanford University',
        slug: 'stanford',
        domains: ['stanford.edu'],
        city: 'Stanford',
        country: 'US',
        isApproved: true,
        createdAt: now,
      },
      {
        id: berkeleyInstId,
        name: 'University of California, Berkeley',
        slug: 'berkeley',
        domains: ['berkeley.edu'],
        city: 'Berkeley',
        country: 'US',
        isApproved: true,
        createdAt: now,
      },
      {
        id: cmuInstId,
        name: 'Carnegie Mellon University',
        slug: 'cmu',
        domains: ['cmu.edu'],
        city: 'Pittsburgh',
        country: 'US',
        isApproved: true,
        createdAt: now,
      },
      {
        id: citInstId,
        name: 'Chennai Institute of Technology (CIT)',
        slug: 'cit-chennai',
        domains: ['citchennai.net', 'cit.edu.in'],
        city: 'Chennai',
        country: 'IN',
        isApproved: true,
        createdAt: now,
      },
    ];

    state.departments = [
      { id: 'dept-mit-cs', institutionId: mitInstId, name: 'Computer Science', code: 'CS', studentCount: 120, createdAt: now },
      { id: 'dept-mit-ai', institutionId: mitInstId, name: 'AI & Data Science', code: 'AIDS', studentCount: 85, createdAt: now },
      { id: 'dept-stanford-cs', institutionId: stanfordInstId, name: 'Computer Science', code: 'CS', studentCount: 140, createdAt: now },
      { id: 'dept-stanford-ai', institutionId: stanfordInstId, name: 'AI & Data Science', code: 'AIDS', studentCount: 95, createdAt: now },
      { id: 'dept-berkeley-des', institutionId: berkeleyInstId, name: 'Design & HCI', code: 'DES', studentCount: 60, createdAt: now },
      { id: 'dept-cmu-is', institutionId: cmuInstId, name: 'Information Security', code: 'IS', studentCount: 75, createdAt: now },
      { id: 'dept-cit-cs', institutionId: citInstId, name: 'Computer Science and Engineering', code: 'CSE', studentCount: 180, createdAt: now },
      { id: 'dept-cit-ai', institutionId: citInstId, name: 'Artificial Intelligence & Data Science', code: 'AIDS', studentCount: 120, createdAt: now },
      { id: 'dept-cit-cce', institutionId: citInstId, name: 'Computer and Communication Engineering', code: 'CCE', studentCount: 90, createdAt: now },
      { id: 'dept-cit-csbs', institutionId: citInstId, name: 'Computer Science and Business Systems', code: 'CSBS', studentCount: 75, createdAt: now },
    ];

    // 2. Badges
    const badge1Id = 'badge-first-voyage';
    const badge2Id = 'badge-crew-captain';
    const badge3Id = 'badge-quiz-master';
    const badge4Id = 'badge-streak-titan';

    state.badges = [
      { id: badge1Id, code: 'FIRST_VOYAGE', title: 'First Voyage', description: 'Showcased and published your first technical project portfolio.', iconName: 'Rocket', category: 'COLLABORATION', xpThreshold: 250 },
      { id: badge2Id, code: 'CREW_CAPTAIN', title: 'Crew Captain', description: 'Formed a collaborative crew and published a verified Team Agreement.', iconName: 'ShieldAlert', category: 'COLLABORATION', xpThreshold: 500 },
      { id: badge3Id, code: 'QUIZ_MASTER', title: 'Quiz Champion', description: 'Achieved a top 5% score in the weekly technical challenge.', iconName: 'Trophy', category: 'LEARNING', xpThreshold: 750 },
      { id: badge4Id, code: 'STREAK_TITAN', title: 'Streak Titan', description: 'Maintained a 14+ day continuous learning and challenge streak.', iconName: 'Flame', category: 'LEARNING', xpThreshold: 1000 },
    ];

    // 3. Demo Users
    const alexId = 'usr-alex-chen-001';
    const mayaId = 'usr-maya-lin-002';
    const devonId = 'usr-devon-vance-003';
    const priyaId = 'usr-priya-sharma-004';
    const arunId = 'usr-arun-kumar-005';
    const sarahId = 'usr-sarah-jenkins-006';

    state.users = [
      {
        id: alexId,
        email: 'alex.chen@mit.edu',
        emailVerified: true,
        passwordHash: defaultPasswordHash,
        username: 'alexchen',
        displayName: 'Alex Chen',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200',
        headline: 'Full-Stack Craftsman & Distributed Systems Geek',
        bio: 'Building scalable realtime systems. Hackathon enthusiast (3x winner). Searching for an ML specialist for the upcoming Global AI Hackathon!',
        college: 'Massachusetts Institute of Technology (MIT)',
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
        isAvailableForMentorship: false,
        isAmbassador: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: mayaId,
        email: 'maya.lin@stanford.edu',
        emailVerified: true,
        passwordHash: defaultPasswordHash,
        username: 'mayalin_ai',
        displayName: 'Maya Lin',
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
        isAvailableForMentorship: false,
        isAmbassador: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: devonId,
        email: 'devon.vance@berkeley.edu',
        emailVerified: true,
        passwordHash: defaultPasswordHash,
        username: 'devondesign',
        displayName: 'Devon Vance',
        avatarUrl: 'https://images.unsplash.com/photo-1500000000000-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
        bannerUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=1200',
        headline: 'Product Designer & Design Systems Enthusiast',
        bio: 'Bridging design and code. Figma wizard obsessed with micro-interactions, dark mode aesthetics, and zero-latency user interfaces.',
        college: 'University of California, Berkeley',
        department: 'Human-Computer Interaction / Design',
        graduationYear: 2026,
        role: 'STUDENT',
        xp: 980,
        level: 4,
        reputationScore: 320,
        streakDays: 8,
        portfolioUrl: 'https://devonvance.design',
        isAvailableForCrews: true,
        isAvailableForMentorship: false,
        isAmbassador: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: priyaId,
        email: 'priya.sharma@cmu.edu',
        emailVerified: true,
        passwordHash: defaultPasswordHash,
        username: 'priyacodes',
        displayName: 'Priya Sharma',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
        bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200',
        headline: 'Cybersecurity & Blockchain Security Researcher',
        bio: 'Breaking protocols to make them unbreakable. CTF captain, smart contract auditing, zero-knowledge proofs.',
        college: 'Carnegie Mellon University',
        department: 'Information Security',
        graduationYear: 2026,
        role: 'STUDENT',
        xp: 1650,
        level: 6,
        reputationScore: 510,
        streakDays: 19,
        githubUrl: 'https://github.com/priyasharma-sec',
        isAvailableForCrews: true,
        isAvailableForMentorship: false,
        isAmbassador: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: arunId,
        email: 'arun.kumar@google.com',
        emailVerified: true,
        passwordHash: defaultPasswordHash,
        username: 'dr_arun_ml',
        displayName: 'Dr. Arun Kumar',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
        bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200',
        headline: 'Staff ML Engineer @ Google DeepMind | AI Mentor',
        bio: '10+ years scaling neural architectures and foundation models. Passionate about helping students transition from toy models to production systems.',
        college: 'Stanford Alumni',
        department: 'Computer Science & AI',
        role: 'MENTOR',
        xp: 4500,
        level: 9,
        reputationScore: 990,
        streakDays: 45,
        isAvailableForMentorship: true,
        isAvailableForCrews: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: sarahId,
        email: 'sarah@hyperbuild.io',
        emailVerified: true,
        passwordHash: defaultPasswordHash,
        username: 'sarah_builds',
        displayName: 'Sarah Jenkins',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
        bannerUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200',
        headline: 'Founder @ HyperBuild (YC W24) | ex-Stripe Tech Lead',
        bio: 'Built and scaled developer infrastructure to millions of requests/sec. Guiding student founders on MVP architecture and hackathon pitching.',
        college: 'MIT Alumni',
        department: 'EECS',
        role: 'MENTOR',
        xp: 3800,
        level: 8,
        reputationScore: 920,
        streakDays: 30,
        isAvailableForMentorship: true,
        isAvailableForCrews: false,
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Skills
    state.userSkills = [
      { id: 'sk-1', userId: alexId, skillName: 'React / Next.js', category: 'Frontend', proficiency: 'EXPERT', yearsOfExperience: 3.5, isVerified: true, evidenceUrl: 'https://github.com/alexchen/next-realtime' },
      { id: 'sk-2', userId: alexId, skillName: 'TypeScript', category: 'Frontend', proficiency: 'EXPERT', yearsOfExperience: 3, isVerified: true },
      { id: 'sk-3', userId: alexId, skillName: 'Fastify / Node.js', category: 'Backend', proficiency: 'ADVANCED', yearsOfExperience: 3, isVerified: true },
      { id: 'sk-4', userId: alexId, skillName: 'PostgreSQL / Prisma', category: 'Database', proficiency: 'ADVANCED', yearsOfExperience: 2.5, isVerified: true },
      { id: 'sk-5', userId: alexId, skillName: 'Redis PubSub', category: 'Backend', proficiency: 'INTERMEDIATE', yearsOfExperience: 1.5, isVerified: false },

      { id: 'sk-6', userId: mayaId, skillName: 'Python', category: 'Backend', proficiency: 'EXPERT', yearsOfExperience: 4, isVerified: true },
      { id: 'sk-7', userId: mayaId, skillName: 'PyTorch', category: 'AI/ML', proficiency: 'EXPERT', yearsOfExperience: 3, isVerified: true, evidenceUrl: 'https://github.com/mayalin-ai/vision-transformer' },
      { id: 'sk-8', userId: mayaId, skillName: 'pgvector / Embeddings', category: 'Database', proficiency: 'ADVANCED', yearsOfExperience: 2, isVerified: true },
      { id: 'sk-9', userId: mayaId, skillName: 'Hugging Face', category: 'AI/ML', proficiency: 'ADVANCED', yearsOfExperience: 2.5, isVerified: true },
      { id: 'sk-10', userId: mayaId, skillName: 'FastAPI', category: 'Backend', proficiency: 'INTERMEDIATE', yearsOfExperience: 1.5, isVerified: true },

      { id: 'sk-11', userId: devonId, skillName: 'Figma / UI Design', category: 'Design', proficiency: 'EXPERT', yearsOfExperience: 4, isVerified: true },
      { id: 'sk-12', userId: devonId, skillName: 'Tailwind CSS', category: 'Frontend', proficiency: 'ADVANCED', yearsOfExperience: 3, isVerified: true },
      { id: 'sk-13', userId: devonId, skillName: 'Framer Motion', category: 'Frontend', proficiency: 'ADVANCED', yearsOfExperience: 2, isVerified: true },
      { id: 'sk-14', userId: devonId, skillName: 'User Research', category: 'Product', proficiency: 'INTERMEDIATE', yearsOfExperience: 2, isVerified: false },

      { id: 'sk-15', userId: priyaId, skillName: 'Rust', category: 'Backend', proficiency: 'ADVANCED', yearsOfExperience: 2.5, isVerified: true },
      { id: 'sk-16', userId: priyaId, skillName: 'Solidity / ZK-Proofs', category: 'Security', proficiency: 'ADVANCED', yearsOfExperience: 2, isVerified: true },
      { id: 'sk-17', userId: priyaId, skillName: 'C / C++', category: 'Systems', proficiency: 'ADVANCED', yearsOfExperience: 3, isVerified: true },
      { id: 'sk-18', userId: priyaId, skillName: 'Cryptography', category: 'Security', proficiency: 'ADVANCED', yearsOfExperience: 3, isVerified: true },
    ];

    // Interests
    state.userInterests = [
      { id: 'int-1', userId: alexId, name: 'Distributed Systems', category: 'Technical' },
      { id: 'int-2', userId: alexId, name: 'AI Agents', category: 'Technical' },
      { id: 'int-3', userId: alexId, name: 'Hackathons', category: 'Activity' },
      { id: 'int-4', userId: alexId, name: 'Open Source', category: 'Activity' },

      { id: 'int-5', userId: mayaId, name: 'Computer Vision', category: 'Technical' },
      { id: 'int-6', userId: mayaId, name: 'Multimodal AI', category: 'Technical' },
      { id: 'int-7', userId: mayaId, name: 'Healthcare Tech', category: 'Domain' },
      { id: 'int-8', userId: mayaId, name: 'Research Papers', category: 'Activity' },

      { id: 'int-9', userId: devonId, name: 'Design Systems', category: 'Design' },
      { id: 'int-10', userId: devonId, name: 'UX Engineering', category: 'Technical' },
      { id: 'int-11', userId: devonId, name: 'Accessibility', category: 'Product' },

      { id: 'int-12', userId: priyaId, name: 'Zero-Knowledge Proofs', category: 'Technical' },
      { id: 'int-13', userId: priyaId, name: 'CTF Competitions', category: 'Activity' },
      { id: 'int-14', userId: priyaId, name: 'AppSec', category: 'Security' },
    ];

    // Mentors
    state.mentorProfiles = [
      {
        id: 'mentor-prof-arun',
        userId: arunId,
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
        rating: 4.95,
        createdAt: now,
      },
      {
        id: 'mentor-prof-sarah',
        userId: sarahId,
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
        rating: 5.0,
        createdAt: now,
      },
    ];

    // Social Connections
    state.connections = [
      { id: 'conn-1', senderId: alexId, receiverId: mayaId, status: 'ACCEPTED', createdAt: now, updatedAt: now },
      { id: 'conn-2', senderId: devonId, receiverId: alexId, status: 'ACCEPTED', createdAt: now, updatedAt: now },
      { id: 'conn-3', senderId: priyaId, receiverId: alexId, status: 'PENDING', createdAt: now, updatedAt: now },
    ];

    // Voyages (Projects)
    const voyage1Id = 'proj-neurovision-001';
    state.projects = [
      {
        id: voyage1Id,
        title: 'NeuroVision: Real-Time Edge Video Analytics',
        slug: 'neurovision-ai',
        tagline: 'Sub-15ms edge inference pipeline for clinical surgery assistance.',
        description: 'NeuroVision combines lightweight custom YOLOv9 models with WebAssembly and WebRTC to deliver real-time surgical tool tracking directly in the operating theater browser without cloud latency.',
        coverImageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1000',
        screenshots: [],
        technologies: ['PyTorch', 'WebAssembly', 'WebRTC', 'React', 'FastAPI', 'pgvector'],
        githubUrl: 'https://github.com/mayalin-ai/neurovision-edge',
        demoUrl: 'https://neurovision-demo.vercel.app',
        videoUrl: null,
        category: 'Healthcare & AI',
        status: 'HACKATHON_WINNER',
        xpRewarded: 500,
        likesCount: 142,
        viewsCount: 1890,
        creatorId: mayaId,
        crewId: null,
        createdAt: now,
        updatedAt: now,
      },
    ];

    state.projectMembers = [
      { id: 'pm-1', projectId: voyage1Id, userId: mayaId, role: 'ML & Model Architecture', contributions: 'Custom YOLO model quantisation and tensor inference engine.' },
      { id: 'pm-2', projectId: voyage1Id, userId: alexId, role: 'Full-Stack & WebRTC Pipeline', contributions: 'Built the zero-latency WebRTC streaming server in Node & WebSockets.' },
    ];

    state.projectMilestones = [
      { id: 'ms-1', projectId: voyage1Id, title: 'Model Quantization (INT8)', description: 'Quantized PyTorch weights for on-device inference.', isCompleted: true, dueDate: null },
      { id: 'ms-2', projectId: voyage1Id, title: 'WebAssembly Pipeline', description: 'Ported C++ inference runtime to browser wasm.', isCompleted: true, dueDate: null },
      { id: 'ms-3', projectId: voyage1Id, title: 'Clinical Trial Simulation', description: 'Tested against 500+ annotated surgical video sequences.', isCompleted: false, dueDate: null },
    ];

    // Crews (Teams)
    const crew1Id = 'team-neurovision-crew';
    state.teams = [
      {
        id: crew1Id,
        name: 'NeuroVision AI Hack Squad',
        slug: 'neurovision-hack-squad',
        tagline: 'Competing in the Global HealthTech Hackathon 2026',
        description: 'We are building an on-device multimodal diagnostic assistant for emergency healthcare workers. Looking for a talented UI/UX engineer and a Backend specialist to complete our 4-person crew!',
        avatarUrl: null,
        bannerUrl: null,
        category: 'Healthcare & AI',
        targetHackathon: 'MIT Grand Hack 2026',
        maxMembers: 4,
        commitmentHoursPerWeek: 12,
        deadline: null,
        isRecruiting: true,
        captainId: mayaId,
        createdAt: now,
        updatedAt: now,
      },
    ];

    state.teamMembers = [
      { id: 'tm-1', teamId: crew1Id, userId: mayaId, role: 'CAPTAIN', assignedRoleName: 'ML Lead & Model Architect', joinedAt: now },
      { id: 'tm-2', teamId: crew1Id, userId: alexId, role: 'LEAD', assignedRoleName: 'Distributed Systems & Backend', joinedAt: now },
    ];

    state.teamRequirements = [
      {
        id: 'tr-1',
        teamId: crew1Id,
        roleName: 'UI/UX & Design Systems Lead',
        requiredSkills: ['Figma / UI Design', 'Tailwind CSS', 'Framer Motion'],
        description: 'Design and implement the high-contrast emergency room dashboard with accessible visual hierarchy.',
        priority: 'CRITICAL',
        isFilled: false,
      },
      {
        id: 'tr-2',
        teamId: crew1Id,
        roleName: 'Mobile & Hardware IoT Specialist',
        requiredSkills: ['React Native', 'BLE / WebBluetooth', 'C++'],
        description: 'Connect wearable vital sensors with our edge inference engine.',
        priority: 'HIGH',
        isFilled: false,
      },
    ];

    state.teamAgreements = [
      {
        id: 'ta-1',
        teamId: crew1Id,
        commitmentDescription: 'Team members commit to active communication and delivery of their agreed modules before the demo date.',
        weeklyHours: 12,
        primaryChannel: 'VYNK Crew Messenger',
        decisionProtocol: 'CONSENSUS',
        codeStandardRules: ['TypeScript strict mode', 'PR review before merge', 'Clean commit messages'],
        meetingSchedule: 'Monday & Thursday 8:00 PM EST',
        acceptedUserIds: [mayaId, alexId],
        updatedAt: now,
      },
    ];

    // Daily Challenges (Quests)
    const todayDateStr = new Date().toISOString().split('T')[0];
    state.dailyChallenges = [
      {
        id: 'chal-today-001',
        title: 'Python Slicing & Memory References',
        category: 'Python',
        difficulty: 'INTERMEDIATE',
        snippet: 'x = [1, 2, 3, 4]\ny = x[::-1]\ny[0] = 99\nprint(x[3])',
        question: 'What is the exact output of this Python snippet?',
        options: ['99', '4', 'IndexError', 'None'],
        correctOptionIndex: 1,
        explanation: 'Slicing a list in Python (e.g. x[::-1]) creates a brand-new shallow copy. Modifying y[0] does not mutate original list x, so x[3] remains 4.',
        xpAward: 20,
        activeDate: todayDateStr,
        createdAt: now,
      },
    ];

    // Quizzes
    const quiz1Id = 'quiz-dsa-001';
    state.quizzes = [
      {
        id: quiz1Id,
        title: 'Algorithms, Data Structures & Complexity',
        slug: 'dsa-and-complexity-championship',
        description: 'Test your grasp on time complexity, recursion, graph traversals, and dynamic programming heuristics.',
        category: 'DSA & Systems',
        difficulty: 'ADVANCED',
        timeLimitMinutes: 8,
        xpReward: 100,
        isWeeklySpecial: true,
        startsAt: null,
        expiresAt: null,
        createdAt: now,
      },
    ];

    state.quizQuestions = [
      {
        id: 'qq-1',
        quizId: quiz1Id,
        question: 'What is the tightest worst-case time complexity of finding the Median in an unsorted array of size N using Quickselect?',
        codeSnippet: null,
        options: ['O(N)', 'O(N log N)', 'O(N^2)', 'O(log N)'],
        correctOptionIndex: 2,
        explanation: 'While Quickselect runs in O(N) average time, its worst-case (with adversarial pivot choices) degrades to O(N^2). Introselect or Median-of-Medians achieves guaranteed O(N).',
        topic: 'Divide & Conquer',
      },
      {
        id: 'qq-2',
        quizId: quiz1Id,
        question: 'Which graph algorithm can correctly detect negative cycles in a directed weighted graph?',
        codeSnippet: null,
        options: ['Dijkstra with Fibonacci Heap', 'Bellman-Ford Algorithm', 'Kruskal Algorithm', 'Prim Algorithm'],
        correctOptionIndex: 1,
        explanation: 'The Bellman-Ford algorithm relaxes edges N-1 times and detects negative cycles on the N-th pass if any distance value continues to decrease.',
        topic: 'Graph Theory',
      },
    ];

    // User Badges
    state.userBadges = [
      { id: 'ub-1', badgeId: badge1Id, userId: alexId, createdAt: now },
      { id: 'ub-2', badgeId: badge1Id, userId: mayaId, createdAt: now },
      { id: 'ub-3', badgeId: badge2Id, userId: mayaId, createdAt: now },
      { id: 'ub-4', badgeId: badge4Id, userId: alexId, createdAt: now },
      { id: 'ub-5', badgeId: badge4Id, userId: mayaId, createdAt: now },
    ];

    // Posts
    state.posts = [
      {
        id: 'post-launch-001',
        authorId: mayaId,
        type: 'VOYAGE_LAUNCH',
        title: '🚀 Launching NeuroVision — Edge Video Analytics for Surgery',
        content: 'Super thrilled to share what Alex Chen and I have been building over the past 3 weeks! We managed to run sub-15ms object detection directly on client hardware with WebAssembly. Check out our project and live demo!',
        mediaUrls: [],
        tags: ['AI', 'ComputerVision', 'PyTorch', 'WebAssembly', 'OpenSource'],
        voyageId: voyage1Id,
        likesCount: 38,
        commentsCount: 2,
        sharesCount: 12,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'post-design-002',
        authorId: devonId,
        type: 'LEARNING_NOTE',
        title: '🎨 Why micro-interactions matter more than flashy animations in developer tools',
        content: 'When designing for engineers, clarity beats decoration every single time. A 150ms spring transition with instant keyboard shortcuts will make users feel 10x faster than a 600ms bezier curve. What are your favorite UI details in modern tools?',
        mediaUrls: [],
        tags: ['Design', 'UX', 'Frontend', 'DeveloperExperience'],
        voyageId: null,
        likesCount: 54,
        commentsCount: 1,
        sharesCount: 4,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'post-mentor-003',
        authorId: arunId,
        type: 'OPPORTUNITY',
        title: '💡 Research Fellowship & Mentorship: Multimodal Systems',
        content: 'Opening up 2 new mentorship slots for undergraduate and master students working on foundation model quantization and efficient inference. If you have an active Voyage in PyTorch or Rust, send a mentorship request with your project details!',
        mediaUrls: [],
        tags: ['Mentorship', 'DeepLearning', 'Research', 'Opportunity'],
        voyageId: null,
        likesCount: 112,
        commentsCount: 0,
        sharesCount: 29,
        createdAt: now,
        updatedAt: now,
      },
    ];

    state.comments = [
      {
        id: 'comm-1',
        postId: 'post-launch-001',
        authorId: alexId,
        content: 'Incredible work on the INT8 quantization Maya! The FPS doubled on Chromium wasm.',
        parentId: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'comm-2',
        postId: 'post-launch-001',
        authorId: devonId,
        content: 'The dark mode HUD layout looks ultra-crisp! Let me know if you need icon polish.',
        parentId: null,
        createdAt: now,
        updatedAt: now,
      },
    ];

    state.reactions = [
      { id: 'react-1', postId: 'post-launch-001', userId: alexId, emoji: '🔥', createdAt: now },
      { id: 'react-2', postId: 'post-launch-001', userId: devonId, emoji: '🔥', createdAt: now },
    ];

    // Conversations & Messages
    const conv1Id = 'conv-alex-maya-direct';
    state.conversations = [
      {
        id: conv1Id,
        type: 'DIRECT',
        title: null,
        crewId: null,
        mentorshipRequestId: null,
        lastMessageAt: now,
        lastMessageText: 'Ready for the demo push tomorrow?',
        createdAt: now,
        updatedAt: now,
      },
    ];

    state.conversationMembers = [
      { id: 'cm-1', conversationId: conv1Id, userId: alexId, joinedAt: now, lastReadAt: now },
      { id: 'cm-2', conversationId: conv1Id, userId: mayaId, joinedAt: now, lastReadAt: now },
    ];

    state.messages = [
      {
        id: 'msg-1',
        conversationId: conv1Id,
        senderId: alexId,
        content: 'Hey Maya, the WebRTC streaming channel is synced with the edge inference worker!',
        attachments: [],
        replyToId: null,
        isDeleted: false,
        createdAt: now,
      },
      {
        id: 'msg-2',
        conversationId: conv1Id,
        senderId: mayaId,
        content: 'Awesome! Ready for the demo push tomorrow?',
        attachments: [],
        replyToId: null,
        isDeleted: false,
        createdAt: now,
      },
    ];

    // Verifications
    state.studentVerifications = [
      { id: 'sv-1', userId: alexId, institutionId: mitInstId, campusEmail: 'alex.chen@mit.edu', verificationStatus: 'VERIFIED', verifiedAt: now, createdAt: now },
      { id: 'sv-2', userId: mayaId, institutionId: stanfordInstId, campusEmail: 'maya.lin@stanford.edu', verificationStatus: 'VERIFIED', verifiedAt: now, createdAt: now },
      { id: 'sv-3', userId: devonId, institutionId: berkeleyInstId, campusEmail: 'devon.vance@berkeley.edu', verificationStatus: 'VERIFIED', verifiedAt: now, createdAt: now },
      { id: 'sv-4', userId: priyaId, institutionId: cmuInstId, campusEmail: 'priya.sharma@cmu.edu', verificationStatus: 'VERIFIED', verifiedAt: now, createdAt: now },
    ];
  }
}

// Global Singleton Store
export const localStore = new LocalStoreEngine();

// Model Table Map
const MODEL_TO_KEY: Record<string, keyof DbState> = {
  user: 'users',
  userSkill: 'userSkills',
  userInterest: 'userInterests',
  connection: 'connections',
  follow: 'follows',
  post: 'posts',
  comment: 'comments',
  reaction: 'reactions',
  savedPost: 'savedPosts',
  project: 'projects',
  projectMember: 'projectMembers',
  projectMilestone: 'projectMilestones',
  team: 'teams',
  teamMember: 'teamMembers',
  teamRequirement: 'teamRequirements',
  teamAgreement: 'teamAgreements',
  teamInvitation: 'teamInvitations',
  mentorProfile: 'mentorProfiles',
  mentorshipRequest: 'mentorshipRequests',
  dailyChallenge: 'dailyChallenges',
  dailyChallengeAttempt: 'dailyChallengeAttempts',
  quiz: 'quizzes',
  quizQuestion: 'quizQuestions',
  quizAttempt: 'quizAttempts',
  xPTransaction: 'xPTransactions',
  badge: 'badges',
  userBadge: 'userBadges',
  conversation: 'conversations',
  conversationMember: 'conversationMembers',
  message: 'messages',
  notification: 'notifications',
  event: 'events',
  eventRegistration: 'eventRegistrations',
  community: 'communities',
  communityMember: 'communityMembers',
  analyticsEvent: 'analyticsEvents',
  searchHistory: 'searchHistories',
  report: 'reports',
  institution: 'institutions',
  studentVerification: 'studentVerifications',
  department: 'departments',
};

// Evaluate Prisma filter expression against a record
function matchesFilter(item: any, where: any, state: DbState): boolean {
  if (!where || Object.keys(where).length === 0) return true;

  for (const [key, val] of Object.entries(where)) {
    if (key === 'OR') {
      const orList = val as any[];
      if (!orList.some((cond) => matchesFilter(item, cond, state))) return false;
      continue;
    }
    if (key === 'AND') {
      const andList = val as any[];
      if (!andList.every((cond) => matchesFilter(item, cond, state))) return false;
      continue;
    }
    if (key === 'NOT') {
      if (matchesFilter(item, val, state)) return false;
      continue;
    }

    // Relation filters (e.g. skills: { some: { skillName: ... } }, members: { some: { userId: ... } })
    if (key === 'skills' && typeof val === 'object' && val !== null) {
      const userSkills = state.userSkills.filter((s) => s.userId === item.id);
      if ('some' in val) {
        if (!userSkills.some((s) => matchesFilter(s, (val as any).some, state))) return false;
      }
      continue;
    }
    if (key === 'members' && typeof val === 'object' && val !== null) {
      let memberList: any[] = [];
      if ('teamId' in item || 'category' in item) {
        memberList = state.teamMembers.filter((m) => m.teamId === item.id);
      } else if ('title' in item && 'type' in item) {
        memberList = state.conversationMembers.filter((m) => m.conversationId === item.id);
      } else {
        memberList = state.projectMembers.filter((m) => m.projectId === item.id);
      }
      if ('some' in val) {
        if (!memberList.some((m) => matchesFilter(m, (val as any).some, state))) return false;
      }
      continue;
    }

    // Compound unique keys (e.g. userId_skillName: { userId, skillName }, followerId_followingId, etc.)
    if (key.includes('_') && typeof val === 'object' && val !== null && !('equals' in val || 'contains' in val || 'in' in val)) {
      if (!matchesFilter(item, val, state)) return false;
      continue;
    }

    const itemVal = item[key];

    if (val === null) {
      if (itemVal !== null && itemVal !== undefined) return false;
      continue;
    }

    if (typeof val === 'object' && !(val instanceof Date)) {
      const v = val as any;
      if ('equals' in v) {
        if (itemVal !== v.equals) return false;
      }
      if ('contains' in v) {
        const needle = String(v.contains);
        const haystack = String(itemVal || '');
        if (v.mode === 'insensitive') {
          if (!haystack.toLowerCase().includes(needle.toLowerCase())) return false;
        } else {
          if (!haystack.includes(needle)) return false;
        }
      }
      if ('startsWith' in v) {
        const needle = String(v.startsWith);
        const haystack = String(itemVal || '');
        if (v.mode === 'insensitive') {
          if (!haystack.toLowerCase().startsWith(needle.toLowerCase())) return false;
        } else {
          if (!haystack.startsWith(needle)) return false;
        }
      }
      if ('in' in v) {
        const arr = v.in as any[];
        if (!arr.includes(itemVal)) return false;
      }
      if ('notIn' in v) {
        const arr = v.notIn as any[];
        if (arr.includes(itemVal)) return false;
      }
      if ('not' in v) {
        if (v.not === null) {
          if (itemVal === null || itemVal === undefined) return false;
        } else if (itemVal === v.not) {
          return false;
        }
      }
      if ('gte' in v) {
        const target: any = v.gte instanceof Date ? v.gte.toISOString() : v.gte;
        const current: any = itemVal instanceof Date ? itemVal.toISOString() : itemVal;
        if (!(current >= target)) return false;
      }
      if ('lte' in v) {
        const target: any = v.lte instanceof Date ? v.lte.toISOString() : v.lte;
        const current: any = itemVal instanceof Date ? itemVal.toISOString() : itemVal;
        if (!(current <= target)) return false;
      }
      if ('gt' in v) {
        const target: any = v.gt instanceof Date ? v.gt.toISOString() : v.gt;
        const current: any = itemVal instanceof Date ? itemVal.toISOString() : itemVal;
        if (!(current > target)) return false;
      }
      if ('lt' in v) {
        const target: any = v.lt instanceof Date ? v.lt.toISOString() : v.lt;
        const current: any = itemVal instanceof Date ? itemVal.toISOString() : itemVal;
        if (!(current < target)) return false;
      }
      if ('has' in v) {
        if (!Array.isArray(itemVal) || !itemVal.includes(v.has)) return false;
      }
      continue;
    }

    if (itemVal !== val) {
      return false;
    }
  }

  return true;
}

// Deep clone helper
function deepClone<T>(item: T): T {
  if (item === undefined || item === null) return item;
  return JSON.parse(JSON.stringify(item));
}

// Attach relations according to `include` or `select`
function attachRelations(modelName: string, item: any, include: any, state: DbState): any {
  if (!item) return null;
  const result = deepClone(item);

  if (!include || typeof include !== 'object') return result;

  // Handle _count
  if (include._count) {
    result._count = {};
    if (include._count.select) {
      for (const [countRel, countVal] of Object.entries(include._count.select)) {
        if (!countVal) continue;
        if (modelName === 'post') {
          if (countRel === 'comments') result._count.comments = state.comments.filter((c) => c.postId === result.id).length;
          if (countRel === 'reactions') result._count.reactions = state.reactions.filter((r) => r.postId === result.id).length;
        } else if (modelName === 'quiz') {
          if (countRel === 'questions') result._count.questions = state.quizQuestions.filter((q) => q.quizId === result.id).length;
        }
      }
    }
  }

  // Specific Model Relations
  if (modelName === 'user') {
    if (include.skills) {
      result.skills = state.userSkills.filter((s) => s.userId === result.id);
    }
    if (include.interests) {
      result.interests = state.userInterests.filter((i) => i.userId === result.id);
    }
    if (include.badges) {
      const userBadges = state.userBadges.filter((b) => b.userId === result.id);
      result.badges = userBadges.map((ub) => {
        const badge = state.badges.find((b) => b.id === ub.badgeId);
        return { ...ub, badge };
      });
    }
    if (include.mentorProfile) {
      result.mentorProfile = state.mentorProfiles.find((m) => m.userId === result.id) || null;
    }
    if (include.studentVerification) {
      result.studentVerification = state.studentVerifications.find((sv) => sv.userId === result.id) || null;
    }
  }

  if (modelName === 'post') {
    if (include.author) {
      result.author = state.users.find((u) => u.id === result.authorId) || null;
    }
    if (include.voyage) {
      result.voyage = result.voyageId ? state.projects.find((p) => p.id === result.voyageId) || null : null;
    }
    if (include.comments) {
      let comms = state.comments.filter((c) => c.postId === result.id);
      if (typeof include.comments === 'object' && include.comments.include?.author) {
        comms = comms.map((c) => ({
          ...c,
          author: state.users.find((u) => u.id === c.authorId) || null,
        }));
      }
      result.comments = comms;
    }
    if (include.reactions) {
      result.reactions = state.reactions.filter((r) => r.postId === result.id);
    }
  }

  if (modelName === 'comment') {
    if (include.author) {
      result.author = state.users.find((u) => u.id === result.authorId) || null;
    }
    if (include.post) {
      result.post = state.posts.find((p) => p.id === result.postId) || null;
    }
  }

  if (modelName === 'project') {
    if (include.creator) {
      result.creator = state.users.find((u) => u.id === result.creatorId) || null;
    }
    if (include.members) {
      let members = state.projectMembers.filter((m) => m.projectId === result.id);
      if (typeof include.members === 'object' && include.members.include?.user) {
        members = members.map((m) => ({
          ...m,
          user: state.users.find((u) => u.id === m.userId) || null,
        }));
      }
      result.members = members;
    }
    if (include.milestones) {
      result.milestones = state.projectMilestones.filter((m) => m.projectId === result.id);
    }
    if (include.posts) {
      let posts = state.posts.filter((p) => p.voyageId === result.id);
      if (typeof include.posts === 'object' && include.posts.include?.author) {
        posts = posts.map((p) => ({
          ...p,
          author: state.users.find((u) => u.id === p.authorId) || null,
        }));
      }
      result.posts = posts;
    }
  }

  if (modelName === 'team') {
    if (include.captain) {
      result.captain = state.users.find((u) => u.id === result.captainId) || null;
    }
    if (include.members) {
      let members = state.teamMembers.filter((m) => m.teamId === result.id);
      if (typeof include.members === 'object' && include.members.include?.user) {
        const userInclude = typeof include.members.include.user === 'object' ? include.members.include.user : {};
        members = members.map((m) => {
          let u = state.users.find((user) => user.id === m.userId) || null;
          if (u && userInclude.include) {
            u = attachRelations('user', u, userInclude.include, state);
          }
          return { ...m, user: u };
        });
      }
      result.members = members;
    }
    if (include.requirements) {
      result.requirements = state.teamRequirements.filter((r) => r.teamId === result.id);
    }
    if (include.agreement) {
      result.agreement = state.teamAgreements.find((a) => a.teamId === result.id) || null;
    }
    if (include.voyages) {
      result.voyages = state.projects.filter((p) => p.crewId === result.id);
    }
  }

  if (modelName === 'teamMember') {
    if (include.user) {
      result.user = state.users.find((u) => u.id === result.userId) || null;
    }
    if (include.team) {
      result.team = state.teams.find((t) => t.id === result.teamId) || null;
    }
  }

  if (modelName === 'connection') {
    if (include.sender) {
      let sender = state.users.find((u) => u.id === result.senderId) || null;
      if (sender && typeof include.sender === 'object' && include.sender.include) {
        sender = attachRelations('user', sender, include.sender.include, state);
      }
      result.sender = sender;
    }
    if (include.receiver) {
      let receiver = state.users.find((u) => u.id === result.receiverId) || null;
      if (receiver && typeof include.receiver === 'object' && include.receiver.include) {
        receiver = attachRelations('user', receiver, include.receiver.include, state);
      }
      result.receiver = receiver;
    }
  }

  if (modelName === 'mentorProfile') {
    if (include.user) {
      let u = state.users.find((user) => user.id === result.userId) || null;
      if (u && typeof include.user === 'object' && include.user.include) {
        u = attachRelations('user', u, include.user.include, state);
      }
      result.user = u;
    }
    if (include.requestsReceived) {
      let requests = state.mentorshipRequests.filter((r) => r.mentorId === result.id);
      if (typeof include.requestsReceived === 'object' && include.requestsReceived.include?.student) {
        requests = requests.map((r) => ({
          ...r,
          student: state.users.find((u) => u.id === r.studentId) || null,
        }));
      }
      result.requestsReceived = requests;
    }
  }

  if (modelName === 'mentorshipRequest') {
    if (include.student) {
      result.student = state.users.find((u) => u.id === result.studentId) || null;
    }
    if (include.mentor) {
      let m = state.mentorProfiles.find((mp) => mp.id === result.mentorId) || null;
      if (m && typeof include.mentor === 'object' && include.mentor.include?.user) {
        m = { ...m, user: state.users.find((u) => u.id === m.userId) || null };
      }
      result.mentor = m;
    }
  }

  if (modelName === 'dailyChallenge') {
    if (include.attempts) {
      result.attempts = state.dailyChallengeAttempts.filter((a) => a.challengeId === result.id);
    }
  }

  if (modelName === 'dailyChallengeAttempt') {
    if (include.challenge) {
      result.challenge = state.dailyChallenges.find((c) => c.id === result.challengeId) || null;
    }
    if (include.user) {
      result.user = state.users.find((u) => u.id === result.userId) || null;
    }
  }

  if (modelName === 'quiz') {
    if (include.questions) {
      result.questions = state.quizQuestions.filter((q) => q.quizId === result.id);
    }
    if (include.attempts) {
      result.attempts = state.quizAttempts.filter((a) => a.quizId === result.id);
    }
  }

  if (modelName === 'quizAttempt') {
    if (include.quiz) {
      result.quiz = state.quizzes.find((q) => q.id === result.quizId) || null;
    }
    if (include.user) {
      result.user = state.users.find((u) => u.id === result.userId) || null;
    }
  }

  if (modelName === 'badge') {
    if (include.userBadges) {
      result.userBadges = state.userBadges.filter((ub) => ub.badgeId === result.id);
    }
  }

  if (modelName === 'userBadge') {
    if (include.badge) {
      result.badge = state.badges.find((b) => b.id === result.badgeId) || null;
    }
    if (include.user) {
      result.user = state.users.find((u) => u.id === result.userId) || null;
    }
  }

  if (modelName === 'conversation') {
    if (include.members) {
      let members = state.conversationMembers.filter((m) => m.conversationId === result.id);
      if (typeof include.members === 'object' && include.members.include?.user) {
        members = members.map((m) => ({
          ...m,
          user: state.users.find((u) => u.id === m.userId) || null,
        }));
      }
      result.members = members;
    }
    if (include.messages) {
      let msgs = state.messages.filter((m) => m.conversationId === result.id && !m.isDeleted);
      if (include.messages.orderBy?.createdAt === 'desc') {
        msgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else {
        msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      if (include.messages.take) {
        msgs = msgs.slice(0, include.messages.take);
      }
      if (typeof include.messages === 'object' && include.messages.include?.sender) {
        msgs = msgs.map((m) => ({
          ...m,
          sender: state.users.find((u) => u.id === m.senderId) || null,
        }));
      }
      result.messages = msgs;
    }
  }

  if (modelName === 'message') {
    if (include.sender) {
      result.sender = state.users.find((u) => u.id === result.senderId) || null;
    }
    if (include.conversation) {
      result.conversation = state.conversations.find((c) => c.id === result.conversationId) || null;
    }
  }

  if (modelName === 'institution') {
    if (include.departments) {
      result.departments = state.departments.filter((d) => d.institutionId === result.id);
    }
  }

  return result;
}

// Helper to project fields according to Prisma select or include
function applySelectOrInclude(modelName: string, item: any, args: any, state: DbState): any {
  if (!item) return null;
  if (!args || (!args.select && !args.include)) {
    return deepClone(item);
  }

  if (args.include) {
    return attachRelations(modelName, item, args.include, state);
  }

  if (args.select) {
    // Build include from any nested relation selections
    const relationInclude: any = {};
    for (const [k, v] of Object.entries(args.select)) {
      if (v) {
        relationInclude[k] = v;
      }
    }
    const withRelations = attachRelations(modelName, item, relationInclude, state);
    const selected: any = {};

    for (const [k, v] of Object.entries(args.select)) {
      if (!v) continue;
      if (k === '_count') {
        const countRel = attachRelations(modelName, item, { _count: v }, state);
        selected._count = countRel._count;
      } else if (typeof v === 'object' && 'select' in (v as any)) {
        const nestedVal = withRelations[k];
        if (Array.isArray(nestedVal)) {
          selected[k] = nestedVal.map((elem) => {
            const sub: any = {};
            for (const [sk, sv] of Object.entries((v as any).select)) {
              if (sv) sub[sk] = elem[sk];
            }
            return sub;
          });
        } else if (nestedVal && typeof nestedVal === 'object') {
          const sub: any = {};
          for (const [sk, sv] of Object.entries((v as any).select)) {
            if (sv) sub[sk] = nestedVal[sk];
          }
          selected[k] = sub;
        } else {
          selected[k] = nestedVal;
        }
      } else {
        selected[k] = withRelations[k] !== undefined ? withRelations[k] : item[k];
      }
    }
    return selected;
  }

  return deepClone(item);
}

// Model-level CRUD Delegate Factory
export function createModelDelegate(modelName: string) {
  const tableKey = MODEL_TO_KEY[modelName];
  if (!tableKey) {
    throw new Error(`Unknown model '${modelName}'`);
  }

  return {
    findUnique: async (args: any = {}) => {
      const state = localStore.state;
      const list = (state[tableKey] as any[]) || [];
      const item = list.find((record) => matchesFilter(record, args.where, state));
      if (!item) return null;
      return applySelectOrInclude(modelName, item, args, state);
    },

    findFirst: async (args: any = {}) => {
      const state = localStore.state;
      let list = [...((state[tableKey] as any[]) || [])];
      if (args.where) {
        list = list.filter((record) => matchesFilter(record, args.where, state));
      }
      if (args.orderBy) {
        const [sortKey, sortOrder] = Object.entries(args.orderBy)[0] || ['id', 'asc'];
        list.sort((a, b) => {
          if (sortOrder === 'desc') return (b[sortKey] > a[sortKey] ? 1 : -1);
          return (a[sortKey] > b[sortKey] ? 1 : -1);
        });
      }
      const item = list[0] || null;
      if (!item) return null;
      return applySelectOrInclude(modelName, item, args, state);
    },

    findMany: async (args: any = {}) => {
      const state = localStore.state;
      let list = [...((state[tableKey] as any[]) || [])];

      if (args.where) {
        list = list.filter((record) => matchesFilter(record, args.where, state));
      }

      if (args.orderBy) {
        const [sortKey, sortOrder] = Object.entries(args.orderBy)[0] || ['id', 'asc'];
        list.sort((a, b) => {
          if (sortOrder === 'desc') return (b[sortKey] > a[sortKey] ? 1 : -1);
          return (a[sortKey] > b[sortKey] ? 1 : -1);
        });
      }

      if (args.cursor) {
        const cursorIdx = list.findIndex((record) => matchesFilter(record, args.cursor, state));
        if (cursorIdx >= 0) {
          list = list.slice(cursorIdx + (args.skip || 0));
        }
      } else if (args.skip) {
        list = list.slice(args.skip);
      }

      if (args.take) {
        list = list.slice(0, args.take);
      }

      return list.map((item) => applySelectOrInclude(modelName, item, args, state));
    },

    create: async (args: any) => {
      const state = localStore.state;
      const data = { ...args.data };
      const now = new Date().toISOString();

      const newId = data.id || `gen-${modelName}-${crypto.randomUUID().slice(0, 8)}`;
      const record: any = {
        id: newId,
        createdAt: now,
        updatedAt: now,
      };

      // Handle nested creates
      const nestedSkills = data.skills?.create;
      const nestedInterests = data.interests?.create;
      const nestedMembers = data.members?.create;
      const nestedRequirements = data.requirements?.create;
      const nestedAgreement = data.agreement?.create;
      const nestedMilestones = data.milestones?.create;
      const nestedQuestions = data.questions?.create;
      const nestedMentorProfile = data.mentorProfile?.create;

      delete data.skills;
      delete data.interests;
      delete data.members;
      delete data.requirements;
      delete data.agreement;
      delete data.milestones;
      delete data.questions;
      delete data.mentorProfile;

      Object.assign(record, data);
      (state[tableKey] as any[]).push(record);

      // Execute nested creations
      if (Array.isArray(nestedSkills)) {
        for (const s of nestedSkills) {
          state.userSkills.push({
            id: `sk-${crypto.randomUUID().slice(0, 8)}`,
            userId: newId,
            proficiency: 'BEGINNER',
            yearsOfExperience: 1,
            isVerified: false,
            ...s,
          });
        }
      }
      if (Array.isArray(nestedInterests)) {
        for (const i of nestedInterests) {
          state.userInterests.push({
            id: `int-${crypto.randomUUID().slice(0, 8)}`,
            userId: newId,
            ...i,
          });
        }
      }
      if (nestedMentorProfile) {
        state.mentorProfiles.push({
          id: `mp-${crypto.randomUUID().slice(0, 8)}`,
          userId: newId,
          rating: 5.0,
          totalMenteesHelped: 0,
          createdAt: now,
          ...nestedMentorProfile,
        });
      }
      if (nestedMembers) {
        if (Array.isArray(nestedMembers)) {
          for (const m of nestedMembers) {
            if (modelName === 'team') {
              state.teamMembers.push({ id: `tm-${crypto.randomUUID().slice(0, 8)}`, teamId: newId, joinedAt: now, ...m });
            } else if (modelName === 'conversation') {
              state.conversationMembers.push({ id: `cm-${crypto.randomUUID().slice(0, 8)}`, conversationId: newId, joinedAt: now, ...m });
            } else {
              state.projectMembers.push({ id: `pm-${crypto.randomUUID().slice(0, 8)}`, projectId: newId, ...m });
            }
          }
        } else {
          if (modelName === 'team') {
            state.teamMembers.push({ id: `tm-${crypto.randomUUID().slice(0, 8)}`, teamId: newId, joinedAt: now, ...nestedMembers });
          } else {
            state.projectMembers.push({ id: `pm-${crypto.randomUUID().slice(0, 8)}`, projectId: newId, ...nestedMembers });
          }
        }
      }
      if (Array.isArray(nestedRequirements)) {
        for (const r of nestedRequirements) {
          state.teamRequirements.push({
            id: `tr-${crypto.randomUUID().slice(0, 8)}`,
            teamId: newId,
            isFilled: false,
            priority: 'HIGH',
            ...r,
          });
        }
      }
      if (nestedAgreement) {
        state.teamAgreements.push({
          id: `ta-${crypto.randomUUID().slice(0, 8)}`,
          teamId: newId,
          updatedAt: now,
          ...nestedAgreement,
        });
      }
      if (Array.isArray(nestedMilestones)) {
        for (const ms of nestedMilestones) {
          state.projectMilestones.push({
            id: `ms-${crypto.randomUUID().slice(0, 8)}`,
            projectId: newId,
            isCompleted: false,
            ...ms,
          });
        }
      }
      if (Array.isArray(nestedQuestions)) {
        for (const q of nestedQuestions) {
          state.quizQuestions.push({
            id: `qq-${crypto.randomUUID().slice(0, 8)}`,
            quizId: newId,
            ...q,
          });
        }
      }

      localStore.save();
      return attachRelations(modelName, record, args.include, state);
    },

    createMany: async (args: any) => {
      const state = localStore.state;
      const list = args.data || [];
      const now = new Date().toISOString();
      for (const d of list) {
        const item = {
          id: d.id || `gen-${modelName}-${crypto.randomUUID().slice(0, 8)}`,
          createdAt: now,
          updatedAt: now,
          ...d,
        };
        (state[tableKey] as any[]).push(item);
      }
      localStore.save();
      return { count: list.length };
    },

    update: async (args: any) => {
      const state = localStore.state;
      const list = (state[tableKey] as any[]) || [];
      const index = list.findIndex((record) => matchesFilter(record, args.where, state));
      if (index === -1) {
        throw new Error(`Record to update not found in ${modelName}`);
      }

      const existing = list[index];
      const data = { ...args.data };

      // Handle increment / decrement operators
      for (const [key, val] of Object.entries(data)) {
        if (typeof val === 'object' && val !== null) {
          if ('increment' in val) {
            data[key] = (Number(existing[key]) || 0) + Number((val as any).increment);
          } else if ('decrement' in val) {
            data[key] = Math.max(0, (Number(existing[key]) || 0) - Number((val as any).decrement));
          }
        }
      }

      data.updatedAt = new Date().toISOString();
      const updated = { ...existing, ...data };
      list[index] = updated;

      localStore.save();
      return attachRelations(modelName, updated, args.include, state);
    },

    updateMany: async (args: any) => {
      const state = localStore.state;
      const list = (state[tableKey] as any[]) || [];
      let count = 0;
      const now = new Date().toISOString();

      for (let i = 0; i < list.length; i++) {
        if (matchesFilter(list[i], args.where, state)) {
          list[i] = { ...list[i], ...args.data, updatedAt: now };
          count++;
        }
      }
      if (count > 0) localStore.save();
      return { count };
    },

    upsert: async (args: any) => {
      const state = localStore.state;
      const list = (state[tableKey] as any[]) || [];
      const index = list.findIndex((record) => matchesFilter(record, args.where, state));

      if (index >= 0) {
        const existing = list[index];
        const data = { ...args.update, updatedAt: new Date().toISOString() };
        const updated = { ...existing, ...data };
        list[index] = updated;
        localStore.save();
        return attachRelations(modelName, updated, args.include, state);
      } else {
        const createData = { ...args.create };
        const now = new Date().toISOString();
        const record = {
          id: createData.id || `gen-${modelName}-${crypto.randomUUID().slice(0, 8)}`,
          createdAt: now,
          updatedAt: now,
          ...createData,
        };
        list.push(record);
        localStore.save();
        return attachRelations(modelName, record, args.include, state);
      }
    },

    delete: async (args: any) => {
      const state = localStore.state;
      const list = (state[tableKey] as any[]) || [];
      const index = list.findIndex((record) => matchesFilter(record, args.where, state));
      if (index === -1) {
        throw new Error(`Record to delete not found in ${modelName}`);
      }
      const [deleted] = list.splice(index, 1);
      localStore.save();
      return deleted;
    },

    deleteMany: async (args: any = {}) => {
      const state = localStore.state;
      const list = (state[tableKey] as any[]) || [];
      if (!args.where || Object.keys(args.where).length === 0) {
        const count = list.length;
        state[tableKey] = [] as any;
        if (count > 0) localStore.save();
        return { count };
      }
      const initialLen = list.length;
      state[tableKey] = list.filter((r) => !matchesFilter(r, args.where, state)) as any;
      const count = initialLen - state[tableKey].length;
      if (count > 0) localStore.save();
      return { count };
    },

    count: async (args: any = {}) => {
      const state = localStore.state;
      const list = (state[tableKey] as any[]) || [];
      if (!args.where || Object.keys(args.where).length === 0) {
        return list.length;
      }
      return list.filter((record) => matchesFilter(record, args.where, state)).length;
    },

    groupBy: async (args: any = {}) => {
      const state = localStore.state;
      let list = (state[tableKey] as any[]) || [];
      if (args.where) {
        list = list.filter((record) => matchesFilter(record, args.where, state));
      }

      const byField = Array.isArray(args.by) ? args.by[0] : args.by;
      const groups = new Map<any, number>();

      for (const item of list) {
        const val = item[byField];
        groups.set(val, (groups.get(val) || 0) + 1);
      }

      const results = [];
      for (const [key, count] of groups.entries()) {
        results.push({ [byField]: key, _count: count });
      }
      return results;
    },
  };
}
