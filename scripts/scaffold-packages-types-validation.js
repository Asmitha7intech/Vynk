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

// ==========================================
// PACKAGES/TYPES
// ==========================================
writeFile(path.join(root, 'packages/types/package.json'), JSON.stringify({
  name: '@vynk/types',
  version: '1.0.0',
  private: true,
  main: './src/index.ts',
  types: './src/index.ts',
  scripts: {
    'typecheck': 'tsc --noEmit'
  },
  devDependencies: {
    'typescript': '^5.7.3'
  }
}, null, 2));

writeFile(path.join(root, 'packages/types/tsconfig.json'), JSON.stringify({
  extends: '../config/tsconfig.base.json',
  compilerOptions: {
    rootDir: './src',
    outDir: './dist',
    declaration: true
  },
  include: ['src/**/*']
}, null, 2));

writeFile(path.join(root, 'packages/types/src/index.ts'), `
// -------------------------------------------------------------
// VYNK CANONICAL DOMAIN TYPES & INTERFACES
// -------------------------------------------------------------

export type Role = 'STUDENT' | 'MENTOR' | 'MODERATOR' | 'ORGANIZATION' | 'ADMIN' | 'SUPER_ADMIN';

export type VynkStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';

export type PostType =
  | 'TEXT'
  | 'VOYAGE_LAUNCH'
  | 'BOUNTY_EARNED'
  | 'QUESTION'
  | 'POLL'
  | 'HACKATHON_DISPATCH'
  | 'LEARNING_NOTE'
  | 'EVENT'
  | 'OPPORTUNITY';

export type SkillProficiency = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export type CrewRole = 'CAPTAIN' | 'LEAD' | 'CONTRIBUTOR' | 'ADVISOR';

export type MentorshipStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED' | 'CANCELLED';

export type ConversationType = 'DIRECT' | 'CREW' | 'MENTOR';

export type QuestDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export type LeaderboardScope = 'GLOBAL' | 'COLLEGE' | 'DEPARTMENT' | 'SKILL' | 'WEEKLY';

export type NotificationType =
  | 'VYNK_REQUEST'
  | 'VYNK_ACCEPTED'
  | 'CREW_INVITE'
  | 'CREW_JOINED'
  | 'MENTOR_REQUEST'
  | 'MENTOR_ACCEPTED'
  | 'NEW_MESSAGE'
  | 'BOUNTY_UNLOCKED'
  | 'LEVEL_UP'
  | 'XP_AWARDED'
  | 'POST_LIKE'
  | 'POST_COMMENT';

// -------------------------------------------------------------
// 1. USER & PROFILE
// -------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
  headline?: string | null;
  college?: string | null;
  department?: string | null;
  graduationYear?: number | null;
  role: Role;
  xp: number;
  level: number;
  reputationScore: number;
  streakDays: number;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  isAvailableForCrews: boolean;
  isAvailableForMentorship: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSkill {
  id: string;
  userId: string;
  skillName: string;
  category: string;
  proficiency: SkillProficiency;
  yearsOfExperience: number;
  evidenceUrl?: string | null;
  isVerified: boolean;
}

export interface UserInterest {
  id: string;
  userId: string;
  name: string;
  category: string;
}

export interface UserProfileSummary {
  user: User;
  skills: UserSkill[];
  interests: UserInterest[];
  stats: {
    vynksCount: number;
    followersCount: number;
    followingCount: number;
    voyagesCount: number;
    crewsCount: number;
    bountiesCount: number;
    questsCompleted: number;
  };
  bounties: BountyBadge[];
}

// -------------------------------------------------------------
// 2. VYNKS & SOCIAL GRAPH
// -------------------------------------------------------------

export interface VynkConnection {
  id: string;
  senderId: string;
  receiverId: string;
  status: VynkStatus;
  createdAt: string;
  updatedAt: string;
  sender?: User;
  receiver?: User;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
  follower?: User;
  following?: User;
}

export interface Post {
  id: string;
  authorId: string;
  type: PostType;
  title?: string | null;
  content: string;
  mediaUrls: string[];
  tags: string[];
  voyageId?: string | null;
  bountyId?: string | null;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLikedByMe?: boolean;
  isSavedByMe?: boolean;
  createdAt: string;
  updatedAt: string;
  author: User;
  voyage?: VoyageSummary | null;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  parentId?: string | null;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
  author: User;
}

// -------------------------------------------------------------
// 3. VOYAGES (PROJECT SHOWCASES)
// -------------------------------------------------------------

export interface Voyage {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  coverImageUrl?: string | null;
  screenshots: string[];
  technologies: string[];
  githubUrl?: string | null;
  demoUrl?: string | null;
  videoUrl?: string | null;
  category: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'MAINTAINED' | 'HACKATHON_WINNER';
  xpRewarded: number;
  likesCount: number;
  viewsCount: number;
  creatorId: string;
  crewId?: string | null;
  createdAt: string;
  updatedAt: string;
  creator: User;
  members: VoyageMember[];
  milestones: VoyageMilestone[];
}

export interface VoyageSummary {
  id: string;
  title: string;
  tagline: string;
  coverImageUrl?: string | null;
  technologies: string[];
  githubUrl?: string | null;
  demoUrl?: string | null;
  status: string;
}

export interface VoyageMember {
  id: string;
  voyageId: string;
  userId: string;
  role: string;
  contributions: string;
  user: User;
}

export interface VoyageMilestone {
  id: string;
  voyageId: string;
  title: string;
  description: string;
  isCompleted: boolean;
  dueDate?: string | null;
}

// -------------------------------------------------------------
// 4. CREWS (TEAMS & SQUADS)
// -------------------------------------------------------------

export interface Crew {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  category: string;
  targetHackathon?: string | null;
  maxMembers: number;
  commitmentHoursPerWeek: number;
  deadline?: string | null;
  isRecruiting: boolean;
  captainId: string;
  createdAt: string;
  updatedAt: string;
  captain: User;
  members: CrewMember[];
  requirements: CrewRequirement[];
  agreement?: TeamAgreement | null;
}

export interface CrewMember {
  id: string;
  crewId: string;
  userId: string;
  role: CrewRole;
  assignedRoleName: string; // e.g. "Frontend Architect", "ML Engineer"
  joinedAt: string;
  user: User;
}

export interface CrewRequirement {
  id: string;
  crewId: string;
  roleName: string;
  requiredSkills: string[];
  description: string;
  isFilled: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface TeamAgreement {
  id: string;
  crewId: string;
  commitmentDescription: string;
  weeklyHours: number;
  primaryChannel: string;
  decisionProtocol: 'CONSENSUS' | 'CAPTAIN_DECIDES' | 'MAJORITY_VOTE';
  codeStandardRules: string[];
  meetingSchedule: string;
  acceptedUserIds: string[];
  updatedAt: string;
}

export interface CrewMatchRecommendation {
  user: User;
  matchScore: number; // 0 - 100
  skillComplementarityScore: number; // 0 - 100
  interestScore: number; // 0 - 100
  roleCompatibilityScore: number; // 0 - 100
  availabilityScore: number; // 0 - 100
  experienceScore: number; // 0 - 100
  workingStyleScore: number; // 0 - 100
  matchingSkills: string[];
  missingSkillsCovered: string[];
  explanation: string;
}

// -------------------------------------------------------------
// 5. QUESTS (CHALLENGES & QUIZZES)
// -------------------------------------------------------------

export interface DailyChallenge {
  id: string;
  title: string;
  category: string;
  difficulty: QuestDifficulty;
  snippet: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  xpAward: number;
  activeDate: string; // YYYY-MM-DD
}

export interface DailyChallengeAttempt {
  id: string;
  challengeId: string;
  userId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  xpEarned: number;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  codeSnippet?: string | null;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  topic: string;
}

export interface Quiz {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: QuestDifficulty;
  timeLimitMinutes: number;
  xpReward: number;
  questionsCount: number;
  questions?: QuizQuestion[];
  isWeeklySpecial: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  maxScore: number;
  percentage: number;
  timeSpentSeconds: number;
  xpEarned: number;
  answers: { questionId: string; selectedIndex: number; isCorrect: boolean }[];
  weakTopics: string[];
  recommendedTopics: string[];
  createdAt: string;
}

// -------------------------------------------------------------
// 6. GAMIFICATION, XP, BOUNTIES & LEADERBOARDS
// -------------------------------------------------------------

export interface XPTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  sourceType: string;
  sourceId?: string | null;
  createdAt: string;
}

export interface BountyBadge {
  id: string;
  code: string;
  title: string;
  description: string;
  iconName: string;
  category: 'SKILL' | 'COLLABORATION' | 'HACKATHON' | 'LEARNING' | 'COMMUNITY';
  xpThreshold?: number;
  unlockedAt?: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  user: User;
  score: number;
  trend: 'UP' | 'DOWN' | 'SAME';
  previousRank?: number;
}

// -------------------------------------------------------------
// 7. MENTORS & MENTORSHIP
// -------------------------------------------------------------

export interface MentorProfile {
  id: string;
  userId: string;
  headline: string;
  companyOrCollege: string;
  yearsOfExperience: number;
  about: string;
  expertiseCategories: string[];
  skills: string[];
  weeklyHoursAvailable: number;
  maxMentees: number;
  isAcceptingRequests: boolean;
  totalMenteesHelped: number;
  rating: number;
  createdAt: string;
  user: User;
}

export interface MentorshipRequest {
  id: string;
  studentId: string;
  mentorId: string;
  topic: string;
  goalDescription: string;
  currentChallenge: string;
  proposedMeetingTimes: string;
  status: MentorshipStatus;
  mentorNote?: string | null;
  conversationId?: string | null;
  createdAt: string;
  updatedAt: string;
  student: User;
  mentor: MentorProfile;
}

// -------------------------------------------------------------
// 8. MESSAGING & CHAT
// -------------------------------------------------------------

export interface Conversation {
  id: string;
  type: ConversationType;
  title?: string | null;
  crewId?: string | null;
  mentorshipRequestId?: string | null;
  lastMessageAt?: string | null;
  lastMessageText?: string | null;
  unreadCount?: number;
  members: User[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachments: string[];
  replyToId?: string | null;
  isDeleted: boolean;
  createdAt: string;
  sender: User;
  reactions?: { emoji: string; count: number; users: string[] }[];
}

export interface PresenceStatus {
  userId: string;
  isOnline: boolean;
  lastSeenAt: string;
}

// -------------------------------------------------------------
// 9. NOTIFICATIONS & SAFETY
// -------------------------------------------------------------

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'USER' | 'POST' | 'MESSAGE' | 'CREW' | 'VOYAGE';
  targetId: string;
  reason: string;
  details?: string | null;
  status: 'PENDING' | 'REVIEWED' | 'ACTIONED' | 'DISMISSED';
  createdAt: string;
}

// -------------------------------------------------------------
// 10. API & AUTH DTOs
// -------------------------------------------------------------

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  role: Role;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
`);

