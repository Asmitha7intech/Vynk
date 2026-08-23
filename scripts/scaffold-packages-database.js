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

// 1. package.json
writeFile(path.join(root, 'packages/database/package.json'), JSON.stringify({
  name: '@vynk/database',
  version: '1.0.0',
  private: true,
  main: './src/index.ts',
  types: './src/index.ts',
  scripts: {
    'db:generate': 'prisma generate',
    'db:push': 'prisma db push',
    'db:seed': 'ts-node prisma/seed.ts',
    'typecheck': 'tsc --noEmit'
  },
  dependencies: {
    '@prisma/client': '^6.4.1'
  },
  devDependencies: {
    'prisma': '^6.4.1',
    'typescript': '^5.7.3',
    'ts-node': '^10.9.2',
    'bcryptjs': '^3.0.2',
    '@types/bcryptjs': '^2.4.6'
  }
}, null, 2));

// 2. tsconfig.json
writeFile(path.join(root, 'packages/database/tsconfig.json'), JSON.stringify({
  extends: '../config/tsconfig.base.json',
  compilerOptions: {
    rootDir: './',
    outDir: './dist',
    declaration: true
  },
  include: ['src/**/*', 'prisma/**/*']
}, null, 2));

// 3. prisma/schema.prisma
writeFile(path.join(root, 'packages/database/prisma/schema.prisma'), `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  STUDENT
  MENTOR
  MODERATOR
  ORGANIZATION
  ADMIN
  SUPER_ADMIN
}

enum VynkStatus {
  PENDING
  ACCEPTED
  REJECTED
  BLOCKED
}

enum PostType {
  TEXT
  VOYAGE_LAUNCH
  BOUNTY_EARNED
  QUESTION
  POLL
  HACKATHON_DISPATCH
  LEARNING_NOTE
  EVENT
  OPPORTUNITY
}

enum SkillProficiency {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}

enum CrewRole {
  CAPTAIN
  LEAD
  CONTRIBUTOR
  ADVISOR
}

enum MentorshipStatus {
  PENDING
  ACCEPTED
  DECLINED
  COMPLETED
  CANCELLED
}

enum ConversationType {
  DIRECT
  CREW
  MENTOR
}

enum QuestDifficulty {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}

model User {
  id                      String       @id @default(uuid())
  email                   String       @unique
  passwordHash            String
  username                String       @unique
  displayName             String
  avatarUrl               String?
  bannerUrl               String?
  bio                     String?
  headline                String?
  college                 String?
  department              String?
  graduationYear          Int?
  role                    Role         @default(STUDENT)
  xp                      Int          @default(0)
  level                   Int          @default(1)
  reputationScore         Int          @default(100)
  streakDays              Int          @default(1)
  githubUrl               String?
  linkedinUrl             String?
  portfolioUrl            String?
  isAvailableForCrews     Boolean      @default(true)
  isAvailableForMentorship Boolean     @default(false)
  createdAt               DateTime     @default(now())
  updatedAt               DateTime     @updatedAt

  // Relationships
  skills                  UserSkill[]
  interests               UserInterest[]
  sentVynks               Connection[] @relation("SentVynks")
  receivedVynks           Connection[] @relation("ReceivedVynks")
  following               Follow[]     @relation("Followers")
  followers               Follow[]     @relation("Following")
  posts                   Post[]
  comments                Comment[]
  reactions               Reaction[]
  savedPosts              SavedPost[]
  
  // Voyages
  createdVoyages          Project[]    @relation("CreatedVoyages")
  voyageMemberships       ProjectMember[]

  // Crews
  captainedCrews          Team[]       @relation("CaptainedCrews")
  crewMemberships         TeamMember[]
  sentCrewInvites         TeamInvitation[]

  // Mentorship
  mentorProfile           MentorProfile?
  mentorshipRequestsSent  MentorshipRequest[] @relation("StudentRequests")

  // Quests & Gamification
  quizAttempts            QuizAttempt[]
  challengeAttempts       DailyChallengeAttempt[]
  xpTransactions          XPTransaction[]
  badges                  UserBadge[]

  // Messaging & Conversations
  conversationMemberships ConversationMember[]
  sentMessages            Message[]
  notifications           Notification[]
  reportsFiled            Report[] @relation("Reporter")

  @@index([username])
  @@index([email])
  @@index([college, department])
  @@index([xp(sort: Desc)])
}

model UserSkill {
  id                 String           @id @default(uuid())
  userId             String
  user               User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  skillName          String
  category           String
  proficiency        SkillProficiency @default(BEGINNER)
  yearsOfExperience  Float            @default(1)
  evidenceUrl        String?
  isVerified         Boolean          @default(false)

  @@unique([userId, skillName])
  @@index([skillName])
}

model UserInterest {
  id       String @id @default(uuid())
  userId   String
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  name     String
  category String

  @@unique([userId, name])
  @@index([name])
}

model Connection {
  id         String     @id @default(uuid())
  senderId   String
  sender     User       @relation("SentVynks", fields: [senderId], references: [id], onDelete: Cascade)
  receiverId String
  receiver   User       @relation("ReceivedVynks", fields: [receiverId], references: [id], onDelete: Cascade)
  status     VynkStatus @default(PENDING)
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  @@unique([senderId, receiverId])
  @@index([senderId, status])
  @@index([receiverId, status])
}

model Follow {
  id          String   @id @default(uuid())
  followerId  String
  follower    User     @relation("Followers", fields: [followerId], references: [id], onDelete: Cascade)
  followingId String
  following   User     @relation("Following", fields: [followingId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())

  @@unique([followerId, followingId])
}

model Post {
  id            String      @id @default(uuid())
  authorId      String
  author        User        @relation(fields: [authorId], references: [id], onDelete: Cascade)
  type          PostType    @default(TEXT)
  title         String?
  content       String
  mediaUrls     String[]    @default([])
  tags          String[]    @default([])
  voyageId      String?
  voyage        Project?    @relation(fields: [voyageId], references: [id], onDelete: SetNull)
  likesCount    Int         @default(0)
  commentsCount Int         @default(0)
  sharesCount   Int         @default(0)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  comments      Comment[]
  reactions     Reaction[]
  savedBy       SavedPost[]

  @@index([authorId])
  @@index([createdAt(sort: Desc)])
  @@index([type])
}

model Comment {
  id        String   @id @default(uuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  content   String
  parentId  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([postId])
}

model Reaction {
  id        String   @id @default(uuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  emoji     String   @default("🔥")
  createdAt DateTime @default(now())

  @@unique([postId, userId, emoji])
}

model SavedPost {
  id        String   @id @default(uuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([postId, userId])
}

// -------------------------------------------------------------
// VOYAGES (PROJECTS)
// -------------------------------------------------------------

model Project {
  id            String             @id @default(uuid())
  title         String
  slug          String             @unique
  tagline       String
  description   String
  coverImageUrl String?
  screenshots   String[]           @default([])
  technologies  String[]           @default([])
  githubUrl     String?
  demoUrl       String?
  videoUrl      String?
  category      String
  status        String             @default("IN_PROGRESS")
  xpRewarded    Int                @default(250)
  likesCount    Int                @default(0)
  viewsCount    Int                @default(0)
  creatorId     String
  creator       User               @relation("CreatedVoyages", fields: [creatorId], references: [id], onDelete: Cascade)
  crewId        String?
  crew          Team?              @relation(fields: [crewId], references: [id], onDelete: SetNull)
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  members       ProjectMember[]
  milestones    ProjectMilestone[]
  posts         Post[]

  @@index([creatorId])
  @@index([category])
}

model ProjectMember {
  id            String   @id @default(uuid())
  projectId     String
  project       Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role          String
  contributions String   @default("")

  @@unique([projectId, userId])
}

model ProjectMilestone {
  id          String    @id @default(uuid())
  projectId   String
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  title       String
  description String
  isCompleted Boolean   @default(false)
  dueDate     DateTime?

  @@index([projectId])
}

// -------------------------------------------------------------
// CREWS (TEAMS)
// -------------------------------------------------------------

model Team {
  id                     String            @id @default(uuid())
  name                   String
  slug                   String            @unique
  tagline                String
  description            String
  avatarUrl              String?
  bannerUrl              String?
  category               String
  targetHackathon        String?
  maxMembers             Int               @default(4)
  commitmentHoursPerWeek Int               @default(10)
  deadline               DateTime?
  isRecruiting           Boolean           @default(true)
  captainId              String
  captain                User              @relation("CaptainedCrews", fields: [captainId], references: [id], onDelete: Cascade)
  createdAt              DateTime          @default(now())
  updatedAt              DateTime          @updatedAt

  members                TeamMember[]
  requirements           TeamRequirement[]
  agreement              TeamAgreement?
  invitations            TeamInvitation[]
  voyages                Project[]

  @@index([captainId])
  @@index([isRecruiting])
}

model TeamMember {
  id               String   @id @default(uuid())
  teamId           String
  team             Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  userId           String
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role             CrewRole @default(CONTRIBUTOR)
  assignedRoleName String   @default("Contributor")
  joinedAt         DateTime @default(now())

  @@unique([teamId, userId])
}

model TeamRequirement {
  id             String   @id @default(uuid())
  teamId         String
  team           Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  roleName       String
  requiredSkills String[] @default([])
  description    String
  isFilled       Boolean  @default(false)
  priority       String   @default("HIGH")

  @@index([teamId])
}

model TeamAgreement {
  id                     String   @id @default(uuid())
  teamId                 String   @unique
  team                   Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  commitmentDescription String
  weeklyHours            Int      @default(10)
  primaryChannel         String   @default("VYNK Crew Messenger")
  decisionProtocol       String   @default("CONSENSUS")
  codeStandardRules      String[] @default([])
  meetingSchedule        String   @default("Tuesdays & Thursdays 7PM")
  acceptedUserIds        String[] @default([])
  updatedAt              DateTime @updatedAt
}

model TeamInvitation {
  id        String   @id @default(uuid())
  teamId    String
  team      Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  status    String   @default("PENDING")
  createdAt DateTime @default(now())

  @@unique([teamId, userId])
}

// -------------------------------------------------------------
// MENTORS & MENTORSHIP
// -------------------------------------------------------------

model MentorProfile {
  id                  String              @id @default(uuid())
  userId              String              @unique
  user                User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  headline            String
  companyOrCollege    String
  yearsOfExperience   Float               @default(2)
  about               String
  expertiseCategories String[]            @default([])
  skills              String[]            @default([])
  weeklyHoursAvailable Int                @default(3)
  maxMentees          Int                 @default(3)
  isAcceptingRequests Boolean             @default(true)
  totalMenteesHelped  Int                 @default(0)
  rating              Float               @default(5.0)
  createdAt           DateTime            @default(now())

  requestsReceived    MentorshipRequest[]
}

model MentorshipRequest {
  id                   String           @id @default(uuid())
  studentId            String
  student              User             @relation("StudentRequests", fields: [studentId], references: [id], onDelete: Cascade)
  mentorId             String
  mentor               MentorProfile    @relation(fields: [mentorId], references: [id], onDelete: Cascade)
  topic                String
  goalDescription      String
  currentChallenge     String
  proposedMeetingTimes String
  status               MentorshipStatus @default(PENDING)
  mentorNote           String?
  conversationId       String?
  createdAt            DateTime         @default(now())
  updatedAt            DateTime         @updatedAt

  @@index([studentId])
  @@index([mentorId])
}

// -------------------------------------------------------------
// QUESTS (CHALLENGES & QUIZZES)
// -------------------------------------------------------------

model DailyChallenge {
  id                 String                  @id @default(uuid())
  title              String
  category           String
  difficulty         QuestDifficulty         @default(INTERMEDIATE)
  snippet            String
  question           String
  options            String[]                @default([])
  correctOptionIndex Int
  explanation        String
  xpAward            Int                     @default(20)
  activeDate         String                  @unique // YYYY-MM-DD
  createdAt          DateTime                @default(now())

  attempts           DailyChallengeAttempt[]
}

model DailyChallengeAttempt {
  id                  String         @id @default(uuid())
  challengeId         String
  challenge           DailyChallenge @relation(fields: [challengeId], references: [id], onDelete: Cascade)
  userId              String
  user                User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  selectedOptionIndex Int
  isCorrect           Boolean
  xpEarned            Int
  createdAt           DateTime       @default(now())

  @@unique([challengeId, userId])
}

model Quiz {
  id                String          @id @default(uuid())
  title             String
  slug              String          @unique
  description       String
  category          String
  difficulty        QuestDifficulty @default(INTERMEDIATE)
  timeLimitMinutes  Int             @default(10)
  xpReward          Int             @default(50)
  isWeeklySpecial   Boolean         @default(false)
  startsAt          DateTime?
  expiresAt         DateTime?
  createdAt         DateTime        @default(now())

  questions         QuizQuestion[]
  attempts          QuizAttempt[]
}

model QuizQuestion {
  id                 String   @id @default(uuid())
  quizId             String
  quiz               Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  question           String
  codeSnippet        String?
  options            String[] @default([])
  correctOptionIndex Int
  explanation        String
  topic              String

  @@index([quizId])
}

model QuizAttempt {
  id                String   @id @default(uuid())
  quizId            String
  quiz              Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  score             Int
  maxScore          Int
  percentage        Float
  timeSpentSeconds  Int
  xpEarned          Int
  answers           Json     @default("[]")
  weakTopics        String[] @default([])
  recommendedTopics String[] @default([])
  createdAt         DateTime @default(now())

  @@index([quizId])
  @@index([userId])
}

// -------------------------------------------------------------
// GAMIFICATION, XP, BOUNTIES & LEADERBOARDS
// -------------------------------------------------------------

model XPTransaction {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  amount     Int
  reason     String
  sourceType String
  sourceId   String?
  createdAt  DateTime @default(now())

  @@index([userId])
}

model Badge {
  id          String      @id @default(uuid())
  code        String      @unique
  title       String
  description String
  iconName    String
  category    String
  xpThreshold Int         @default(0)

  userBadges  UserBadge[]
}

model UserBadge {
  id        String   @id @default(uuid())
  badgeId   String
  badge     Badge    @relation(fields: [badgeId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([badgeId, userId])
}

// -------------------------------------------------------------
// MESSAGING & CHAT
// -------------------------------------------------------------

model Conversation {
  id                  String               @id @default(uuid())
  type                ConversationType     @default(DIRECT)
  title               String?
  crewId              String?
  mentorshipRequestId String?
  lastMessageAt       DateTime?
  lastMessageText     String?
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt

  members             ConversationMember[]
  messages            Message[]
}

model ConversationMember {
  id             String       @id @default(uuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  userId         String
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  joinedAt       DateTime     @default(now())
  lastReadAt     DateTime?

  @@unique([conversationId, userId])
}

model Message {
  id             String       @id @default(uuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId       String
  sender         User         @relation(fields: [senderId], references: [id], onDelete: Cascade)
  content        String
  attachments    String[]     @default([])
  replyToId      String?
  isDeleted      Boolean      @default(false)
  createdAt      DateTime     @default(now())

  @@index([conversationId, createdAt])
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String
  title     String
  message   String
  link      String?
  isRead    Boolean  @default(false)
  metadata  Json?
  createdAt DateTime @default(now())

  @@index([userId, isRead])
}

model Report {
  id          String   @id @default(uuid())
  reporterId  String
  reporter    User     @relation("Reporter", fields: [reporterId], references: [id], onDelete: Cascade)
  targetType  String
  targetId    String
  reason      String
  details     String?
  status      String   @default("PENDING")
  createdAt   DateTime @default(now())

  @@index([status])
}
`);

// 4. src/index.ts
writeFile(path.join(root, 'packages/database/src/index.ts'), `
export * from '@prisma/client';
import { PrismaClient } from '@prisma/client';

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma = globalThis.prismaGlobal ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
`);

console.log('Database package created successfully!');
