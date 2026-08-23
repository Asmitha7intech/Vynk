// -------------------------------------------------------------
// VYNK PRODUCTION CANONICAL DOMAIN TYPES
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
  emailVerified?: boolean;
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
  currentlyBuilding?: string | null;
  lookingFor?: string | null;
  availableFor?: string | null;
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
  assignedRoleName: string;
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
  matchScore: number;
  skillComplementarityScore: number;
  interestScore: number;
  roleCompatibilityScore: number;
  availabilityScore: number;
  experienceScore: number;
  workingStyleScore: number;
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
  activeDate: string;
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
  questionsCount?: number;
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
// 6. GAMIFICATION, XP & BOUNTIES
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
// 7. MENTORSHIP & EVENTS
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

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  location: string;
  coverUrl?: string | null;
  startsAt: string;
  endsAt: string;
  organizer: string;
  websiteUrl?: string | null;
  isFeatured: boolean;
  registrationsCount?: number;
  isRegisteredByMe?: boolean;
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
  statusText?: 'online' | 'away' | 'offline';
  lastSeenAt: string;
}

// -------------------------------------------------------------
// 9. ANALYTICS & ADMIN METRICS
// -------------------------------------------------------------

export interface PlatformAnalytics {
  totalUsers: number;
  activeUsersDAU: number;
  activeUsersWAU: number;
  activeUsersMAU: number;
  dauMauRatio: number;
  retentionD1: number;
  retentionD7: number;
  retentionD30: number;
  totalVoyages: number;
  totalCrews: number;
  totalQuestsCompleted: number;
  meaningfulWeeklyCollaborations: number;
  connectionAcceptanceRate: number;
  systemStatus: 'HEALTHY' | 'DEGRADED';
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
