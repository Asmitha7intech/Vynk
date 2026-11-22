import { z } from 'zod';

// -------------------------------------------------------------
// AUTH & ONBOARDING SCHEMAS
// -------------------------------------------------------------

export const RegisterSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .transform((e) => e.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-z0-9_]+$/, 'Username must contain only lowercase letters, numbers, and underscores')
    .transform((u) => u.toLowerCase()),
  displayName: z.string().trim().min(2, 'Display name must be at least 2 characters').max(50),
  college: z.string().trim().min(2, 'College / University name required'),
  department: z.string().trim().min(2, 'Department / Field of study required'),
  graduationYear: z.number().int().min(2020).max(2035).optional(),
});
export const registerSchema = RegisterSchema;

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .transform((e) => e.toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});
export const loginSchema = LoginSchema;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
export const refreshTokenSchema = RefreshTokenSchema;

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
export const forgotPasswordSchema = ForgotPasswordSchema;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});
export const resetPasswordSchema = ResetPasswordSchema;

export const OnboardingStepSchema = z.object({
  step: z.number().int().min(1).max(10),
  data: z.object({
    username: z.string().min(3).optional(),
    displayName: z.string().min(2).optional(),
    college: z.string().optional(),
    department: z.string().optional(),
    graduationYear: z.number().int().optional(),
    skills: z.array(z.object({
      skillName: z.string(),
      category: z.string(),
      proficiency: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
      yearsOfExperience: z.number(),
      evidenceUrl: z.string().url().optional().or(z.literal('')),
    })).optional(),
    interests: z.array(z.string()).optional(),
    currentGoals: z.array(z.string()).optional(),
    currentlyBuilding: z.string().optional(),
    lookingFor: z.string().optional(),
    availableFor: z.string().optional(),
    githubUrl: z.string().url().optional().or(z.literal('')),
    linkedinUrl: z.string().url().optional().or(z.literal('')),
    portfolioUrl: z.string().url().optional().or(z.literal('')),
    avatarUrl: z.string().optional(),
  }),
});

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  headline: z.string().max(120).optional(),
  bio: z.string().max(600).optional(),
  college: z.string().optional(),
  department: z.string().optional(),
  graduationYear: z.number().int().optional(),
  githubUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  avatarUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  currentlyBuilding: z.string().optional(),
  lookingFor: z.string().optional(),
  availableFor: z.string().optional(),
  isAvailableForCrews: z.boolean().optional(),
  isAvailableForMentorship: z.boolean().optional(),
});
export const updateProfileSchema = UpdateProfileSchema;

export const AddSkillSchema = z.object({
  skillName: z.string().min(1).max(50),
  category: z.string().min(1),
  proficiency: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  yearsOfExperience: z.number().min(0).max(30),
  evidenceUrl: z.string().url().optional().or(z.literal('')),
});
export const addSkillSchema = AddSkillSchema;

// -------------------------------------------------------------
// POSTS & SOCIAL FEED
// -------------------------------------------------------------

export const CreatePostSchema = z.object({
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
  title: z.string().max(120).optional(),
  content: z.string().min(1, 'Post content cannot be empty').max(3000),
  mediaUrls: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  voyageId: z.string().optional(),
});
export const createPostSchema = CreatePostSchema;

export const CreateCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000),
  parentId: z.string().uuid().optional(),
});
export const createCommentSchema = CreateCommentSchema;

// -------------------------------------------------------------
// VOYAGES (PROJECTS)
// -------------------------------------------------------------

export const CreateVoyageSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  tagline: z.string().min(5).max(160),
  description: z.string().min(20, 'Please describe your project problem and solution'),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  screenshots: z.array(z.string().url()).optional().default([]),
  technologies: z.array(z.string()).min(1, 'Add at least one technology/skill'),
  githubUrl: z.string().url().optional().or(z.literal('')),
  demoUrl: z.string().url().optional().or(z.literal('')),
  videoUrl: z.string().url().optional().or(z.literal('')),
  category: z.string().min(2),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'MAINTAINED', 'HACKATHON_WINNER']).default('IN_PROGRESS'),
  crewId: z.string().uuid().optional(),
  milestones: z.array(z.object({
    title: z.string().min(2),
    description: z.string(),
    dueDate: z.string().optional(),
  })).optional(),
});
export const createVoyageSchema = CreateVoyageSchema;

