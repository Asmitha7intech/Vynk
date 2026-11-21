#!/usr/bin/env node
/**
 * VYNK Spark Analytics Runner
 * 
 * Runs batch analytics jobs against the Medallion Data Lake.
 * In production: submits to Apache Spark cluster.
 * In dev/local: runs as Node.js jobs directly against the SILVER lake files.
 * 
 * Jobs:
 *   1. engagement     — User engagement metrics (posts, reactions, comments)
 *   2. skills         — Skill demand/supply analysis
 *   3. collaboration  — Cross-department collaboration patterns
 *   4. trends         — Project & quest completion trends
 *   5. vectors        — User feature vectors for ML recommendations
 *   6. all            — Run all jobs sequentially
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Resolve data lake root
function getLakeRoot() {
  let curr = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.resolve(curr, 'pnpm-workspace.yaml'))) {
      return path.resolve(curr, 'data', 'lake');
    }
    curr = path.dirname(curr);
  }
  return path.resolve(process.cwd(), 'data', 'lake');
}

const LAKE_ROOT = getLakeRoot();
const GOLD_DIR = path.join(LAKE_ROOT, 'gold');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readAllSilverEvents() {
  const events = [];
  const silverDir = path.join(LAKE_ROOT, 'silver');
  if (!fs.existsSync(silverDir)) {
    console.log('[Spark] No SILVER zone data found yet — run the API to generate events first');
    return events;
  }

  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.name.endsWith('.jsonl')) {
        const lines = fs.readFileSync(fullPath, 'utf8').trim().split('\n').filter(Boolean);
        for (const line of lines) {
          try { events.push(JSON.parse(line)); } catch (_) {}
        }
      }
    }
  }

  walkDir(silverDir);
  console.log(`[Spark] Loaded ${events.length} SILVER events for processing`);
  return events;
}

function writeGold(jobName, data) {
  ensureDir(GOLD_DIR);
  const outPath = path.join(GOLD_DIR, `${jobName}_${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ _job: jobName, _generatedAt: new Date().toISOString(), ...data }, null, 2));
  console.log(`[Spark][${jobName}] ✅ Gold table written → ${path.basename(outPath)}`);
  return outPath;
}

// ============================================================
// JOB 1: User Engagement Metrics
// ============================================================
function runEngagementJob(events) {
  console.log('[Spark][engagement] Starting engagement aggregation...');
  
  const userEngagement = {};
  const eventsByType = {};
  const hourlyDistribution = {};

  for (const event of events) {
    const userId = event.userId;
    if (userId) {
      if (!userEngagement[userId]) {
        userEngagement[userId] = { userId, events: 0, college: event.college, department: event.department };
      }
      userEngagement[userId].events++;
    }

    eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;

    const hour = event.timestamp?.substring(11, 13) || '00';
    hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
  }

  const topUsers = Object.values(userEngagement)
    .sort((a, b) => b.events - a.events)
    .slice(0, 50);

  const topEventTypes = Object.entries(eventsByType)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => ({ type, count }));

  return writeGold('engagement', {
    totalEvents: events.length,
    uniqueUsers: Object.keys(userEngagement).length,
    topUsers,
    topEventTypes,
    hourlyDistribution,
  });
}

// ============================================================
// JOB 2: Skill Demand/Supply Analysis
// ============================================================
function runSkillsJob(events) {
  console.log('[Spark][skills] Starting skill analytics...');

  const skillEvents = events.filter(e => e.eventType === 'SKILL_ADDED' || e.eventType === 'SKILL_VERIFIED');
  const skillDemandFromCrews = events.filter(e => e.eventType === 'CREW_CREATED');

  const skillSupply = {};
  for (const e of skillEvents) {
    const skill = e.payload?.skillName;
    if (skill) {
      skillSupply[skill] = (skillSupply[skill] || 0) + 1;
    }
  }

  const topSkills = Object.entries(skillSupply)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)
    .map(([skill, count]) => ({ skill, count, dataSource: 'SILVER_EVENTS' }));

  return writeGold('skills', {
    totalSkillAdditions: skillEvents.length,
    uniqueSkills: Object.keys(skillSupply).length,
    topSkills,
    crewsAnalyzed: skillDemandFromCrews.length,
    note: 'Skill demand from crew requirements processed by pig_etl_pipeline.pig',
  });
}

// ============================================================
// JOB 3: Cross-Department Collaboration Patterns
// ============================================================
function runCollaborationJob(events) {
  console.log('[Spark][collaboration] Analyzing cross-department patterns...');

  const deptActivity = {};
  const crewEvents = events.filter(e => e.eventType === 'CREW_MEMBER_JOINED' || e.eventType === 'CREW_CREATED');

  for (const e of events) {
    const dept = e.department || 'UNKNOWN';
    if (!deptActivity[dept]) {
      deptActivity[dept] = { department: dept, totalEvents: 0, postCreations: 0, questAttempts: 0, crewJoins: 0 };
    }
    deptActivity[dept].totalEvents++;
    if (e.eventType === 'POST_CREATED') deptActivity[dept].postCreations++;
    if (e.eventType === 'DAILY_CHALLENGE_ATTEMPTED' || e.eventType === 'QUIZ_COMPLETED') deptActivity[dept].questAttempts++;
    if (e.eventType === 'CREW_MEMBER_JOINED') deptActivity[dept].crewJoins++;
  }

  const departments = Object.values(deptActivity).sort((a, b) => b.totalEvents - a.totalEvents);

  return writeGold('collaboration', {
    departmentsAnalyzed: departments.length,
    departments,
    crewActivityEvents: crewEvents.length,
    crossDeptCollaborationIndex: departments.length > 1 ? 
      departments.reduce((sum, d) => sum + d.crewJoins, 0) / departments.length : 0,
  });
}

// ============================================================
// JOB 4: Project & Quest Completion Trends
// ============================================================
function runTrendsJob(events) {
  console.log('[Spark][trends] Computing completion trends...');

  const dailyTrends = {};

  for (const e of events) {
    const date = e.timestamp?.split('T')[0] || 'unknown';
    if (!dailyTrends[date]) {
      dailyTrends[date] = { date, voyagesCreated: 0, questAttempts: 0, quizzesCompleted: 0, postsCreated: 0, xpEarned: 0 };
    }
    if (e.eventType === 'VOYAGE_CREATED') dailyTrends[date].voyagesCreated++;
    if (e.eventType === 'DAILY_CHALLENGE_ATTEMPTED') dailyTrends[date].questAttempts++;
    if (e.eventType === 'QUIZ_COMPLETED') dailyTrends[date].quizzesCompleted++;
    if (e.eventType === 'POST_CREATED') dailyTrends[date].postsCreated++;
    if (e.eventType === 'XP_EARNED') dailyTrends[date].xpEarned += (e.payload?.amount || 0);
  }

  const trends = Object.values(dailyTrends).sort((a, b) => b.date.localeCompare(a.date));

  return writeGold('trends', {
    daysAnalyzed: trends.length,
    trends,
    totalVoyagesCreated: trends.reduce((s, t) => s + t.voyagesCreated, 0),
    totalQuestAttempts: trends.reduce((s, t) => s + t.questAttempts, 0),
    totalXpDistributed: trends.reduce((s, t) => s + t.xpEarned, 0),
  });
}

// ============================================================
// JOB 5: User Feature Vectors for ML Recommendations
// ============================================================
function runVectorsJob(events) {
  console.log('[Spark][vectors] Building user feature vectors...');

  const userVectors = {};

  for (const e of events) {
    const userId = e.userId;
    if (!userId) continue;

    if (!userVectors[userId]) {
      userVectors[userId] = {
        userId,
        department: e.department,
        college: e.college,
        postCreations: 0,
        questAttempts: 0,
        quizzesCompleted: 0,
        voyagesCreated: 0,
        crewsJoined: 0,
        messagesSent: 0,
        xpEarned: 0,
        levelUps: 0,
        badgesUnlocked: 0,
        eventCount: 0,
      };
    }

    const v = userVectors[userId];
    v.eventCount++;
    if (e.eventType === 'POST_CREATED') v.postCreations++;
    if (e.eventType === 'DAILY_CHALLENGE_ATTEMPTED') v.questAttempts++;
    if (e.eventType === 'QUIZ_COMPLETED') v.quizzesCompleted++;
    if (e.eventType === 'VOYAGE_CREATED') v.voyagesCreated++;
    if (e.eventType === 'CREW_MEMBER_JOINED') v.crewsJoined++;
    if (e.eventType === 'MESSAGE_SENT') v.messagesSent++;
    if (e.eventType === 'XP_EARNED') v.xpEarned += (e.payload?.amount || 0);
    if (e.eventType === 'LEVEL_UP') v.levelUps++;
    if (e.eventType === 'BADGE_UNLOCKED') v.badgesUnlocked++;
  }

  const vectors = Object.values(userVectors);

  return writeGold('feature_vectors', {
    usersProfiled: vectors.length,
    vectors,
    vectorDimensions: ['postCreations', 'questAttempts', 'quizzesCompleted', 'voyagesCreated', 'crewsJoined', 'messagesSent', 'xpEarned', 'levelUps', 'badgesUnlocked'],
    note: 'Feature vectors can be consumed by downstream ML recommendation models',
  });
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  const job = process.argv[2] || 'all';
  console.log(`\n🔥 VYNK Spark Analytics Runner — Job: ${job}`);
  console.log(`📂 Lake Root: ${LAKE_ROOT}`);
  console.log(`📅 Run Time: ${new Date().toISOString()}\n`);

  const events = readAllSilverEvents();

  if (events.length === 0) {
    console.log('⚠️  No events found in SILVER zone. Start the API, perform actions, then re-run.');
    process.exit(0);
  }

  const startTime = Date.now();

  const jobs = {
    engagement: () => runEngagementJob(events),
    skills: () => runSkillsJob(events),
    collaboration: () => runCollaborationJob(events),
    trends: () => runTrendsJob(events),
    vectors: () => runVectorsJob(events),
  };

  if (job === 'all') {
    for (const [name, fn] of Object.entries(jobs)) {
      try { fn(); } catch (err) { console.error(`[Spark][${name}] FAILED:`, err.message); }
    }
  } else if (jobs[job]) {
    jobs[job]();
  } else {
    console.error(`Unknown job: ${job}. Valid: ${Object.keys(jobs).join(', ')}, all`);
    process.exit(1);
  }

  console.log(`\n✅ Spark run complete in ${Date.now() - startTime}ms`);
  console.log(`📊 Gold tables written to: ${GOLD_DIR}`);
}

main().catch(err => {
  console.error('[Spark] Fatal error:', err);
  process.exit(1);
});
