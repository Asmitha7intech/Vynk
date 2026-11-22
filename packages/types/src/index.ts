// -------------------------------------------------------------
// VYNK PRODUCTION CANONICAL DOMAIN TYPES
// -------------------------------------------------------------

export type Role = 'STUDENT' | 'MENTOR' | 'MODERATOR' | 'CAMPUS_ADMIN' | 'VYNK_ADMIN' | 'ORGANIZATION' | 'ADMIN' | 'SUPER_ADMIN';

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
  isVerified?: boolean;
  mustChangePassword?: boolean;
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
  comments?: Comment[];
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
  joinRequests?: VoyageJoinRequest[];
  tasks?: VoyageTask[];
  discussions?: VoyageDiscussion[];
  activities?: VoyageActivity[];
  teamCapacity?: number;
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

export type ProjectJoinRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface VoyageJoinRequest {
  id: string;
  projectId: string;
  userId: string;
  roleName: string;
  message: string;
  skills: string[];
  status: ProjectJoinRequestStatus;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export type ProjectTaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export type ProjectTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface VoyageTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: ProjectTaskStatus;
  priority: ProjectTaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: User | null;
}

export interface VoyageDiscussion {
  id: string;
  projectId: string;
  authorId: string;
  content: string;
  isPinned?: boolean;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
  author?: User | null;
}

