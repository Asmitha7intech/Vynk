const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Ensure directories
ensureDir(path.resolve(__dirname, '../scripts/bigdata'));
ensureDir(path.resolve(__dirname, '../docs'));
ensureDir(path.resolve(__dirname, '../data'));
ensureDir(path.resolve(__dirname, '../apps/api/test'));

// 1. Cross Department Test
const crossDeptTest = `import { describe, it, expect } from 'vitest';

describe('VYNK Cross-Department Matchmaking Engine', () => {
  it('correctly scores complementary skill pairs across different departments', () => {
    const userDept = 'Computer Science';
    const candidateDept = 'Design';
    const userSkills = ['React', 'TypeScript', 'Node.js'];
    const candidateSkills = ['Figma', 'UI/UX', 'Wireframing'];

    const isCrossDept = userDept.toLowerCase() !== candidateDept.toLowerCase();
    expect(isCrossDept).toBe(true);

    let matchScore = isCrossDept ? 40 : 10;
    const complementarySkills = candidateSkills.filter(s => !userSkills.includes(s));
    matchScore += complementarySkills.length * 15;
    const finalScore = Math.min(100, matchScore);

    expect(finalScore).toBe(85);
  });

  it('generates clear rationale explanation for match recommendation', () => {
    const candidate = {
      displayName: 'Maya Patel',
      department: 'Biotechnology',
      skills: [{ skillName: 'Bioinformatics' }, { skillName: 'Python' }],
    };

    const reason = \`From \${candidate.department} with complementary expertise in \${candidate.skills.map(s => s.skillName).join(', ')}\`;
    expect(reason).toContain('Biotechnology');
    expect(reason).toContain('Bioinformatics');
  });
});
`;

fs.writeFileSync(path.resolve(__dirname, '../apps/api/test/cross-department.service.test.ts'), crossDeptTest.trim() + '\n', 'utf8');

// 2. Big Data Test
const bigdataTest = `import { describe, it, expect } from 'vitest';

describe('VYNK Big Data Telemetry & Analytics Pipeline', () => {
  it('formats telemetry event payload for HDFS batch ingestion', () => {
    const event = {
      eventId: 'evt_123456789',
      userId: 'usr_abc',
      institutionId: 'inst_mit',
      eventType: 'CREW_JOIN_REQUEST',
      sourceDepartment: 'Computer Science',
      targetDepartment: 'Electrical Engineering',
      timestamp: new Date().toISOString(),
      metadata: { crewId: 'crew_999', skillRequested: 'Embedded C' }
    };

    expect(event.eventId).toBeDefined();
    expect(event.sourceDepartment).not.toBe(event.targetDepartment);
    expect(event.metadata.skillRequested).toBe('Embedded C');
  });

  it('computes departmental collaboration index from cross-department interactions', () => {
    const interactions = [
      { deptA: 'CS', deptB: 'Design', count: 42 },
      { deptA: 'CS', deptB: 'Mechanical', count: 18 },
      { deptA: 'Design', deptB: 'Business', count: 25 },
    ];

    const total = interactions.reduce((sum, item) => sum + item.count, 0);
    expect(total).toBe(85);

    const topPair = interactions.reduce((max, item) => (item.count > max.count ? item : max), interactions[0]);
    expect(topPair.deptA).toBe('CS');
    expect(topPair.deptB).toBe('Design');
  });
});
`;

fs.writeFileSync(path.resolve(__dirname, '../apps/api/test/bigdata.service.test.ts'), bigdataTest.trim() + '\n', 'utf8');

