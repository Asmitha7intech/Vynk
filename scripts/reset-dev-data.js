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

const coimbatoreInstPath = path.resolve(rootDir, 'packages/database/src/coimbatore-institutions.json');
let coimbatoreInstitutions = [];
if (fs.existsSync(coimbatoreInstPath)) {
  try {
    coimbatoreInstitutions = JSON.parse(fs.readFileSync(coimbatoreInstPath, 'utf8'));
  } catch {}
}

const now = new Date().toISOString();
if (coimbatoreInstitutions.length > 0) {
  db.institutions = coimbatoreInstitutions.map(inst => ({
    id: inst.id,
    name: inst.name,
    slug: inst.id,
    domains: inst.domains,
    city: inst.areaScope === 'Coimbatore City' ? 'Coimbatore' : (inst.location.split(',')[1]?.trim() || 'Coimbatore District'),
    country: 'IN',
    category: inst.category,
    location: inst.location,
    areaScope: inst.areaScope,
    code: inst.code,
    isApproved: true,
    createdAt: now,
  }));
} else if (!db.institutions || db.institutions.length === 0) {
  db.institutions = [
    { id: 'cbe-cit', name: 'Coimbatore Institute of Technology (CIT)', slug: 'cbe-cit', domains: ['cit.edu.in'], city: 'Coimbatore', country: 'IN', isApproved: true, createdAt: now },
  ];
}

db.departments = [
  { id: 'dept-cit-cse', institutionId: 'cbe-cit', name: 'Computer Science and Engineering', code: 'CSE', studentCount: 180, createdAt: now },
  { id: 'dept-cit-aids', institutionId: 'cbe-cit', name: 'Artificial Intelligence & Data Science', code: 'AIDS', studentCount: 120, createdAt: now },
  { id: 'dept-cit-it', institutionId: 'cbe-cit', name: 'Information Technology', code: 'IT', studentCount: 120, createdAt: now },
  { id: 'dept-cit-ece', institutionId: 'cbe-cit', name: 'Electronics and Communication Engineering', code: 'ECE', studentCount: 140, createdAt: now },
  { id: 'dept-cit-eee', institutionId: 'cbe-cit', name: 'Electrical and Electronics Engineering', code: 'EEE', studentCount: 100, createdAt: now },
  { id: 'dept-cit-mech', institutionId: 'cbe-cit', name: 'Mechanical Engineering', code: 'MECH', studentCount: 120, createdAt: now },
  { id: 'dept-cit-civil', institutionId: 'cbe-cit', name: 'Civil Engineering', code: 'CIVIL', studentCount: 90, createdAt: now },
  { id: 'dept-cit-chem', institutionId: 'cbe-cit', name: 'Chemical Engineering', code: 'CHEM', studentCount: 60, createdAt: now },
];

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
