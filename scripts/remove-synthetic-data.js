const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/vynk_db.json');
if (!fs.existsSync(dbPath)) {
  console.log('Database file data/vynk_db.json not found, skipping cleanup.');
  process.exit(0);
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const SYNTHETIC_USER_IDS = new Set([
  'usr-alex-chen-001',
  'usr-maya-lin-002',
  'usr-devon-vance-003',
  'usr-priya-sharma-004',
  'usr-arun-kumar-005',
  'usr-sarah-jenkins-006',
]);

const SYNTHETIC_USERNAMES = new Set([
  'alexchen',
  'mayalin_ai',
  'devondesign',
  'priyacodes',
  'dr_arun_ml',
  'sarah_builds',
]);

console.log('Starting safe cleanup of confirmed synthetic accounts...');
const initialUserCount = db.users.length;

// Filter users
db.users = db.users.filter(u => !SYNTHETIC_USER_IDS.has(u.id) && !SYNTHETIC_USERNAMES.has(u.username));

// Find deleted post IDs to cascade
const deletedPostIds = new Set(
  (db.posts || []).filter(p => SYNTHETIC_USER_IDS.has(p.authorId)).map(p => p.id)
);
db.posts = (db.posts || []).filter(p => !SYNTHETIC_USER_IDS.has(p.authorId));

// Comments, reactions, savedPosts
db.comments = (db.comments || []).filter(c => !SYNTHETIC_USER_IDS.has(c.authorId) && !deletedPostIds.has(c.postId));
db.reactions = (db.reactions || []).filter(r => !SYNTHETIC_USER_IDS.has(r.userId) && !deletedPostIds.has(r.postId));
db.savedPosts = (db.savedPosts || []).filter(s => !SYNTHETIC_USER_IDS.has(s.userId) && !deletedPostIds.has(s.postId));

// Connections
db.connections = (db.connections || []).filter(c => !SYNTHETIC_USER_IDS.has(c.senderId) && !SYNTHETIC_USER_IDS.has(c.receiverId));

// Conversations & messages
const deletedConvIds = new Set(['conv-alex-maya-direct']);
db.conversations = (db.conversations || []).filter(c => !deletedConvIds.has(c.id));
db.conversationMembers = (db.conversationMembers || []).filter(cm => !SYNTHETIC_USER_IDS.has(cm.userId) && !deletedConvIds.has(cm.conversationId));
db.messages = (db.messages || []).filter(m => !SYNTHETIC_USER_IDS.has(m.senderId) && !deletedConvIds.has(m.conversationId));

// Skills & interests
db.userSkills = (db.userSkills || []).filter(s => !SYNTHETIC_USER_IDS.has(s.userId));
db.userInterests = (db.userInterests || []).filter(i => !SYNTHETIC_USER_IDS.has(i.userId));
db.userBadges = (db.userBadges || []).filter(b => !SYNTHETIC_USER_IDS.has(b.userId));

// Projects & teams
const deletedProjectIds = new Set(
  (db.projects || []).filter(p => SYNTHETIC_USER_IDS.has(p.creatorId)).map(p => p.id)
);
db.projects = (db.projects || []).filter(p => !SYNTHETIC_USER_IDS.has(p.creatorId));
db.projectMembers = (db.projectMembers || []).filter(pm => !SYNTHETIC_USER_IDS.has(pm.userId) && !deletedProjectIds.has(pm.projectId));
db.projectMilestones = (db.projectMilestones || []).filter(m => !deletedProjectIds.has(m.projectId));

const deletedTeamIds = new Set(
  (db.teams || []).filter(t => SYNTHETIC_USER_IDS.has(t.captainId)).map(t => t.id)
);
db.teams = (db.teams || []).filter(t => !SYNTHETIC_USER_IDS.has(t.captainId));
db.teamMembers = (db.teamMembers || []).filter(tm => !SYNTHETIC_USER_IDS.has(tm.userId) && !deletedTeamIds.has(tm.teamId));
db.teamRequirements = (db.teamRequirements || []).filter(tr => !deletedTeamIds.has(tr.teamId));
db.teamAgreements = (db.teamAgreements || []).filter(ta => !deletedTeamIds.has(ta.teamId));
db.teamInvitations = (db.teamInvitations || []).filter(ti => !SYNTHETIC_USER_IDS.has(ti.userId) && !deletedTeamIds.has(ti.teamId));

// Mentors & verifications
db.mentorProfiles = (db.mentorProfiles || []).filter(mp => !SYNTHETIC_USER_IDS.has(mp.userId));
db.mentorshipRequests = (db.mentorshipRequests || []).filter(mr => !SYNTHETIC_USER_IDS.has(mr.studentId));
db.studentVerifications = (db.studentVerifications || []).filter(sv => !SYNTHETIC_USER_IDS.has(sv.userId));

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');

console.log(`✅ Cleanup complete:`);
console.log(`- Removed ${initialUserCount - db.users.length} synthetic accounts (Maya Lin, Priya Sharma, Alex Chen, etc.)`);
console.log(`- Remaining real registered users: ${db.users.length}`);
console.log(`- Active genuine posts: ${db.posts.length}`);
console.log(`- Active genuine connections: ${db.connections.length}`);
console.log(`- Active genuine conversations: ${db.conversations.length}`);