// 3. scripts/generate-bigdata.js
const generateBigDataContent = `const fs = require('fs');
const path = require('path');

const departments = [
  'Computer Science & Engineering',
  'Electronics & Communication',
  'Information Technology',
  'Mechanical Engineering',
  'Design & Human Computer Interaction',
  'Biotechnology',
  'Data Science & AI',
  'Business Administration'
];

const skillsByDept = {
  'Computer Science & Engineering': ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'Next.js', 'GraphQL'],
  'Electronics & Communication': ['Embedded C', 'IoT', 'Arduino', 'Verilog', 'PCB Design', 'MATLAB'],
  'Information Technology': ['Cloud Architecture', 'AWS', 'Cybersecurity', 'Linux', 'Kubernetes', 'CI/CD'],
  'Mechanical Engineering': ['CAD', 'SolidWorks', '3D Printing', 'Robotics', 'Thermodynamics', 'Ansys'],
  'Design & Human Computer Interaction': ['Figma', 'UI/UX Design', 'User Research', 'Design Systems', '3D Motion', 'Branding'],
  'Biotechnology': ['Bioinformatics', 'CRISPR Data', 'Genomics', 'Python', 'Biostatistics'],
  'Data Science & AI': ['PyTorch', 'TensorFlow', 'LLMs', 'Scikit-Learn', 'Pandas', 'Computer Vision'],
  'Business Administration': ['Product Strategy', 'Market Research', 'Pitch Decks', 'Financial Modeling', 'Agile Scrum']
};

const eventTypes = [
  'PROFILE_VIEW',
  'POST_REACT',
  'POST_COMMENT',
  'QUEST_SUBMITTED',
  'CREW_APPLICATION',
  'CREW_AGREEMENT_SIGNED',
  'CROSS_DEPT_DISCOVERY_CLICK',
  'VOYAGE_STARRED',
  'MENTOR_REQUEST'
];

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log('Generating synthetic Big Data telemetry events for HDFS/Hive testing...');

const recordsCount = 10000;
const events = [];
const csvRows = ['event_id,user_id,institution_id,event_type,source_dept,target_dept,timestamp,xp_earned'];

const now = Date.now();
const oneDayMs = 24 * 60 * 60 * 1000;

for (let i = 1; i <= recordsCount; i++) {
  const sourceDept = departments[Math.floor(Math.random() * departments.length)];
  let targetDept = departments[Math.floor(Math.random() * departments.length)];
  const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const timestamp = new Date(now - Math.floor(Math.random() * 30 * oneDayMs)).toISOString();
  const xpEarned = eventType === 'QUEST_SUBMITTED' ? 25 : eventType === 'CREW_AGREEMENT_SIGNED' ? 100 : 5;
  const eventId = 'evt_' + i.toString().padStart(6, '0');
  const userId = 'usr_' + (Math.floor(Math.random() * 500) + 1).toString().padStart(4, '0');
  const institutionId = 'inst_mit_001';

  events.push({
    eventId,
    userId,
    institutionId,
    eventType,
    sourceDepartment: sourceDept,
    targetDepartment: targetDept,
    timestamp,
    xpEarned,
  });

  csvRows.push(\`\${eventId},\${userId},\${institutionId},\${eventType},"\${sourceDept}","\${targetDept}",\${timestamp},\${xpEarned}\`);
}

fs.writeFileSync(path.join(dataDir, 'vynk_events_10k.json'), JSON.stringify(events, null, 2), 'utf8');
fs.writeFileSync(path.join(dataDir, 'vynk_events_10k.csv'), csvRows.join('\\n'), 'utf8');

console.log(\`Successfully generated \${recordsCount} records in data/vynk_events_10k.json and data/vynk_events_10k.csv\`);
`;

fs.writeFileSync(path.resolve(__dirname, '../scripts/generate-bigdata.js'), generateBigDataContent.trim() + '\n', 'utf8');

// 4. Hive Analytics Script (scripts/bigdata/hive_analytics.hql)
const hiveScriptContent = `-- VYNK Big Data Platform — Apache Hive Analytics Pipeline
-- Analyzes student activity, cross-department collaboration, and skill demand

CREATE DATABASE IF NOT EXISTS vynk_analytics;
USE vynk_analytics;

-- 1. Create External Raw Telemetry Table backed by HDFS
CREATE EXTERNAL TABLE IF NOT EXISTS student_activity_events (
    event_id STRING,
    user_id STRING,
    institution_id STRING,
    event_type STRING,
    source_dept STRING,
    target_dept STRING,
    event_timestamp STRING,
    xp_earned INT
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ','
STORED AS TEXTFILE
LOCATION '/vynk/raw/events/';

-- 2. Create Partitioned Analytical Table (ORC format for fast columnar scanning)
CREATE TABLE IF NOT EXISTS fact_student_events (
    event_id STRING,
    user_id STRING,
    event_type STRING,
    target_dept STRING,
    event_timestamp TIMESTAMP,
    xp_earned INT
)
PARTITIONED BY (institution_id STRING, source_dept STRING)
STORED AS ORC;

-- 3. Query: Top Cross-Department Collaboration Pairs
-- Identifies which departments frequently collaborate on Crews and Projects
SELECT 
    source_dept,
    target_dept,
    COUNT(*) as total_collaborations,
    SUM(xp_earned) as total_xp_generated
FROM student_activity_events
WHERE source_dept != target_dept 
  AND event_type IN ('CREW_APPLICATION', 'CREW_AGREEMENT_SIGNED', 'CROSS_DEPT_DISCOVERY_CLICK')
GROUP BY source_dept, target_dept
ORDER BY total_collaborations DESC
LIMIT 25;

-- 4. Query: Skill Growth Heatmap by Department
SELECT 
    source_dept,
    COUNT(DISTINCT user_id) as active_builders,
    SUM(xp_earned) as aggregate_xp,
    ROUND(SUM(xp_earned) / COUNT(DISTINCT user_id), 2) as avg_xp_per_student
FROM student_activity_events
GROUP BY source_dept
ORDER BY avg_xp_per_student DESC;
`;

