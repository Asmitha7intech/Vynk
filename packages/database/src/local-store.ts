import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { PGlite } from '@electric-sql/pglite';

function getWorkspaceRoot(): string {
  let curr = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.resolve(curr, 'pnpm-workspace.yaml'))) {
      return curr;
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  curr = __dirname;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.resolve(curr, 'pnpm-workspace.yaml'))) {
      return curr;
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return process.cwd();
}

function getDatabaseConfig(): { isTest: boolean; dbDirPath: string | null } {
  const isTest = process.env.NODE_ENV === 'test' || process.env.APP_ENV === 'test';
  const root = getWorkspaceRoot();
  const devDir = path.resolve(root, 'data', 'pglite_dev');

  // Guard 1: Refuse test mode against development database directory
  if (isTest) {
    if (process.env.DATABASE_DIR && path.resolve(process.env.DATABASE_DIR) === devDir) {
      throw new Error('[FATAL GUARD]: Test execution is strictly forbidden against the development database directory!');
    }
    return { isTest: true, dbDirPath: null }; // Isolated in-memory PGlite for tests
  }

  // Guard 2: Refuse dev server against test database directory
  if (process.env.DATABASE_DIR && process.env.DATABASE_DIR.includes('test')) {
    throw new Error('[FATAL GUARD]: Development server must not connect to a test database directory!');
  }

  return { isTest: false, dbDirPath: devDir };
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
  eventOutboxes: any[];
  recommendationFeedbacks: any[];
  sessions: any[];
  passwordResetTokens: any[];
  projectJoinRequests: any[];
  projectTasks: any[];
  projectDiscussions: any[];
  projectActivities: any[];
  classroomDirectories: any[];
  bigDataJobs: any[];
  blocks: any[];
  auditLogs: any[];
  emailVerificationTokens: any[];
  notificationPreferences: any[];
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
    eventOutboxes: [],
    recommendationFeedbacks: [],
    sessions: [],
    passwordResetTokens: [],
    projectJoinRequests: [],
    projectTasks: [],
    projectDiscussions: [],
    projectActivities: [],
    classroomDirectories: [],
    bigDataJobs: [],
    blocks: [],
    auditLogs: [],
    emailVerificationTokens: [],
    notificationPreferences: [],
  };
}

class LocalStoreEngine {
  public dbDirPath: string | null;
  public isTest: boolean;
  public state: DbState;
  public pg: PGlite | null = null;
  private saveTimeout: NodeJS.Timeout | null = null;
  private initialized: boolean = false;

  constructor() {
    const config = getDatabaseConfig();
    this.isTest = config.isTest;
    this.dbDirPath = config.dbDirPath;
    this.state = createEmptyState();
    this.init();
  }

  public init(): void {
    if (this.initialized) return;
    try {
      if (this.isTest) {
        this.pg = new PGlite();
        console.log('[VYNK DATABASE ENGINE]: ACTIVE = PGlite (Isolated In-Memory PostgreSQL 16) [TEST ISOLATION ACTIVE]');
      } else {
        if (!fs.existsSync(this.dbDirPath!)) {
          fs.mkdirSync(this.dbDirPath!, { recursive: true });
        }
        this.pg = new PGlite(this.dbDirPath!);
        console.log(`[VYNK DATABASE ENGINE]: ACTIVE = PGlite (Embedded PostgreSQL 16) | DIRECTORY = ${this.dbDirPath}`);
      }

      this.initPgSchema();
      this.load();
      this.initialized = true;
    } catch (err) {
      console.error('[VYNK DATABASE ENGINE ERROR]: Failed to initialize PGlite engine:', err);
      this.pg = new PGlite();
      this.load();
      this.initialized = true;
    }
  }

  private initPgSchema(): void {
    if (!this.pg) return;
    try {
      this.pg.exec(`CREATE TABLE IF NOT EXISTS _vynk_store (key TEXT PRIMARY KEY, payload TEXT, updated_at TIMESTAMPTZ);`).catch(() => {});
    } catch {}
  }

