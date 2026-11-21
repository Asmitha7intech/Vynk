# VYNK — Current Architecture Specification (Phase 0 Baseline)

## 1. System Overview
VYNK is a student-first collaboration and builder platform designed to connect students across colleges and academic departments, facilitate cross-department project crew formation, showcase student portfolios via "Voyages", and engage students with daily coding challenges, quizzes, and gamified skill progression.

## 2. Monorepo Structure
The repository is managed via `pnpm` workspaces:
- `apps/api`: Fastify 5 REST API, JWT auth, Prisma ORM, Socket.io for real-time web sockets.
- `apps/web`: React 19, TypeScript, Vite, Tailwind CSS, Lucide icons, Zustand state management.
- `packages/database`: Prisma schema (`schema.prisma`), Prisma client, resilient proxy fallback engine (`local-store.ts`) reading/writing `data/vynk_db.json`.
- `packages/types`: Shared TypeScript interfaces and contracts.
- `packages/validation`: Shared Zod validation schemas.
- `packages/config`: Shared configuration constants and environment presets.

## 3. Storage & Persistence Tier
- **Primary Database**: PostgreSQL (configured via `DATABASE_URL`).
- **Resilient Fallback**: If PostgreSQL connection fails (e.g. offline dev), `@vynk/database` transparently routes queries through `LocalStoreEngine` backed by `data/vynk_db.json` with ACID-like atomic writes, foreign key emulation, and indexing.
- **Cache/Ephemeral**: Redis client configuration with graceful local memory fallback.

## 4. Current Core Services
- `auth.service.ts`: Registration with bcrypt password hashing, login with JWT token issuance, profile queries.
- `post.service.ts`: Campus feed, posts, reactions, comments, department filtering.
- `voyage.service.ts`: Student project showcases, tags, team associations.
- `crew.service.ts`: Collaboration teams, role openings, member applications.
- `quest.service.ts`: Daily coding challenges, challenge attempts, quiz attempts.
- `gamification.service.ts`: XP progression, level calculations ($Level = \min(10, \max(1, \lfloor\sqrt{XP/50}\rfloor + 1))$), leaderboards.
- `user.service.ts`: Cross-department student matchmaking and search.
- `analytics.service.ts`: Campus interaction heatmap and department metrics.

## 5. Known Gaps Addressed in Target Architecture
- Lack of asynchronous event streaming (HTTP operations currently do direct updates without decoupled event bus).
- No Medallion Data Lake architecture (RAW / BRONZE / SILVER / GOLD).
- Real-time analytics relies on synchronous database aggregation rather than distributed stream processing.
- Cross-department recommendations use heuristic matching rather than personalized behavioral feature vectors.