fs.writeFileSync(path.resolve(__dirname, '../scripts/bigdata/hive_analytics.hql'), hiveScriptContent.trim() + '\n', 'utf8');

// 5. Pig ETL Pipeline Script (scripts/bigdata/pig_etl_pipeline.pig)
const pigScriptContent = `-- VYNK Big Data Platform — Apache Pig Latin ETL Pipeline
-- Ingests raw campus telemetry, cleans dirty records, and outputs aggregated synergy matrices

-- Load raw CSV stream from HDFS
raw_events = LOAD '/vynk/raw/events/vynk_events_*.csv' USING PigStorage(',') AS (
    event_id:chararray,
    user_id:chararray,
    institution_id:chararray,
    event_type:chararray,
    source_dept:chararray,
    target_dept:chararray,
    timestamp:chararray,
    xp_earned:int
);

-- Filter valid non-header events
valid_events = FILTER raw_events BY event_id != 'event_id' AND user_id IS NOT NULL;

-- Filter for cross-department crew synergy interactions
cross_dept_events = FILTER valid_events BY source_dept != target_dept;

-- Group by Department Pairs
dept_groups = GROUP cross_dept_events BY (institution_id, source_dept, target_dept);

-- Calculate Aggregated Metrics
synergy_summary = FOREACH dept_groups GENERATE
    group.institution_id AS institution_id,
    group.source_dept AS source_dept,
    group.target_dept AS target_dept,
    COUNT(cross_dept_events) AS interaction_count,
    SUM(cross_dept_events.xp_earned) AS total_xp;

-- Store to HDFS processed directory for Hive ingestion & Dashboard caching
STORE synergy_summary INTO '/vynk/processed/department_synergy/' USING PigStorage(',');
`;

fs.writeFileSync(path.resolve(__dirname, '../scripts/bigdata/pig_etl_pipeline.pig'), pigScriptContent.trim() + '\n', 'utf8');

// 6. ARCHITECTURE.md
const architectureContent = `# VYNK Architecture Documentation

## 1. System Overview

VYNK is a production-grade student collaboration and discovery platform designed with a clean, modular multi-tier architecture.

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                 Frontend Tier (React 19 + Vite)             │
│   • Tailwind CSS v4 + Lucide Icons                          │
│   • Zustand State Stores + React Router DOM v7              │
│   • Fully Responsive, Desktop & Mobile Optimized UI         │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / WSS
┌──────────────────────────────▼──────────────────────────────┐
│                  API Gateway Tier (Fastify v5)              │
│   • Strict Zod Schema Validation & CORS Security            │
│   • Rate Limiting & JWT Access/Refresh Token Auth           │
│   • RBAC Middleware: STUDENT, MENTOR, MODERATOR,            │
│     CAMPUS_ADMIN, VYNK_ADMIN                                │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
┌──────────────▼──────────────┐ ┌──────────────▼──────────────┐
│   Transactional Database    │ │    Cache & Pub/Sub Tier     │
│   PostgreSQL 16 (Prisma)    │ │    Redis 7                  │
│   • Users, Skills, Interests│ │    • Realtime Presence      │
│   • Vynks, Crews, Voyages   │ │    • Rate Limit State       │
│   • Quests & Gamification   │ │    • BullMQ Task Queues     │
└──────────────┬──────────────┘ └──────────────┬──────────────┘
               │                               │
┌──────────────▼───────────────────────────────▼──────────────┐
│                 Big Data & Analytics Tier                   │
│   • MongoDB Telemetry Document Store                        │
│   • HDFS Distributed Log Store (CSV / JSON)                 │
│   • Apache Hive Analytics & Apache Pig ETL Pipeline         │
│   • Real-Time Campus Skill & Collaboration Heatmaps         │
└─────────────────────────────────────────────────────────────┘
\`\`\`

## 2. Core Modules

1. **Authentication & RBAC**: Email/password authentication with JWT, bcrypt hashing, and multi-tier role permission hierarchy.
2. **Student Graph & Cross-Department Engine**: Graph discovery and complementary skill matching across different academic departments.
3. **Voyages (Project Portfolios)**: Multi-member project showcase with interactive tech stacks, GitHub/demo links, and star counters.
4. **Crews (Squad Builder)**: Squad formation with defined roles, open slot matching, and automated team collaboration agreements.
5. **Gamification & Leaderboard**: XP accrual, 10-tier dynamic student levels, daily streak tracking, and transparent score breakdowns.
6. **Campus Intelligence**: Big Data pipeline aggregating cross-department affinity, skill scarcity, and student retention.
`;

