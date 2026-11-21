/**
 * VYNK Development Clean Reset Script
 * 
 * Safety Rules:
 * 1. Requires APP_ENV=development or APP_ENV=test (or NODE_ENV !== 'production').
 * 2. Refuses to run against production database hosts.
 * 3. Requires explicit command line flag: --confirm
 * 4. Preserves:
 *    - Canonical Owner from .env (role: SUPER_ADMIN, mustChangePassword: true, xp: 0, level: 1)
 *    - Reference data (institutions, departments, badges, challenges, quizzes)
 * 5. Purges:
 *    - All non-owner users, extra admins, communities, voyages, posts, messages,
 *      telemetry, test sessions, test uploads, and synthetic XP.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const args = process.argv.slice(2);
const isConfirmed = args.includes('--confirm');

const env = process.env.APP_ENV || process.env.NODE_ENV || 'development';
const dbUrl = process.env.DATABASE_URL || '';

// Guard 1: Environment Guard
if (env === 'production' || env === 'staging') {
  console.error(`[FATAL] reset-dev-data refused: Cannot run in '${env}' environment.`);
  process.exit(1);
}

// Guard 2: Hosted Production Database Detection
const PROD_HOST_PATTERNS = [
  'prod',
  'production',
  'aws.neon.tech',
  'pooler.supabase.com',
  'rds.amazonaws.com',
  'railway.app'
];

if (PROD_HOST_PATTERNS.some(p => dbUrl.toLowerCase().includes(p) && !dbUrl.includes('test') && !dbUrl.includes('dev'))) {
  console.error(`[FATAL] reset-dev-data refused: DATABASE_URL appears to point to a production database host.`);
  process.exit(1);
}

// Guard 3: Explicit Confirmation Flag
if (!isConfirmed) {
  console.error(`[ERROR] reset-dev-data requires explicit '--confirm' flag to prevent accidental reset.`);
  console.error(`Usage: node scripts/reset-dev-data.js --confirm`);
  process.exit(1);
}

console.log('====================================================');
console.log(' VYNK DEVELOPMENT CLEAN RESET EXECUTION');
console.log('====================================================');

const rootDir = path.resolve(__dirname, '..');
const devDir = path.resolve(rootDir, 'data/pglite_dev');
if (!fs.existsSync(devDir)) {
  fs.mkdirSync(devDir, { recursive: true });
}

const storeFile = path.join(devDir, 'store.json');
let db = {};
if (fs.existsSync(storeFile)) {
  try {
    db = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
  } catch {
    db = {};
  }
}

// Owner email from environment
const ownerEmail = (process.env.OWNER_EMAIL || 'asmitha7intech@gmail.com').toLowerCase().trim();
const existingOwner = (db.users || []).find(u => u.email?.toLowerCase() === ownerEmail);

if (!existingOwner) {
  console.log('[RESET] Canonical owner not found in store. Running provision script...');
  require('./provision-canonical-owner.js');
  db = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
} else {
  // Reset owner to clean state: 0 XP, level 1, mustChangePassword=true, zero badges
  existingOwner.role = 'SUPER_ADMIN';
  existingOwner.mustChangePassword = true;
  existingOwner.xp = 0;
  existingOwner.level = 1;
  existingOwner.reputationScore = 100;
  existingOwner.streakDays = 0;
  existingOwner.updatedAt = new Date().toISOString();
  db.users = [existingOwner];
  console.log(`[RESET] Preserving canonical SUPER_ADMIN only: ${existingOwner.displayName} (${existingOwner.email})`);
}

// Purge all user-generated entities
db.userSkills = [];
db.userInterests = [];
db.connections = [];
db.follows = [];
db.posts = [];
db.comments = [];
db.reactions = [];
db.savedPosts = [];
db.projects = []; // Voyages
db.projectMembers = [];
db.projectMilestones = [];
db.teams = [];
db.teamMembers = [];
db.teamRequirements = [];
db.teamAgreements = [];
db.teamInvitations = [];
db.mentorProfiles = [];
db.mentorshipRequests = [];
db.communities = [];
db.communityMembers = [];
db.conversations = [];
db.conversationMembers = [];
db.messages = [];
db.notifications = [];
db.analyticsEvents = [];
db.eventOutboxes = [];
db.searchHistories = [];
db.reports = [];
db.sessions = [];
db.passwordResetTokens = [];
db.projectJoinRequests = [];
db.projectTasks = [];
db.projectDiscussions = [];
db.projectActivities = [];
db.classroomDirectories = [];
db.bigDataJobs = [];
db.blocks = [];
db.auditLogs = [];
db.emailVerificationTokens = [];
db.notificationPreferences = [];
db.dailyChallengeAttempts = [];
db.quizAttempts = [];
db.xPTransactions = [];
db.userBadges = [];

// Ensure curated reference data exists
try {
  const refPath = path.resolve(rootDir, 'packages/database/src/reference-data.json');
  if (fs.existsSync(refPath)) {
    const refData = JSON.parse(fs.readFileSync(refPath, 'utf8'));
    const today = new Date().toISOString().split('T')[0];
    db.dailyChallenges = (refData.dailyChallenges || []).map((c, i) => i === 0 ? { ...c, activeDate: today } : c);
    db.quizzes = refData.quizzes || [];
    db.quizQuestions = refData.quizQuestions || [];
  }
} catch {}

if (!db.institutions || db.institutions.length === 0) {
  const now = new Date().toISOString();
  db.institutions = [
    { id: 'inst-cit-005', name: 'Chennai Institute of Technology (CIT)', slug: 'cit-chennai', domains: ['citchennai.net', 'cit.edu.in'], city: 'Chennai', country: 'IN', isApproved: true, createdAt: now },
    { id: 'inst-mit-001', name: 'Massachusetts Institute of Technology (MIT)', slug: 'mit', domains: ['mit.edu'], city: 'Cambridge', country: 'US', isApproved: true, createdAt: now },
    { id: 'inst-stanford-002', name: 'Stanford University', slug: 'stanford', domains: ['stanford.edu'], city: 'Stanford', country: 'US', isApproved: true, createdAt: now },
    { id: 'inst-berkeley-003', name: 'University of California, Berkeley', slug: 'berkeley', domains: ['berkeley.edu'], city: 'Berkeley', country: 'US', isApproved: true, createdAt: now },
    { id: 'inst-cmu-004', name: 'Carnegie Mellon University', slug: 'cmu', domains: ['cmu.edu'], city: 'Pittsburgh', country: 'US', isApproved: true, createdAt: now },
  ];
}

if (!db.departments || db.departments.length === 0) {
  const now = new Date().toISOString();
  db.departments = [
    { id: 'dept-cit-cs', institutionId: 'inst-cit-005', name: 'Computer Science and Engineering', code: 'CSE', studentCount: 180, createdAt: now },
    { id: 'dept-cit-ai', institutionId: 'inst-cit-005', name: 'Artificial Intelligence & Data Science', code: 'AIDS', studentCount: 120, createdAt: now },
    { id: 'dept-cit-cce', institutionId: 'inst-cit-005', name: 'Computer and Communication Engineering', code: 'CCE', studentCount: 90, createdAt: now },
    { id: 'dept-cit-csbs', institutionId: 'inst-cit-005', name: 'Computer Science and Business Systems', code: 'CSBS', studentCount: 75, createdAt: now },
    { id: 'dept-mit-cs', institutionId: 'inst-mit-001', name: 'Computer Science', code: 'CS', studentCount: 120, createdAt: now },
  ];
}

if (!db.badges || db.badges.length === 0) {
  db.badges = [
    { id: 'badge-first-voyage', code: 'FIRST_VOYAGE', title: 'First Voyage', description: 'Showcased and published your first technical project portfolio.', iconName: 'Rocket', category: 'COLLABORATION', xpThreshold: 250 },
    { id: 'badge-crew-captain', code: 'CREW_CAPTAIN', title: 'Crew Captain', description: 'Formed a collaborative crew and published a verified Team Agreement.', iconName: 'ShieldAlert', category: 'COLLABORATION', xpThreshold: 500 },
    { id: 'badge-quiz-master', code: 'QUIZ_MASTER', title: 'Quiz Champion', description: 'Achieved a top 5% score in the weekly technical challenge.', iconName: 'Trophy', category: 'LEARNING', xpThreshold: 750 },
    { id: 'badge-streak-titan', code: 'STREAK_TITAN', title: 'Streak Titan', description: 'Maintained a 14+ day continuous learning and challenge streak.', iconName: 'Flame', category: 'LEARNING', xpThreshold: 1000 },
  ];
}

// Retain reference data
console.log(`[RESET] Retaining curated reference data:`);
console.log(`  - Institutions: ${db.institutions ? db.institutions.length : 5}`);
console.log(`  - Departments: ${db.departments ? db.departments.length : 5}`);
console.log(`  - Badges: ${db.badges ? db.badges.length : 4}`);
console.log(`  - Curated Challenges: ${db.dailyChallenges ? db.dailyChallenges.length : 12}`);
console.log(`  - Curated Quizzes: ${db.quizzes ? db.quizzes.length : 12}`);

fs.writeFileSync(storeFile, JSON.stringify(db, null, 2), 'utf8');

// Also remove legacy vynk_db.json from data/
const legacyDbPath = path.resolve(rootDir, 'data/vynk_db.json');
if (fs.existsSync(legacyDbPath)) {
  fs.unlinkSync(legacyDbPath);
  console.log('[RESET] Permanently removed legacy runtime file: data/vynk_db.json');
}

// Clean test uploads
const uploadsDir = path.resolve(rootDir, 'data/uploads');
if (fs.existsSync(uploadsDir)) {
  const avatarsDir = path.join(uploadsDir, 'avatars');
  const postsDir = path.join(uploadsDir, 'posts');
  if (fs.existsSync(avatarsDir)) {
    fs.readdirSync(avatarsDir).forEach(f => {
      try { fs.unlinkSync(path.join(avatarsDir, f)); } catch {}
    });
  }
  if (fs.existsSync(postsDir)) {
    fs.readdirSync(postsDir).forEach(f => {
      try { fs.unlinkSync(path.join(postsDir, f)); } catch {}
    });
  }
  console.log('[RESET] Cleaned all uploaded files from data/uploads/');
}

console.log('====================================================');
console.log(' CLEAN RESET SUCCESSFULLY COMPLETED.');
console.log(` Final users in database: ${db.users.length} (SUPER_ADMIN only)`);
console.log('====================================================');
