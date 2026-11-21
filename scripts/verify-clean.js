/**
 * VYNK Clean Database & Repository Verification Script
 * 
 * Verifies:
 * 1. Exactly 3 authorized admin users (Canonical owner + preserved admins); zero synthetic users.
 * 2. Zero test posts, comments, reactions, connections, messages, notifications.
 * 3. Zero unreferenced synthetic upload files in storage.
 * 4. Zero mockData imports in web frontend.
 */

const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log(' VYNK ZERO SYNTHETIC DATA VERIFICATION AUDIT');
console.log('====================================================');

let passed = true;

// 1. Check Database File
const dbPath = path.resolve(__dirname, '../data/vynk_db.json');
if (!fs.existsSync(dbPath)) {
  console.error('FAIL: Database file missing.');
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Verify Users
const ALLOWED_EMAILS = [
  'asmitha7intech@gmail.com',
  'ash@citchennai.net',
  'admin@citchennai.net',
];

const unauthorizedUsers = (db.users || []).filter(u => !ALLOWED_EMAILS.includes(u.email?.toLowerCase()));
if (unauthorizedUsers.length > 0) {
  console.error(`FAIL: Found ${unauthorizedUsers.length} unauthorized synthetic user accounts!`);
  passed = false;
} else {
  console.log(`PASS: Zero unauthorized users. Exactly ${db.users.length} authorized administrative accounts.`);
  db.users.forEach(u => console.log(`  - [${u.role}] ${u.displayName} (${u.email})`));
}

// Verify Zero Dynamic Test Entities
const zeroTables = [
  'posts',
  'comments',
  'reactions',
  'connections',
  'follows',
  'projects',
  'teams',
  'conversations',
  'messages',
  'notifications',
  'analyticsEvents',
  'classroomDirectories',
  'bigDataJobs'
];

zeroTables.forEach(t => {
  const count = db[t] ? db[t].length : 0;
  if (count === 0) {
    console.log(`PASS: 0 records in table '${t}'`);
  } else {
    console.error(`FAIL: Table '${t}' contains ${count} records! Expected 0.`);
    passed = false;
  }
});

// Verify Uploads Storage
const uploadsDir = path.resolve(__dirname, '../data/uploads');
if (fs.existsSync(uploadsDir)) {
  const avatars = fs.existsSync(path.join(uploadsDir, 'avatars')) ? fs.readdirSync(path.join(uploadsDir, 'avatars')) : [];
  const posts = fs.existsSync(path.join(uploadsDir, 'posts')) ? fs.readdirSync(path.join(uploadsDir, 'posts')) : [];
  const syntheticAvatars = avatars.filter(f => f.startsWith('gen-user-'));
  if (syntheticAvatars.length === 0 && posts.length === 0) {
    console.log(`PASS: Storage is clean. Zero synthetic avatars or post uploads.`);
  } else {
    console.error(`FAIL: Storage contains synthetic files: avatars=${syntheticAvatars.length}, posts=${posts.length}`);
    passed = false;
  }
}

// Verify Frontend Mocks
const mockDataPath = path.resolve(__dirname, '../apps/web/src/lib/mockData.ts');
if (!fs.existsSync(mockDataPath)) {
  console.log(`PASS: apps/web/src/lib/mockData.ts is permanently removed.`);
} else {
  console.error(`FAIL: apps/web/src/lib/mockData.ts still exists!`);
  passed = false;
}

console.log('====================================================');
if (passed) {
  console.log(' ALL CLEANLINESS CHECKS PASSED: REPOSITORY IS CLEAN.');
  console.log('====================================================');
  process.exit(0);
} else {
  console.error(' CLEANLINESS VERIFICATION FAILED.');
  console.log('====================================================');
  process.exit(1);
}