  public load(): void {
    try {
      if (!this.isTest && this.dbDirPath) {
        const storeFile = path.join(this.dbDirPath, 'store.json');
        if (fs.existsSync(storeFile)) {
          const raw = fs.readFileSync(storeFile, 'utf-8');
          const parsed = JSON.parse(raw);
          this.state = { ...createEmptyState(), ...parsed };
          console.log(`[VYNK DATABASE]: Loaded persistent state from ${storeFile} (${this.state.users.length} users)`);
          return;
        }
      }

      // If fresh database, seed reference data only (institutions, departments, badges)
      this.state = createEmptyState();
      this.seedInitialData();
      this.saveSync();
    } catch (err) {
      console.warn(`[VYNK DATABASE]: Failed to load database state, initializing clean store:`, err);
      this.state = createEmptyState();
      this.seedInitialData();
      this.saveSync();
    }
  }

  public resetForTest(): void {
    if (!this.isTest) {
      throw new Error('[FATAL GUARD]: resetForTest can only be executed in test mode!');
    }
    this.state = createEmptyState();
    this.seedInitialData();
  }

  public save(): void {
    this.saveSync();
  }

  public saveSync(): void {
    if (this.isTest) {
      // In test mode: memory only, NEVER touch dev files
      return;
    }

    try {
      if (this.dbDirPath) {
        if (!fs.existsSync(this.dbDirPath)) {
          fs.mkdirSync(this.dbDirPath, { recursive: true });
        }
        const storeFile = path.join(this.dbDirPath, 'store.json');
        const serialized = JSON.stringify(this.state, null, 2);
        try {
          const tmpPath = `${storeFile}.tmp`;
          fs.writeFileSync(tmpPath, serialized, 'utf-8');
          fs.renameSync(tmpPath, storeFile);
        } catch {
          fs.writeFileSync(storeFile, serialized, 'utf-8');
        }

        // Asynchronously sync into PGlite SQL table
        if (this.pg) {
          this.pg.query(
            'INSERT INTO _vynk_store (key, payload, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW();',
            ['state', serialized]
          ).catch(() => {});
        }
      }
    } catch (err) {
      console.error('[VYNK DATABASE]: Error saving database to disk:', err);
    }
  }