export const CreateProjectJoinRequestSchema = z.object({
  roleName: z.string().min(2, 'Role name required').max(50),
  message: z.string().min(10, 'Message must be at least 10 characters').max(500),
  skills: z.array(z.string()).default([]),
});
export const createProjectJoinRequestSchema = CreateProjectJoinRequestSchema;

export const UpdateProjectJoinRequestSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
});
export const updateProjectJoinRequestSchema = UpdateProjectJoinRequestSchema;

export const CreateProjectTaskSchema = z.object({
  title: z.string().min(2, 'Task title required').max(120),
  description: z.string().max(1000).default(''),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});
export const createProjectTaskSchema = CreateProjectTaskSchema;

export const UpdateProjectTaskSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});
export const updateProjectTaskSchema = UpdateProjectTaskSchema;

export const CreateProjectDiscussionSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000),
});
export const createProjectDiscussionSchema = CreateProjectDiscussionSchema;

export const CreateProjectMilestoneSchema = z.object({
  title: z.string().min(2, 'Milestone title required').max(100),
  description: z.string().max(500).default(''),
  dueDate: z.string().optional().nullable(),
});
export const createProjectMilestoneSchema = CreateProjectMilestoneSchema;

export const UpdateProjectMilestoneSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  isCompleted: z.boolean().optional(),
  dueDate: z.string().optional().nullable(),
});
export const updateProjectMilestoneSchema = UpdateProjectMilestoneSchema;

// -------------------------------------------------------------
// CREWS (TEAMS)
// -------------------------------------------------------------

export const CreateCrewSchema = z.object({
  name: z.string().min(3, 'Crew name must be at least 3 characters').max(60),
  tagline: z.string().min(5).max(120),
  description: z.string().min(20, 'Describe the crew mission & hackathon targets'),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  category: z.string().min(2),
  targetHackathon: z.string().optional(),
  maxMembers: z.number().int().min(2).max(10).default(4),
  commitmentHoursPerWeek: z.number().int().min(2).max(40).default(10),
  deadline: z.string().optional(),
  requirements: z.array(z.object({
    roleName: z.string().min(2),
    requiredSkills: z.array(z.string()).min(1),
    description: z.string(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('HIGH'),
  })).min(1, 'Specify at least one open role requirement'),
  agreement: z.object({
    commitmentDescription: z.string().min(10),
    weeklyHours: z.number().int().min(2).max(40).default(10),
    primaryChannel: z.string().default('VYNK Crew Messenger'),
    decisionProtocol: z.enum(['CONSENSUS', 'CAPTAIN_DECIDES', 'MAJORITY_VOTE']).default('CONSENSUS'),
    codeStandardRules: z.array(z.string()).default([]),
    meetingSchedule: z.string().default('Tuesdays & Thursdays 7PM'),
  }).optional(),
});
export const createCrewSchema = CreateCrewSchema;

export const UpdateTeamAgreementSchema = z.object({
  commitmentDescription: z.string().min(10),
  weeklyHours: z.number().int().min(2).max(40),
  primaryChannel: z.string(),
  decisionProtocol: z.enum(['CONSENSUS', 'CAPTAIN_DECIDES', 'MAJORITY_VOTE']),
  codeStandardRules: z.array(z.string()),
  meetingSchedule: z.string(),
});
export const updateTeamAgreementSchema = UpdateTeamAgreementSchema;

// -------------------------------------------------------------
// QUESTS & QUIZZES
// -------------------------------------------------------------

export const SubmitDailyChallengeSchema = z.object({
  challengeId: z.string().min(1),
  selectedOptionIndex: z.number().int().min(0).max(10),
});
export const submitChallengeSchema = SubmitDailyChallengeSchema;

export const SubmitQuizSchema = z.object({
  quizId: z.string().min(1),
  timeSpentSeconds: z.number().int().min(0),
  answers: z.array(z.object({
    questionId: z.string().min(1),
    selectedOptionIndex: z.number().int().min(-1).max(10).optional(),
    selectedIndex: z.number().int().min(-1).max(10).optional(),
  })),
});
export const submitQuizSchema = SubmitQuizSchema;

// -------------------------------------------------------------
// MENTORSHIP
// -------------------------------------------------------------

export const CreateMentorProfileSchema = z.object({
  headline: z.string().min(5).max(120),
  companyOrCollege: z.string().min(2),
  yearsOfExperience: z.number().min(0),
  about: z.string().min(20),
  expertiseCategories: z.array(z.string()).min(1),
  skills: z.array(z.string()).min(1),
  weeklyHoursAvailable: z.number().int().min(1).max(20).default(3),
  maxMentees: z.number().int().min(1).max(10).default(3),
});
export const createMentorProfileSchema = CreateMentorProfileSchema;

export const RequestMentorshipSchema = z.object({
  mentorId: z.string().uuid(),
  topic: z.string().min(5).max(100),
  goalDescription: z.string().min(20),
  currentChallenge: z.string().min(20),
  proposedMeetingTimes: z.string().min(5),
});
export const requestMentorshipSchema = RequestMentorshipSchema;

// -------------------------------------------------------------
// MESSAGES & REALTIME
// -------------------------------------------------------------

export const SendMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID cannot be empty'),
  content: z.string().min(1, 'Message cannot be empty').max(4000),
  attachments: z.array(z.string()).optional().default([]),
  replyToId: z.string().min(1).optional(),
});
export const sendMessageSchema = SendMessageSchema;