// ==========================================
// PACKAGES/VALIDATION
// ==========================================
writeFile(path.join(root, 'packages/validation/package.json'), JSON.stringify({
  name: '@vynk/validation',
  version: '1.0.0',
  private: true,
  main: './src/index.ts',
  types: './src/index.ts',
  scripts: {
    'typecheck': 'tsc --noEmit'
  },
  dependencies: {
    'zod': '^3.24.2'
  },
  devDependencies: {
    'typescript': '^5.7.3'
  }
}, null, 2));

writeFile(path.join(root, 'packages/validation/tsconfig.json'), JSON.stringify({
  extends: '../config/tsconfig.base.json',
  compilerOptions: {
    rootDir: './src',
    outDir: './dist',
    declaration: true
  },
  include: ['src/**/*']
}, null, 2));

writeFile(path.join(root, 'packages/validation/src/index.ts'), `
import { z } from 'zod';

// Auth Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50),
  college: z.string().min(2, 'College name is required'),
  department: z.string().min(2, 'Department is required'),
  graduationYear: z.number().int().min(2020).max(2035),
  role: z.enum(['STUDENT', 'MENTOR', 'ORGANIZATION']).default('STUDENT'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Profile & Skills Schemas
export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  headline: z.string().max(120).optional(),
  college: z.string().optional(),
  department: z.string().optional(),
  graduationYear: z.number().int().min(2020).max(2035).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  githubUrl: z.string().url().optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable(),
  portfolioUrl: z.string().url().optional().nullable(),
  isAvailableForCrews: z.boolean().optional(),
  isAvailableForMentorship: z.boolean().optional(),
});

export const addSkillSchema = z.object({
  skillName: z.string().min(1, 'Skill name is required').max(50),
  category: z.string().min(1, 'Category is required'),
  proficiency: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  yearsOfExperience: z.number().min(0).max(20).default(1),
  evidenceUrl: z.string().url().optional().nullable(),
});

// Posts & Social Schemas
export const createPostSchema = z.object({
  content: z.string().min(1, 'Post content cannot be empty').max(3000),
  type: z.enum([
    'TEXT',
    'VOYAGE_LAUNCH',
    'BOUNTY_EARNED',
    'QUESTION',
    'POLL',
    'HACKATHON_DISPATCH',
    'LEARNING_NOTE',
    'EVENT',
    'OPPORTUNITY'
  ]).default('TEXT'),
  title: z.string().max(150).optional().nullable(),
  mediaUrls: z.array(z.string().url()).default([]),
  tags: z.array(z.string()).default([]),
  voyageId: z.string().uuid().optional().nullable(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000),
  parentId: z.string().uuid().optional().nullable(),
});

// Crew Schemas
export const createCrewSchema = z.object({
  name: z.string().min(3, 'Crew name must be at least 3 characters').max(50),
  tagline: z.string().min(5, 'Tagline is required').max(120),
  description: z.string().min(20, 'Provide a description of what the Crew is building').max(2000),
  category: z.string().min(2, 'Category is required'),
  targetHackathon: z.string().optional().nullable(),
  maxMembers: z.number().int().min(2).max(10).default(4),
  commitmentHoursPerWeek: z.number().int().min(1).max(60).default(10),
  deadline: z.string().optional().nullable(),
  requirements: z.array(z.object({
    roleName: z.string().min(2),
    requiredSkills: z.array(z.string()).min(1),
    description: z.string().min(5),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('HIGH')
  })).min(1, 'Define at least one open role requirement')
});

export const updateTeamAgreementSchema = z.object({
  commitmentDescription: z.string().min(10),
  weeklyHours: z.number().min(1).max(60),
  primaryChannel: z.string().min(2),
  decisionProtocol: z.enum(['CONSENSUS', 'CAPTAIN_DECIDES', 'MAJORITY_VOTE']),
  codeStandardRules: z.array(z.string()).min(1),
  meetingSchedule: z.string().min(3),
});

// Voyage Schemas
export const createVoyageSchema = z.object({
  title: z.string().min(3, 'Project title is required').max(80),
  tagline: z.string().min(5, 'Tagline is required').max(150),
  description: z.string().min(30, 'Detailed description is required').max(5000),
  category: z.string().min(2),
  technologies: z.array(z.string()).min(1, 'At least 1 technology must be specified'),
  githubUrl: z.string().url().optional().nullable(),
  demoUrl: z.string().url().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  screenshots: z.array(z.string().url()).default([]),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'MAINTAINED', 'HACKATHON_WINNER']).default('IN_PROGRESS'),
  crewId: z.string().uuid().optional().nullable(),
});

// Quests & Quizzes Schemas
export const submitChallengeSchema = z.object({
  challengeId: z.string().uuid(),
  selectedOptionIndex: z.number().int().min(0).max(5),
});

export const submitQuizSchema = z.object({
  quizId: z.string().uuid(),
  timeSpentSeconds: z.number().int().min(1),
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    selectedOptionIndex: z.number().int().min(0).max(5),
  })).min(1),
});

// Mentorship Schemas
export const createMentorProfileSchema = z.object({
  headline: z.string().min(5).max(120),
  companyOrCollege: z.string().min(2),
  yearsOfExperience: z.number().min(0).max(40),
  about: z.string().min(20).max(2000),
  expertiseCategories: z.array(z.string()).min(1),
  skills: z.array(z.string()).min(1),
  weeklyHoursAvailable: z.number().min(1).max(20).default(3),
  maxMentees: z.number().min(1).max(10).default(3),
});

export const requestMentorshipSchema = z.object({
  mentorId: z.string().uuid(),
  topic: z.string().min(3).max(100),
  goalDescription: z.string().min(20, 'Explain your goals in detail').max(1000),
  currentChallenge: z.string().min(20, 'Describe the specific problem you need guidance on').max(1000),
  proposedMeetingTimes: z.string().min(5),
});

// Messaging Schemas
export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1, 'Message cannot be empty').max(4000),
  attachments: z.array(z.string().url()).default([]),
  replyToId: z.string().uuid().optional().nullable(),
});

export const reportSchema = z.object({
  targetType: z.enum(['USER', 'POST', 'MESSAGE', 'CREW', 'VOYAGE']),
  targetId: z.string().uuid(),
  reason: z.string().min(5).max(500),
  details: z.string().max(2000).optional().nullable(),
});
`);

console.log('Types and Validation packages created successfully!');