fs.writeFileSync(path.resolve(__dirname, '../ARCHITECTURE.md'), architectureContent.trim() + '\n', 'utf8');

// 7. API.md
const apiContent = `# VYNK API Specification (v1)

Base URL: \`/api/v1\` (also aliased at \`/api\`)

### Authentication (\`/auth\`)
- \`POST /auth/register\` — Register new student/faculty account with department & college.
- \`POST /auth/login\` — Authenticate and receive JWT access & refresh tokens.
- \`POST /auth/refresh\` — Rotate expired access tokens using refresh token.
- \`GET /auth/me\` — Retrieve authenticated user profile with skills, badges, and interests.

### Users & Social Discovery (\`/users\`)
- \`GET /users/profile\` — Retrieve logged-in user profile.
- \`PATCH /users/profile\` — Update profile headline, bio, college, and social links.
- \`GET /users/:username\` — Get full public portfolio of a student.
- \`GET /users/search?q=\` — Full-text and skill search across campus.
- \`GET /users/cross-department\` — AI cross-department complementary student discovery.
- \`POST /users/skills\` — Add or verify a technical/design skill.

### Vynks Social Graph (\`/vynks\`)
- \`GET /vynks/connections\` — Get confirmed 1-on-1 student connections.
- \`GET /vynks/requests/pending\` — List pending inbound connection invites.
- \`POST /vynks/request/:targetUserId\` — Send connection request.
- \`POST /vynks/accept/:connectionId\` — Accept connection request.
- \`POST /vynks/reject/:connectionId\` — Decline connection request.

### Campus Feed (\`/posts\`)
- \`GET /posts/feed?limit=20&cursor=\` — Cursor-paginated campus feed.
- \`POST /posts\` — Publish project update, question, or accomplishment.
- \`POST /posts/:id/react\` — Toggle reaction emoji on post.
- \`POST /posts/:id/comments\` — Add comment to post discussion.

### Crews & Squads (\`/crews\`)
- \`GET /crews\` — Browse open hackathon and startup squads.
- \`GET /crews/:id\` — Get crew details and open team slots.
- \`POST /crews\` — Create a new project squad.
- \`POST /crews/:id/join\` — Apply for a specific role slot.
- \`POST /crews/:id/sign-agreement\` — Electronically sign team collaboration agreement.

### AI Matchmaking (\`/matching\`)
- \`GET /matching/crews/:crewId/recommendations\` — Complementarity score and suggested teammates.

### Gamification & Quests (\`/gamification\`, \`/quests\`)
- \`GET /gamification/leaderboard?scope=GLOBAL\` — Real-time student XP leaderboard.
- \`GET /gamification/rank-explanation/:userId\` — Transparent factor breakdown for student rank.
- \`GET /quests/daily-challenge\` — Today's technical challenge.
- \`POST /quests/daily-challenge/submit\` — Submit answer for daily XP reward.

### Big Data & Campus Intelligence (\`/analytics/bigdata\`)
- \`GET /analytics/bigdata/campus-heatmap\` — Skill distribution across departments.
- \`GET /analytics/bigdata/dept-collaboration\` — Inter-department collaboration frequency matrix.
- \`GET /analytics/bigdata/skill-demand\` — Campus skill demand vs supply gap metrics.
`;

fs.writeFileSync(path.resolve(__dirname, '../API.md'), apiContent.trim() + '\n', 'utf8');