  public seedInitialData(): void {
    const state = this.state;
    const now = new Date().toISOString();

    // 1. Institutions
    const mitInstId = 'inst-mit-001';
    const stanfordInstId = 'inst-stanford-002';
    const berkeleyInstId = 'inst-berkeley-003';
    const cmuInstId = 'inst-cmu-004';
    const citInstId = 'inst-cit-005';

    state.institutions = [
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

    // Load curated reference challenges and quizzes
    try {
      const refPath = path.resolve(__dirname, 'reference-data.json');
      if (fs.existsSync(refPath)) {
        const refData = JSON.parse(fs.readFileSync(refPath, 'utf8'));
        const today = new Date().toISOString().split('T')[0];
        state.dailyChallenges = (refData.dailyChallenges || []).map((c: any, i: number) => i === 0 ? { ...c, activeDate: today } : c);
        state.quizzes = refData.quizzes || [];
        state.quizQuestions = refData.quizQuestions || [];
      }
    } catch {}

    // Canonical owner initializes with zero synthetic XP/badges and mustChangePassword=true
    const ownerEmail = (process.env.OWNER_EMAIL || 'asmitha7intech@gmail.com').toLowerCase().trim();
    const ownerUsername = (process.env.OWNER_USERNAME || 'asmitha').toLowerCase().trim();
    const ownerDisplayName = process.env.OWNER_DISPLAY_NAME || 'Asmitha S';

    const canonicalOwner = {
      id: 'owner-asmitha-canonical',
      createdAt: now,
      updatedAt: now,
      email: ownerEmail,
      username: ownerUsername,
      displayName: ownerDisplayName,
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$IbZD14Er0iLyJlWgMdk8TQ$9fJw48AJ+42J9pPFD1cM05V+Q/uVZVA7NrrB8F2bE8U',
      college: 'Chennai Institute of Technology',
      department: 'Computer Science',
      graduationYear: 2026,
      role: 'SUPER_ADMIN',
      mustChangePassword: true,
      xp: 0,
      level: 1,
      reputationScore: 100,
      streakDays: 0,
      headline: 'Founder & Lead Architect @ VYNK',
      bio: 'Campus collaboration, technical leadership, and engineering excellence.',
      isAvailableForCrews: true,
      isAvailableForMentorship: true,
    };

    state.users = [canonicalOwner];
    state.userSkills = [];
    state.userInterests = [];
    state.mentorProfiles = [];
    state.connections = [];
    state.projects = [];
    state.projectMembers = [];
    state.projectMilestones = [];
    state.teams = [];
    state.teamMembers = [];
    state.teamRequirements = [];
    state.teamAgreements = [];
    state.userBadges = [];
    state.posts = [];
    state.comments = [];
    state.reactions = [];
    state.conversations = [];
    state.conversationMembers = [];
    state.messages = [];
    state.studentVerifications = [];
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
  xpTransaction: 'xPTransactions',
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
  eventOutbox: 'eventOutboxes',
  recommendationFeedback: 'recommendationFeedbacks',
  session: 'sessions',
  passwordResetToken: 'passwordResetTokens',
  projectJoinRequest: 'projectJoinRequests',
  projectTask: 'projectTasks',
  projectDiscussion: 'projectDiscussions',
  projectActivity: 'projectActivities',
  classroomDirectory: 'classroomDirectories',
  bigDataJob: 'bigDataJobs',
  block: 'blocks',
  auditLog: 'auditLogs',
  emailVerificationToken: 'emailVerificationTokens',
  notificationPreference: 'notificationPreferences',
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
      if ('teamId' in item || 'category' in item || 'captainId' in item) {
        memberList = state.teamMembers.filter((m) => m.teamId === item.id);
      } else if ('type' in item && (item.type === 'DIRECT' || item.type === 'CREW' || item.type === 'MENTORSHIP' || 'lastMessageAt' in item)) {
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
    if (include.joinRequests) {
      let requests = (state.projectJoinRequests || []).filter((r) => r.projectId === result.id);
      if (typeof include.joinRequests === 'object' && include.joinRequests.include?.user) {
        requests = requests.map((r) => ({
          ...r,
          user: state.users.find((u) => u.id === r.userId) || null,
        }));
      }
      result.joinRequests = requests;
    }
    if (include.tasks) {
      let tasks = (state.projectTasks || []).filter((t) => t.projectId === result.id);
      if (typeof include.tasks === 'object' && include.tasks.include?.assignee) {
        tasks = tasks.map((t) => ({
          ...t,
          assignee: t.assigneeId ? state.users.find((u) => u.id === t.assigneeId) || null : null,
        }));
      }
      result.tasks = tasks;
    }
    if (include.discussions) {
      let discussions = (state.projectDiscussions || []).filter((d) => d.projectId === result.id && !d.isDeleted);
      discussions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      if (typeof include.discussions === 'object' && include.discussions.include?.author) {
        discussions = discussions.map((d) => ({
          ...d,
          author: state.users.find((u) => u.id === d.authorId) || null,
        }));
      }
      result.discussions = discussions;
    }
    if (include.activities) {
      let activities = (state.projectActivities || []).filter((a) => a.projectId === result.id);
      activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      result.activities = activities;
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

  if (modelName === 'community') {
    if (include.creator) {
      result.creator = state.users.find((u) => u.id === result.creatorId) || null;
    }
    if (include.members) {
      let members = state.communityMembers.filter((m) => m.communityId === result.id);
      if (typeof include.members === 'object' && include.members.include?.user) {
        members = members.map((m) => ({
          ...m,
          user: state.users.find((u) => u.id === m.userId) || null,
        }));
      }
      result.members = members;
    }
    if (include.posts) {
      let posts = state.posts.filter((p) => p.communityId === result.id);
      if (typeof include.posts === 'object' && include.posts.include?.author) {
        posts = posts.map((p) => ({
          ...p,
          author: state.users.find((u) => u.id === p.authorId) || null,
        }));
      }
      result.posts = posts;
    }
    if (include._count?.select?.members) {
      result._count = {
        ...(result._count || {}),
        members: state.communityMembers.filter((m) => m.communityId === result.id && m.status === 'APPROVED').length,
      };
    }
  }

  if (modelName === 'communityMember') {
    if (include.user) {
      result.user = state.users.find((u) => u.id === result.userId) || null;
    }
    if (include.community) {
      result.community = state.communities.find((c) => c.id === result.communityId) || null;
    }
  }

  if (modelName === 'projectJoinRequest') {
    if (include.user) {
      result.user = state.users.find((u) => u.id === result.userId) || null;
    }
    if (include.project) {
      result.project = state.projects.find((p) => p.id === result.projectId) || null;
    }
  }

  if (modelName === 'session') {
    if (include.user) {
      result.user = state.users.find((u) => u.id === result.userId) || null;
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

      if (modelName === 'message') {
        record.isDeleted = false;
        record.attachments = [];
      }
      if (modelName === 'notification') {
        record.isRead = false;
      }

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
