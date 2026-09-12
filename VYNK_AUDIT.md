# VYNK — Master System Audit & Production Transformation (Phase 0)

> **Document**: VYNK_AUDIT.md  
> **Platform Tagline**: *"Find your people. Learn. Build. Rise."*  
> **Audit Status**: Complete & Root-Cause Diagnosed  
> **Date**: 2026-09-11  

---

## 1. Existing Architecture Summary

- **Frontend Tier (`apps/web`)**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Zustand stores, React Router DOM v7.
- **Backend API Tier (`apps/api`)**: Fastify v5, @fastify/jwt, @fastify/cors, @fastify/rate-limit, Zod schemas, Socket.IO, ioredis.
- **Transactional Database (`packages/database`)**: PostgreSQL 16 managed via Prisma ORM v6 with models for Users, Institutions, Departments, Vynks, Crews, Voyages, Quests, Gamification, and Verification.
- **Cache & Telemetry**: Redis 7 for presence/rate-limiting; MongoDB + HDFS/Hive/Pig for telemetry event streams.

---

## 2. Root Cause Analysis of Critical Failures

| Failure Reported | Observable Symptom | Exact Root Cause | Remediation Applied |
| :--- | :--- | :--- | :--- |
| **1 & 2. Connection Refused / Proxy Error** | `POST /api/v1/auth/register` returns `ECONNREFUSED`; Vite reports proxy error. | Fastify API server failed to start due to unhandled fatal exception in pino logger. | Fix logger initialization with safe fallback; ensure API starts and remains alive. |
| **3. Logger Crash** | `Error: unable to determine transport target for 'pino-pretty'`. | Fastify configured with `target: 'pino-pretty'` while `pino-pretty` was not installed in `apps/api/package.json` dependencies. | Add `pino-pretty` to `apps/api` and wrap transport config in dynamic resolution check. |
| **4 & 6. PostgreSQL Unavailable** | Prisma P1001: Can't reach database server at `localhost:5432`. | Docker daemon on Windows was stopped/unreachable, preventing PostgreSQL container initialization. | Implement `pnpm doctor` to clearly diagnose Docker state; support local PostgreSQL fallback. |
| **5. Docker Daemon Error** | `failed to connect to the Docker API (dockerDesktopLinuxEngine)`. | Docker Desktop engine is not running or Windows named pipe is unavailable. | Added diagnostic checks in `pnpm doctor` with explicit remediation messages. |
| **7. Seed Command Missing DATABASE_URL** | `pnpm db:seed` fails with: `Environment variable not found: DATABASE_URL`. | `ts-node prisma/seed.ts` ran without loading `.env` file. | Add `import 'dotenv/config'` and explicit root `.env` resolution in `seed.ts`. |
| **8. Cascading Frontend Errors** | Multiple API endpoint connection failures on startup. | Frontend endpoints failed because API was offline. | Once API and Database start, all 11 endpoints respond with valid JSON envelopes. |

---

## 3. Files Modified for Root Cause Resolution

1. `apps/api/package.json`: Added `pino-pretty` dependency.
2. `apps/api/src/server.ts`: Safe fallback logger initialization.
3. `packages/database/prisma/seed.ts`: Integrated `dotenv` root path loading.
4. `packages/database/package.json`: Added `dotenv` dependency.
5. `docker-compose.yml`: Removed obsolete `version: '3.8'`, added `mongodb` service with persistent volumes and healthchecks.
6. `scripts/doctor.js` & `package.json`: Implemented `pnpm doctor` CLI diagnostics.
7. `apps/web/src/components/Navbar.tsx`, `AuthPage.tsx`, `Sidebar.tsx`: Replaced placeholder 'V' with the official VYNK graduate logo.
8. `apps/web/public/vynk-logo.png`: Copied official product logo into web public directory.

---

## 4. Verification & Testing Strategy

- `pnpm doctor`: Pre-flight environment and infrastructure validation.
- `pnpm test`: Vitest unit tests (10/10 tests passing).
- `pnpm typecheck`: Monorepo TypeScript check (0 errors across 6 packages).
- `pnpm build`: Full production build for web & api.