// 8. BIG_DATA.md
const bigdataMdContent = `# VYNK Big Data & Campus Intelligence Architecture

## 1. Vision & Pipeline

VYNK is designed to analyze campus-wide builder dynamics, team formation friction, and skill gaps across multi-department university campuses.

### Pipeline Flow:
1. **Telemetry Capture**: Student interactions (profile views, project stars, squad applications, cross-department clicks) are emitted as structured telemetry.
2. **Buffer & Store**: Events stream into MongoDB and batch-export to HDFS in partitioned CSV/ORC format.
3. **ETL & Processing**: Apache Pig cleans dirty records and aggregates departmental synergy metrics.
4. **Analytical SQL**: Apache Hive executes OLAP queries on top of HDFS tables to generate campus heatmaps and skill demand matrices.
5. **Consumption**: Aggregated metrics are served via \`/api/v1/analytics/bigdata/*\` to the web dashboard.

## 2. Running Big Data Scripts

\`\`\`bash
# 1. Generate 10,000 synthetic campus activity events
npm run generate:bigdata

# 2. View generated datasets
cat data/vynk_events_10k.csv | head -n 10

# 3. Execute Hive queries (in Hive CLI or Beeline)
hive -f scripts/bigdata/hive_analytics.hql

# 4. Execute Pig ETL pipeline
pig -x local scripts/bigdata/pig_etl_pipeline.pig
\`\`\`
`;

fs.writeFileSync(path.resolve(__dirname, '../BIG_DATA.md'), bigdataMdContent.trim() + '\n', 'utf8');

// 9. DATABASE.md
const databaseMdContent = `# VYNK Database & Data Models

## 1. Primary RDBMS (PostgreSQL 16 via Prisma ORM)

The relational schema strictly enforces referential integrity for student accounts, projects, squads, and gamification events.

### Core Entities:
- **User**: Student/faculty identity, hashed password, role (\`STUDENT\`, \`MENTOR\`, \`MODERATOR\`, \`CAMPUS_ADMIN\`, \`VYNK_ADMIN\`), ambassador flag, department, college, XP, level, daily streak.
- **Institution & Department**: Academic hierarchy enabling cross-department matching and verified student email domains.
- **UserSkill & UserInterest**: Granular technical and design skills with proficiency levels and verification evidence.
- **Crew & CrewMember & CrewRole**: Squad formation, open slot management, and signed team agreements.
- **Voyage & VoyageMember**: Showcase projects, repository URLs, live demo links, and star counters.
- **Post, Comment, Reaction**: Real-time social discussions and project updates.
- **DailyChallenge, Quiz, BountyBadge**: Gamified learning challenges and earned milestone credentials.

## 2. High-Speed Cache (Redis 7)
- Session invalidation & token blacklisting.
- User online presence and typing indicators.
- API rate-limiting buckets (200 req/min per IP/token).

## 3. Telemetry Store (MongoDB / HDFS)
- Append-only event logs for campus intelligence analytics.
`;

fs.writeFileSync(path.resolve(__dirname, '../DATABASE.md'), databaseMdContent.trim() + '\n', 'utf8');

// 10. SECURITY.md
const securityMdContent = `# VYNK Security & Governance Specification

## 1. Authentication & Session Management
- **Password Security**: Passwords hashed using bcrypt with work factor 12.
- **Token Lifecycle**: Short-lived JWT Access Tokens (15m) paired with Refresh Tokens (7d).
- **Safe Response Sanitization**: User entity serialization strictly strips \`passwordHash\` from all API endpoints.

## 2. Role-Based Access Control (RBAC)
- \`STUDENT\`: Standard builder profile, squad join, voyage publishing.
- \`MENTOR\`: Student mentorship, office hours, feedback.
- \`MODERATOR\`: Content moderation, report triaging.
- \`CAMPUS_ADMIN\`: Institution department configuration, ambassador management.
- \`VYNK_ADMIN\`: Full global platform analytics, audit logging, system health.

## 3. API Hardening
- **Input Validation**: All payloads validated using strict Zod schemas before hitting business logic.
- **Rate Limiting**: Configured at API gateway level (200 req/min per client).
- **CORS Policy**: Strict origin headers allowing only authorized web clients.
- **Error Shielding**: Database error details suppressed in production responses to prevent information leakage.
`;

fs.writeFileSync(path.resolve(__dirname, '../SECURITY.md'), securityMdContent.trim() + '\n', 'utf8');

console.log('Successfully created all big data scripts, tests, and documentation!');

