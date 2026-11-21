/**
 * VYNK Development Data Clean Reset Script
 * 
 * Safety Rules:
 * 1. Requires APP_ENV=development or APP_ENV=test (or NODE_ENV !== 'production').
 * 2. Refuses to run against production hosts (e.g. AWS RDS, Neon prod, Supabase prod, Railway prod).
 * 3. Requires explicit command line flag: --confirm
 * 4. Preserves:
 *    - Canonical Owner (asmitha7intech@gmail.com)
 *    - Preserved Admins (ash@citchennai.net, admin@citchennai.net)
 *    - Curated reference data (technical quests, challenges, departments)
 * 5. Removes all synthetic users, test posts, mock messages, and generated telemetry.
 */

const fs = require('fs');
const path = require('path');

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

const dbPath = path.resolve(__dirname, '../data/vynk_db.json');
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found: ${dbPath}`);
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Accounts to preserve
const PRESERVED_EMAILS = [
  'asmitha7intech@gmail.com',
  'ash@citchennai.net',
  'admin@citchennai.net',
];

const preservedUsers = (db.users || []).filter(u => 
  PRESERVED_EMAILS.includes(u.email?.toLowerCase())
);

console.log(`[RESET] Preserving ${preservedUsers.length} authorized administrative accounts:`);
preservedUsers.forEach(u => console.log(`  - ${u.displayName} (${u.email}) [Role: ${u.role}]`));

if (preservedUsers.length === 0) {
  console.error(`[FATAL] Aborting reset: No preserved admin accounts found!`);
  process.exit(1);
}

const preservedUserIds = new Set(preservedUsers.map(u => u.id));

// Filter out all non-preserved users
const initialUserCount = db.users.length;
db.users = preservedUsers;
console.log(`[RESET] Users purged: ${initialUserCount - preservedUsers.length} synthetic accounts removed.`);

// Purge dependent test records
db.userSkills = (db.userSkills || []).filter(s => preservedUserIds.has(s.userId));
db.userInterests = (db.userInterests || []).filter(i => preservedUserIds.has(i.userId));
db.connections = [];
db.follows = [];
db.posts = [];
db.comments = [];
db.reactions = [];
db.savedPosts = [];
db.projects = [];
db.projectMembers = [];
db.projectMilestones = [];
db.teams = [];
db.teamMembers = [];
db.teamRequirements = [];
db.teamAgreements = [];
db.teamInvitations = [];
db.mentorProfiles = [];
db.mentorshipRequests = [];
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

// Retain curated technical challenges & quizzes
console.log(`[RESET] Preserving ${db.dailyChallenges ? db.dailyChallenges.length : 0} curated technical challenges.`);
console.log(`[RESET] Preserving ${db.quizzes ? db.quizzes.length : 0} curated quizzes and questions.`);
db.dailyChallengeAttempts = [];
db.quizAttempts = [];
db.xPTransactions = [];

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');

// Clean test uploads
const uploadsDir = path.resolve(__dirname, '../data/uploads');
if (fs.existsSync(uploadsDir)) {
  const avatarsDir = path.join(uploadsDir, 'avatars');
  const postsDir = path.join(uploadsDir, 'posts');
  if (fs.existsSync(avatarsDir)) {
    fs.readdirSync(avatarsDir).forEach(f => {
      // Retain directory, remove orphaned generated test uploads
      if (f.startsWith('gen-user-')) fs.unlinkSync(path.join(avatarsDir, f));
    });
  }
  if (fs.existsSync(postsDir)) {
    fs.readdirSync(postsDir).forEach(f => fs.unlinkSync(path.join(postsDir, f)));
  }
  console.log('[RESET] Cleaned orphaned test uploads from data/uploads/');
}

console.log('====================================================');
console.log(' CLEAN RESET SUCCESSFULLY COMPLETED.');
console.log(` Final users in database: ${db.users.length}`);
console.log('====================================================');
