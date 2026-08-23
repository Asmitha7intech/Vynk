const fs = require('fs');
const path = require('path');

const adrDir = path.resolve(__dirname, '../docs/adr');

function writeAdr(filename, title, context, decision, consequences, alternatives) {
  const content = `# ADR ${filename.replace('.md', '')}: ${title}

## Context
${context.trim()}

## Decision
${decision.trim()}

## Alternatives Considered
${alternatives.trim()}

## Consequences & Trade-offs
${consequences.trim()}
`;
  fs.writeFileSync(path.join(adrDir, filename), content.trim() + '\n', 'utf8');
  console.log('Created ADR:', filename);
}

// 001
writeAdr(
  '001-monorepo.md',
  'Monorepo Architecture with pnpm Workspaces and Turborepo',
  'VYNK consists of multiple frontend and backend services sharing common data models, Zod validation schemas, database clients, and configuration.',
  'Adopt pnpm workspaces paired with Turborepo. Shared code is centralized in @vynk/types, @vynk/validation, @vynk/database, and @vynk/config.',
  'Enables single-command builds and zero type drift between client and server.',
  'Polyrepo approach (rejected due to schema synchronization overhead) or npm/yarn workspaces.'
);

// 002
writeAdr(
  '002-postgresql.md',
  'PostgreSQL as Primary Relational Database',
  'VYNK requires strong transactional guarantees for XP transactions, level updates, and complex relational graphs (Users, Vynks, Crews, Voyages, Quests).',
  'Select PostgreSQL 16 as the primary persistent data store.',
  'Provides ACID compliance, complex relational indexing, and extension support for vector search.',
  'MongoDB/NoSQL (rejected due to lack of multi-entity relational integrity for financial/XP ledgers).'
);

// 003
writeAdr(
  '003-prisma.md',
  'Prisma ORM for Data Access and Migrations',
  'Need end-to-end type safety and automated migration tracking across development and production.',
  'Use Prisma ORM as the primary data access layer packaged in @vynk/database.',
  'Auto-generated TypeScript types ensure zero runtime type mismatches between schema and queries.',
  'TypeORM, MikroORM, raw SQL queries.'
);

// 004
writeAdr(
  '004-authentication.md',
  'Stateless JWT with Rotating Refresh Tokens and RBAC',
  'Authentication must be secure, stateless for API scalability, and enforce strict role-based access control.',
  'Issue short-lived JWT access tokens (15m) and store rotating refresh tokens (7d). Enforce server-side role checks (STUDENT, MENTOR, MODERATOR, ADMIN).',
  'Mitigates token theft risk while keeping Fastify route verification non-blocking and fast.',
  'Pure session cookies, OAuth-only without local fallback.'
);

// 005
writeAdr(
  '005-websocket.md',
  'Socket.IO for Real-time Messaging and Presence',
  'Users require real-time chat delivery, typing status indicators, online presence, and instant notification alerts.',
  'Implement Socket.IO on top of Fastify HTTP server with JWT handshake authentication and room-based pub/sub.',
  'Provides automatic reconnects, fallback transport, and clean room management (direct convs, crew channels).',
  'Raw WebSockets (lacks built-in reconnection and room abstraction), Server-Sent Events (unidirectional only).'
);

// 006
writeAdr(
  '006-ai-recommendation.md',
  'Explainable Complementary Team Matching Engine',
  'Traditional team discovery matches purely on identical skills, leading to unbalanced hackathon teams (e.g. 4 ML engineers, 0 frontend/designers).',
  'Build a weighted complementarity formula: 30% Skill Complementarity (filling missing roles), 20% Interest, 15% Role, 15% Availability, 10% Experience, 10% Working Style. All recommendations return human-readable explanations.',
  'Increases hackathon project completion rates and helps introvert students discover teammates without cold messaging.',
  'Naive cosine similarity on raw profiles without role requirements.'
);

// 007
writeAdr(
  '007-pgvector.md',
  'pgvector for In-Database Semantic Embedding Search',
  'Need semantic similarity between student interests, project descriptions, and mentor expertise without introducing external vector database complexity.',
  'Use the pgvector extension inside PostgreSQL with HNSW indexing.',
  'Eliminates the cost and operational overhead of external vector databases like Pinecone.',
  'Pinecone, Weaviate, Qdrant.'
);

// 008
writeAdr(
  '008-state-management.md',
  'Zustand and TanStack Query for Client State',
  'Client needs separation between server-synced caching (feed, voyages, quests) and local UI states (auth tokens, active modal, chat typing).',
  'Use TanStack Query for server state caching and Zustand for lightweight global reactive UI stores.',
  'Eliminates boilerplate while providing robust cache invalidation and optimistic updates.',
  'Redux Toolkit (heavy boilerplate), React Context (unnecessary re-renders).'
);

// 009
writeAdr(
  '009-deployment.md',
  'Containerized Deployment with Docker Compose & Cloud Parity',
  'Need reproducible local development and cloud deployment parity.',
  'Containerize PostgreSQL (pgvector), Redis, Fastify API, and Vite Web with multi-stage Dockerfiles.',
  'Guarantees identical runtime environment across developer workstations and production.',
  'Manual local installations.'
);

// 010
writeAdr(
  '010-messaging-security.md',
  'Restricted Direct Messaging Access Control',
  'Unrestricted direct messaging leads to spam, harassment, and low-quality student networking.',
  'Enforce strict server-side rules: Direct messaging is ONLY permitted between users with an ACCEPTED Vynk connection. Mentorship messages require an ACCEPTED mentorship proposal.',
  'Protects student privacy and incentivizes genuine networking proposals.',
  'Open open-inbox DMs (vulnerable to spam and harassment).'
);

console.log('All 10 ADRs authored successfully!');