// -------------------------------------------------------------
// ANALYTICS & REPORTS
// -------------------------------------------------------------

export const TrackAnalyticsEventSchema = z.object({
  eventName: z.string().min(2),
  sessionId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});
export const trackAnalyticsEventSchema = TrackAnalyticsEventSchema;

export const CreateReportSchema = z.object({
  targetType: z.enum(['USER', 'POST', 'COMMENT', 'CREW', 'VOYAGE', 'MESSAGE']),
  targetId: z.string().uuid(),
  reason: z.string().min(5).max(200),
  details: z.string().max(1000).optional(),
});
export const createReportSchema = CreateReportSchema;

// -------------------------------------------------------------
// CLASSROOM DIRECTORY
// -------------------------------------------------------------

export const ClaimDirectoryRecordSchema = z.object({
  directoryId: z.string().min(1, 'Directory record ID is required'),
  studentId: z.string().min(1, 'Student ID / USN is required'),
});
export const claimDirectoryRecordSchema = ClaimDirectoryRecordSchema;

export const UpdateDirectoryRecordSchema = z.object({
  originalDisplayName: z.string().min(2).max(100).optional(),
  department: z.string().min(2).max(100).optional(),
  notes: z.string().max(500).optional(),
  reason: z.string().min(5, 'Audit trail reason is required for modification'),
});
export const updateDirectoryRecordSchema = UpdateDirectoryRecordSchema;

// -------------------------------------------------------------
// BIG DATA LAB
// -------------------------------------------------------------

export const RunBigDataJobSchema = z.object({
  conceptId: z.enum(['concept-1', 'concept-2', 'concept-3', 'concept-4', 'concept-5', 'concept-6']),
  jobId: z.string().min(1, 'Job ID is required'),
  datasetName: z.string().optional(),
  parameters: z.record(z.any()).optional(),
});
export const runBigDataJobSchema = RunBigDataJobSchema;

// -------------------------------------------------------------
// COMMUNITIES SCHEMAS
// -------------------------------------------------------------

export const CreateCommunitySchema = z.object({
  name: z.string().min(3, 'Community name must be at least 3 characters').max(60),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  category: z.string().min(2, 'Category is required'),
  tags: z.array(z.string()).default([]),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  bannerUrl: z.string().url().optional().or(z.literal('')),
  isPrivate: z.boolean().default(false),
});
export const createCommunitySchema = CreateCommunitySchema;

export const UpdateCommunitySchema = CreateCommunitySchema.partial();
export const updateCommunitySchema = UpdateCommunitySchema;

export const CommunityMembershipActionSchema = z.object({
  action: z.enum(['JOIN', 'LEAVE', 'REQUEST']),
});
export const communityMembershipActionSchema = CommunityMembershipActionSchema;

export const ReviewCommunityMemberSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(['APPROVED', 'REJECTED']),
  role: z.enum(['ADMIN', 'MODERATOR', 'MEMBER']).optional(),
});
export const reviewCommunityMemberSchema = ReviewCommunityMemberSchema;


