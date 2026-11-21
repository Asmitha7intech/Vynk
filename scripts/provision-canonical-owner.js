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
  console.error('Database file not found:', dbPath);
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

let canonical = db.users.find(u => u.email?.toLowerCase() === 'asmitha7intech@gmail.com');
const existingAdmin = db.users.find(u => u.email?.toLowerCase() === 'ash@citchennai.net') 
  || db.users.find(u => u.email?.toLowerCase() === 'admin@citchennai.net')
  || db.users.find(u => u.username?.toLowerCase() === 'ash');

const passwordHash = bcrypt ? bcrypt.hashSync('Password123!', 10) : '$2b$10$DgF7P3hG5iGH.3VTny1YIOdYc/1GWI3uCeUTfEnaxpYpPxftn9wIG';

if (!canonical) {
  canonical = {
    id: 'owner-asmitha-canonical',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    email: 'asmitha7intech@gmail.com',
    username: 'asmitha',
    displayName: 'Asmitha S',
    passwordHash: passwordHash,
    college: 'Chennai Institute of Technology',
    department: 'Computer Science',
    graduationYear: 2026,
    role: 'SUPER_ADMIN',
    xp: 5000,
    level: 25,
    reputationScore: 1000,
    streakDays: 60,
    headline: 'Founder & Lead Architect @ VYNK',
    bio: 'Campus collaboration, technical leadership, and engineering excellence.',
    isAvailableForCrews: true,
    isAvailableForMentorship: true,
  };
  db.users.unshift(canonical);
  console.log('[PROVISION] Created canonical owner account:', canonical.email, 'with role:', canonical.role);
} else {
  canonical.role = 'SUPER_ADMIN';
  canonical.passwordHash = passwordHash;
  canonical.updatedAt = new Date().toISOString();
  console.log('[PROVISION] Updated canonical owner account role to:', canonical.role);
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('[PROVISION] Successfully updated database. Total users:', db.users.length);
