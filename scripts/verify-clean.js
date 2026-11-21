/**
 * VYNK Zero Synthetic Data & Generic Clean Database Verification Script
 * 
 * Verifies:
 * 1. Active database is PGlite dev store (data/pglite_dev/store.json).
 * 2. Legacy data/vynk_db.json is permanently deleted.
 * 3. Exactly 1 user exists: the canonical SUPER_ADMIN (asmitha7intech@gmail.com) with XP=0, Level=1, mustChangePassword=true.
 * 4. Zero records in any user-generated table (posts, comments, communities, voyages, messages, etc.).
 * 5. Only allowed reference tables (institutions, departments, badges, dailyChallenges, quizzes).
 * 6. Storage is clean of synthetic uploads.
 * 7. Frontend code (apps/web/src) contains no mock files, fake identity fixtures, or lorem ipsum.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('====================================================');
console.log(' VYNK GENERIC DATABASE & REPOSITORY CLEANLINESS AUDIT');
console.log('====================================================');

let passed = true;
const rootDir = path.resolve(__dirname, '..');

// 1. Verify Legacy Runtime File Is Permanently Removed
const legacyDbPath = path.resolve(rootDir, 'data/vynk_db.json');
if (fs.existsSync(legacyDbPath)) {
  console.error('[FAIL] Legacy data/vynk_db.json still exists on disk! Must be removed.');
  passed = false;
} else {
  console.log('[PASS] Legacy data/vynk_db.json is permanently deleted.');
}

// 2. Verify Active Dev Database (PGlite dev store)
const devStorePath = path.resolve(rootDir, 'data/pglite_dev/store.json');
if (!fs.existsSync(devStorePath)) {
  console.error(`[FAIL] Active PGlite dev store not found at: ${devStorePath}`);
  process.exit(1);
}

let db = {};
try {
  db = JSON.parse(fs.readFileSync(devStorePath, 'utf8'));
} catch (e) {
  console.error('[FAIL] Active PGlite dev store could not be parsed:', e.message);
  process.exit(1);
}

// 3. Verify Users Collection: Exactly 1 SuperAdmin
const ownerEmail = (process.env.OWNER_EMAIL || 'asmitha7intech@gmail.com').toLowerCase().trim();
const users = db.users || [];

if (users.length !== 1) {
  console.error(`[FAIL] Expected exactly 1 user in database, found ${users.length}.`);
  passed = false;
} else {
  const owner = users[0];
  if (owner.email?.toLowerCase() !== ownerEmail) {
    console.error(`[FAIL] Expected owner email ${ownerEmail}, found: ${owner.email}`);
    passed = false;
  } else if (owner.role !== 'SUPER_ADMIN') {
    console.error(`[FAIL] Expected owner role SUPER_ADMIN, found: ${owner.role}`);
    passed = false;
  } else if (!owner.mustChangePassword) {
    console.error(`[FAIL] Expected mustChangePassword to be true for fresh owner provision.`);
    passed = false;
  } else if (owner.xp !== 0 || owner.level !== 1) {
    console.error(`[FAIL] Expected initial XP 0, Level 1. Found: XP=${owner.xp}, Level=${owner.level}`);
    passed = false;
  } else {
    console.log(`[PASS] Exactly 1 canonical SUPER_ADMIN user: ${owner.displayName} (${owner.email})`);
    console.log(`       Role: ${owner.role}, XP: ${owner.xp}, Level: ${owner.level}, mustChangePassword: ${owner.mustChangePassword}`);
  }
}

// 4. Enumerate All Collections in Store
const ALLOWED_REFERENCE_COLLECTIONS = new Set([
  'institutions',
  'departments',
  'badges',
  'dailyChallenges',
  'quizzes',
  'quizQuestions',
  'users' // Checked explicitly above
]);

const collections = Object.keys(db);
console.log(`[AUDIT] Enumerating ${collections.length} collections in active database...`);

collections.forEach(col => {
  if (ALLOWED_REFERENCE_COLLECTIONS.has(col)) {
    return;
  }
  const items = Array.isArray(db[col]) ? db[col] : [];
  if (items.length > 0) {
    console.error(`[FAIL] User-generated collection '${col}' has ${items.length} records! Expected 0.`);
    passed = false;
  } else {
    console.log(`  - [PASS] Collection '${col}': 0 records`);
  }
});

// 5. Verify Storage Directory
const uploadsDir = path.resolve(rootDir, 'data/uploads');
if (fs.existsSync(uploadsDir)) {
  const avatarsDir = path.join(uploadsDir, 'avatars');
  const postsDir = path.join(uploadsDir, 'posts');
  let filesCount = 0;
  if (fs.existsSync(avatarsDir)) filesCount += fs.readdirSync(avatarsDir).length;
  if (fs.existsSync(postsDir)) filesCount += fs.readdirSync(postsDir).length;
  if (filesCount === 0) {
    console.log('[PASS] Upload storage is completely clean (0 uploaded files).');
  } else {
    console.error(`[FAIL] Upload storage contains ${filesCount} stray files.`);
    passed = false;
  }
}

// 6. Verify Frontend Source Integrity
const webSrc = path.resolve(rootDir, 'apps/web/src');
function scanDir(dir, patterns) {
  const violations = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      violations.push(...scanDir(fullPath, patterns));
    } else if (entry.isFile() && /\.(tsx|ts|jsx|js|html|css)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const { label, regex } of patterns) {
        if (regex.test(content)) {
          violations.push({ file: path.relative(rootDir, fullPath), label });
        }
      }
    }
  }
  return violations;
}

const frontendPatterns = [
  { label: 'Hardcoded fake user email (alex.chen@mit.edu)', regex: /alex\.chen@mit\.edu/i },
  { label: 'Lorem Ipsum placeholder text', regex: /lorem\s+ipsum/i },
  { label: 'Mock data import', regex: /from\s+['"].*mockData['"]/i },
  { label: 'Date.now() test name fixture', regex: /Campus Founders \d+|Robotics Guild \d+/ }
];

const violations = scanDir(webSrc, frontendPatterns);
if (violations.length > 0) {
  console.error(`[FAIL] Found ${violations.length} frontend code cleanliness violations:`);
  violations.forEach(v => console.error(`  - ${v.file}: ${v.label}`));
  passed = false;
} else {
  console.log('[PASS] apps/web/src is clean: zero mock data, zero lorem ipsum, zero fake emails.');
}

console.log('====================================================');
if (passed) {
  console.log(' ALL ZERO-SYNTHETIC-DATA CHECKS PASSED.');
  console.log(' Active database and frontend are 100% clean and production-standard.');
  console.log('====================================================');
  process.exit(0);
} else {
  console.error(' AUDIT FAILED WITH VIOLATIONS ABOVE.');
  console.error('====================================================');
  process.exit(1);
}
