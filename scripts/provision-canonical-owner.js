/**
 * Canonical SuperAdmin Provisioning Script
 * 
 * Rules:
 * 1. Exactly ONE privileged account: the SUPER_ADMIN created from .env
 *    (OWNER_EMAIL, OWNER_USERNAME, OWNER_DISPLAY_NAME, OWNER_INITIAL_PASSWORD)
 * 2. Argon2id-hashed, mustChangePassword=true, XP=0, level=1, zero badges.
 * 3. Deletes all extra admin accounts (admin@citchennai.net, ash@citchennai.net, etc.).
 * 4. NEVER prints the password to console or logs.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

// Load environment variables from workspace root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { hash, Algorithm } = require('@node-rs/argon2');

async function provisionOwner() {
  const rootDir = path.resolve(__dirname, '..');
  const envPath = path.resolve(rootDir, '.env');

  const ownerEmail = (process.env.OWNER_EMAIL || 'asmitha7intech@gmail.com').toLowerCase().trim();
  const ownerUsername = (process.env.OWNER_USERNAME || 'asmitha').toLowerCase().trim();
  const ownerDisplayName = process.env.OWNER_DISPLAY_NAME || 'Asmitha S';
  let initialPassword = process.env.OWNER_INITIAL_PASSWORD;

  if (!initialPassword) {
    initialPassword = `Vynk#${crypto.randomBytes(8).toString('hex')}!Aa9`;
    fs.appendFileSync(envPath, `\nOWNER_INITIAL_PASSWORD=${initialPassword}\n`);
    console.log('[PROVISION] Generated fresh initial owner password and saved to .env (not displayed for security).');
  }

  // Hash using Argon2id with memory-hard parameters
  const passwordHash = await hash(initialPassword, {
    algorithm: Algorithm.Argon2id,
    memoryCost: 65536,
    timeCost: 3,
    outputLen: 32,
  });

  const devDir = path.resolve(rootDir, 'data/pglite_dev');
  if (!fs.existsSync(devDir)) {
    fs.mkdirSync(devDir, { recursive: true });
  }

  const storeFile = path.join(devDir, 'store.json');
  let state = {};
  if (fs.existsSync(storeFile)) {
    try {
      state = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
    } catch {
      state = {};
    }
  }

  const ownerRecord = {
    id: 'owner-asmitha-canonical',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    email: ownerEmail,
    username: ownerUsername,
    displayName: ownerDisplayName,
    passwordHash: passwordHash,
    college: 'Chennai Institute of Technology',
    department: 'Computer Science',
    graduationYear: 2026,
    role: 'SUPER_ADMIN',
    mustChangePassword: true,
    xp: 0,
    level: 1,
    reputationScore: 100,
    streakDays: 0,
    headline: 'Founder & Lead Architect @ VYNK',
    bio: 'Campus collaboration, technical leadership, and engineering excellence.',
    isAvailableForCrews: true,
    isAvailableForMentorship: true,
  };

  // Exactly ONE account in users: the canonical SuperAdmin
  state.users = [ownerRecord];

  fs.writeFileSync(storeFile, JSON.stringify(state, null, 2), 'utf8');
  console.log('[PROVISION] Successfully provisioned canonical SUPER_ADMIN:', ownerEmail);
  console.log('[PROVISION] mustChangePassword flag set: true');
  console.log('[PROVISION] Initial XP: 0, Level: 1, Badges: 0');
  console.log('[PROVISION] Total users in dev database: Exactly 1');
}

provisionOwner().catch(err => {
  console.error('[PROVISION ERROR]:', err);
  process.exit(1);
});
