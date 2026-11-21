/**
 * VYNK Administrator Provisioning CLI
 *
 * Usage:
 *   node scripts/provision-admin.js [target]          - Promotes user by username or email to ADMIN
 *   node scripts/provision-admin.js --all             - Provisions all primary admin accounts
 */

const fs = require('fs');
const path = require('path');

let bcrypt;
try {
  bcrypt = require('bcryptjs');
} catch {
  try {
    bcrypt = require('../apps/api/node_modules/bcryptjs');
  } catch {
    bcrypt = null;
  }
}

const dbPath = path.resolve(__dirname, '../data/vynk_db.json');

if (!fs.existsSync(dbPath)) {
  console.error(`Error: Database file not found at ${dbPath}`);
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
if (!Array.isArray(db.users)) {
  console.error('Error: Invalid database structure - users table missing');
  process.exit(1);
}

const target = process.argv[2];

const PRIMARY_ADMIN_TARGETS = [
  'ash',
  'admin@citchennai.net',
  'ash@citchennai.net',
  'asmitha_1789140990765@mit.edu',
];

function promoteUser(userIdentifier) {
  const norm = userIdentifier.toLowerCase();
  let user = db.users.find(
    (u) =>
      u.email?.toLowerCase() === norm ||
      u.username?.toLowerCase() === norm ||
      (norm === 'ash' && (u.username?.toLowerCase() === 'ash' || u.displayName?.toLowerCase() === 'ash'))
  );

  if (user) {
    user.role = 'ADMIN';
    user.updatedAt = new Date().toISOString();
    console.log(`[VYNK ADMIN] Promoted user '${user.username}' (${user.email}) to role: ${user.role}`);
    return user;
  }

  // If ash@citchennai.net does not exist, provision cleanly
  if (norm === 'ash@citchennai.net') {
    // Clone credentials from 'ash' if available or use standard bcrypt hash
    const existingAsh = db.users.find((u) => u.username?.toLowerCase() === 'ash');
    const defaultHash = existingAsh?.passwordHash || (bcrypt ? bcrypt.hashSync('StudentPassword123!', 10) : '$2b$10$BCm/AzQqjyCS6hgCTaJ6duKpJdHCIrkfDF8k.NzPQd/FEMefBYwiu');

    user = {
      id: `admin-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      email: 'ash@citchennai.net',
      username: 'Ash',
      displayName: 'Ash',
      passwordHash: defaultHash,
      college: 'Chennai Institute of Technology',
      department: 'Computer Science',
      graduationYear: 2026,
      role: 'ADMIN',
      xp: 2500,
      level: 15,
      reputationScore: 900,
      streakDays: 45,
      headline: 'Campus Administrator & System Architect',
      bio: 'Leading student collaboration, technical architecture, and community growth on VYNK.',
    };
    db.users.push(user);
    console.log(`[VYNK ADMIN] Provisioned primary admin user: ${user.email} (username: ${user.username})`);
    return user;
  }

  console.log(`[VYNK ADMIN] Target '${userIdentifier}' not found in database.`);
  return null;
}

if (!target || target === '--all' || target === '--default') {
  PRIMARY_ADMIN_TARGETS.forEach(promoteUser);
} else {
  promoteUser(target);
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log(`[VYNK ADMIN] Successfully saved changes to ${dbPath}`);