export interface VoyageActivity {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  action: string;
  details?: string;
  createdAt: string;
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
  sessionId?: string;
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


export interface Department {
  id: string;
  institutionId: string;
  name: string;
  code: string;
  studentCount?: number;
  createdAt: string;
}

export interface CrossDepartmentMatch {
  user: User;
  sharedInterests: string[];
  complementarySkills: string[];
  department: string;
  matchScore: number;
  matchReason: string;
}

export interface ScoreBreakdownFactor {
  category: string;
  xpContribution: number;
  description: string;
  percentageOfTotal: number;
}

export interface UserRankExplanation {
  rank: number;
  totalXp: number;
  scope: LeaderboardScope;
  factors: ScoreBreakdownFactor[];
  xpToNextRank: number;
  streakBonusApplied: number;
}

// -------------------------------------------------------------
// EVENT-DRIVEN ARCHITECTURE & BIG DATA TELEMETRY CONTRACTS
// -------------------------------------------------------------

export type VynkEventType =
  // Auth & Identity
  | 'USER_REGISTERED'
  | 'USER_LOGGED_IN'
  | 'USER_LOGGED_OUT'
  | 'USER_PASSWORD_RESET'
  | 'USER_AVATAR_UPDATED'
  | 'USER_PROFILE_UPDATED'
  | 'SKILL_ADDED'
  | 'SKILL_VERIFIED'
  | 'INTEREST_ADDED'
  // Posts & Interactions
  | 'POST_CREATED'
  | 'POST_LIKED'
  | 'POST_UNLIKED'
  | 'POST_COMMENTED'
  | 'POST_VIEWED'
  | 'FEED_SCROLLED'
  // Voyages (Projects)
  | 'VOYAGE_CREATED'
  | 'VOYAGE_UPDATED'
  | 'VOYAGE_STARRED'
  | 'VOYAGE_FORKED'
  | 'VOYAGE_MILESTONE_COMPLETED'
  | 'VOYAGE_JOIN_REQUESTED'
  | 'VOYAGE_JOIN_ACCEPTED'
  | 'VOYAGE_JOIN_REJECTED'
  | 'VOYAGE_TASK_CREATED'
  | 'VOYAGE_TASK_UPDATED'
  | 'VOYAGE_DISCUSSION_POSTED'
  // Crews (Teams)
  | 'CREW_CREATED'
  | 'CREW_UPDATED'
  | 'CREW_APPLICATION_SUBMITTED'
  | 'CREW_APPLICATION_ACCEPTED'
  | 'CREW_APPLICATION_REJECTED'
  | 'CREW_MEMBER_JOINED'
  | 'CREW_MEMBER_LEFT'
  // Quests & Challenges
  | 'DAILY_CHALLENGE_ATTEMPTED'
  | 'QUIZ_STARTED'
  | 'QUIZ_QUESTION_ANSWERED'
  | 'QUIZ_COMPLETED'
  // Mentorship
  | 'MENTORSHIP_REQUESTED'
  | 'MENTORSHIP_ACCEPTED'
  | 'MENTORSHIP_DECLINED'
  | 'MENTORSHIP_COMPLETED'
  // Messaging
  | 'CONVERSATION_CREATED'
  | 'MESSAGE_SENT'
  // Gamification & Progression
  | 'XP_EARNED'
  | 'LEVEL_UP'
  | 'BADGE_UNLOCKED'
  | 'STREAK_INCREMENTED'
  | 'STREAK_BROKEN'
  // Matching & Recommendation
  | 'MATCH_EXPLORED'
  | 'RECOMMENDATION_IMPRESSION'
  | 'RECOMMENDATION_CLICKED'
  | 'RECOMMENDATION_ACCEPTED'
  | 'RECOMMENDATION_DISMISSED'
  // Communities
  | 'COMMUNITY_CREATED'
  | 'COMMUNITY_UPDATED'
  | 'COMMUNITY_JOINED'
  | 'COMMUNITY_REQUESTED'
  | 'COMMUNITY_LEFT';

export interface EventMetadata {
  ip?: string;
  userAgent?: string;
  source?: string;
  clientTimestamp?: string;
  [key: string]: any;
}

export interface VynkEvent<T = any> {
  eventId: string;
  eventType: VynkEventType;
  timestamp: string;
  correlationId: string;
  causationId?: string;
  version: number;
  dataSource: 'PROD' | 'SYNTHETIC';
  userId?: string;
  college?: string;
  department?: string;
  payload: T;
  metadata?: EventMetadata;
}

export interface EventOutboxRecord {
  id: string;
  eventId: string;
  eventType: string;
  topic: string;
  partitionKey?: string | null;
  payload: string;
  status: 'PENDING' | 'PUBLISHED' | 'FAILED' | 'DEAD_LETTER';
  retryCount: number;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

export type RecommendationTargetType = 'CREW' | 'COLLABORATOR' | 'QUEST' | 'POST' | 'VOYAGE';
export type RecommendationFeedbackAction = 'CLICK' | 'ACCEPT' | 'DISMISS' | 'SAVE';

export interface RecommendationFeedbackRecord {
  id: string;
  userId: string;
  recommendationType: RecommendationTargetType;
  targetId: string;
  action: RecommendationFeedbackAction;
  context?: string | null;
  createdAt: string;
}

export interface KafkaTopicMetrics {
  topic: string;
  partitionCount: number;
  producedCount: number;
  lastProducedAt?: string;
  status: 'ACTIVE' | 'FALLBACK_LOCAL';
}

// -------------------------------------------------------------
// 12. CLASSROOM DIRECTORY
// -------------------------------------------------------------

export interface ClassroomDirectoryRecord {
  id: string;
  studentId: string;
  originalDisplayName: string;
  normalizedName: string;
  department: string;
  cohort: string;
  graduationYear: number;
  isClaimed: boolean;
  claimedUserId?: string | null;
  claimedAt?: string | null;
  claimVerificationMethod?: string | null;
  notes?: string | null;
  auditTrail: Array<{ timestamp: string; updatedBy: string; change: string }>;
  createdAt: string;
  updatedAt: string;
  claimedUser?: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl?: string | null;
    headline?: string | null;
  } | null;
}

// -------------------------------------------------------------
// 13. BIG DATA LAB & SYLLABUS JOBS
// -------------------------------------------------------------

export type BigDataConceptId =
  | 'concept-1' // HDFS Unstructured Import/Export
  | 'concept-2' // SQL <-> HDFS Import/Export
  | 'concept-3' // Hadoop MapReduce
  | 'concept-4' // MongoDB NoSQL
  | 'concept-5' // Apache Pig
  | 'concept-6'; // Apache Hive

export type BigDataJobStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

export type BigDataExecutionMode =
  | 'NATIVE'
  | 'HADOOP_STREAMING'
  | 'PIG_LATIN'
  | 'HIVE_METASTORE'
  | 'MONGODB_AGGREGATION'
  | 'LOCAL_FALLBACK';

export interface BigDataJobRecord {
  id: string;
  conceptId: BigDataConceptId;
  title: string;
  datasetName: string;
  status: BigDataJobStatus;
  startTime: string;
  endTime?: string | null;
  durationMs: number;
  inputPath: string;
  outputPath: string;
  inputRowCount: number;
  outputRowCount: number;
  rejectedRowCount: number;
  executionMode: BigDataExecutionMode;
  logs: string[];
  errorSummary?: string | null;
  outputPreview: any;
  metrics: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface BigDataServiceHealth {
  service: string;
  displayName: string;
  status: 'ONLINE' | 'OFFLINE' | 'LOCAL_FALLBACK';
  host?: string;
  port?: number;
  message: string;
  latencyMs?: number;
  lastChecked: string;
}

// -------------------------------------------------------------
// 14. COMMUNITIES & COLLABORATIVE SPACES
// -------------------------------------------------------------

export type CommunityRole = 'ADMIN' | 'MODERATOR' | 'MEMBER';
export type CommunityMembershipStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  category: string;
  tags?: string[];
  creatorId?: string | null;
  creator?: User | null;
  isPrivate?: boolean;
  createdAt: string;
  updatedAt?: string;
  members?: CommunityMember[];
  _count?: {
    members?: number;
    posts?: number;
  };
}

export interface CommunityMember {
  id: string;
  communityId: string;
  community?: Community;
  userId: string;
  user?: User;
  role: CommunityRole;
  status: CommunityMembershipStatus;
  joinedAt: string;
}

export * from './coimbatore-institutions';



