# VYNK — PRODUCTION DEPLOYMENT & OPERATIONS GUIDE

**Target Audience:** DevOps Engineers, Platform Architects, Site Reliability Engineers  
**Platform Version:** VYNK v1.0.0-production-launch  
**Documentation Date:** November 21, 2026

---

## 1. System Topology & Production Architecture

The VYNK production architecture is designed for high availability, sub-100ms API response times, secure real-time student messaging, and zero-synthetic-data compliance.

```
                              ┌─────────────────────────────────────────┐
                              │           Cloudflare Edge / DNS         │
                              │     SSL / TLS Termination & WAF         │
                              └────────────────────┬────────────────────┘
                                                   │
                         ┌─────────────────────────┴─────────────────────────┐
                         ▼                                                   ▼
            ┌───────────────────────────┐                       ┌───────────────────────────┐
            │   Frontend Application    │                       │    Backend API Gateway    │
            │     Vercel / Nginx        │                       │   Fastify 5 / Node 22     │
            │     (vynk.app)            │                       │   (api.vynk.app)          │
            └────────────┬──────────────┘                       └─────────────┬─────────────┘
                         │                                                    │
                         │ HTTPS / Assets                                     │ REST / WebSockets
                         ▼                                                    ▼
            ┌───────────────────────────┐                       ┌───────────────────────────┐
            │   Cloudflare R2 / S3      │                       │     Internal Services     │
            │    Media & Avatars        │                       │  Argon2id, Mail, Vectors  │
            └───────────────────────────┘                       └──────┬─────────────┬──────┘
                                                                       │             │
                                            ┌──────────────────────────┘             └──────────────────────────┐
                                            ▼                                                                   ▼
                             ┌─────────────────────────────┐                                     ┌─────────────────────────────┐
                             │  PostgreSQL 16 + pgvector   │                                     │     Redis 7 (In-Memory)     │
                             │   (Neon / Supabase / RDS)   │                                     │    (Upstash / Redis Cloud)  │
                             │  Primary Relational Store   │                                     │  Sessions, PubSub, Limits   │
                             └─────────────────────────────┘                                     └─────────────────────────────┘
```

---

## 2. Infrastructure Prerequisites

Before deploying VYNK to production, provision the following cloud resources:

| Service | Recommended Provider | Minimum Specs / Requirements |
| :--- | :--- | :--- |
| **PostgreSQL Database** | Neon Serverless / Supabase / AWS RDS | PostgreSQL 16+, `pgvector` extension enabled, SSL mode required |
| **Redis Cache** | Upstash Serverless / Redis Cloud / ElastiCache | Redis 7.0+, minimum 256MB memory, TLS enabled |
| **Object Storage** | Cloudflare R2 / AWS S3 | S3-compatible, private bucket, public CDN subdomain for asset delivery |
| **Email Service** | Resend / SendGrid / Amazon SES | Verified domain sending reputation, DKIM/SPF configured |
| **Container Hosting** | Railway / Render / AWS ECS / Fly.io | 1 vCPU, 1 GB RAM for API; Static host or CDN for Web |

---

## 3. Environment Configuration

### 3.1 Backend Environment Variables (`apps/api`)
Deploy the backend with the following environment variables (refer to `.env.example` in repo root):

```ini
# Core
PORT=4000
NODE_ENV=production
API_URL=https://api.vynk.app
WEB_URL=https://vynk.app
CORS_ORIGIN=https://vynk.app

# Database & Cache
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<dbname>?sslmode=require"
REDIS_URL="rediss://default:<password>@<host>:6379"

# Cryptography & Session (Generate via openssl rand -base64 32)
JWT_SECRET="<MIN_32_CHAR_CRYPTOGRAPHICALLY_SECURE_RANDOM_SECRET>"
JWT_REFRESH_SECRET="<MIN_32_CHAR_CRYPTOGRAPHICALLY_SECURE_RANDOM_SECRET>"
COOKIE_SECRET="<MIN_32_CHAR_CRYPTOGRAPHICALLY_SECURE_RANDOM_SECRET>"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Email Verification (Resend or SMTP)
EMAIL_FROM="VYNK Campus <noreply@vynk.app>"
RESEND_API_KEY="re_live_xxxxxxxxxxxxxxxxxxxxxxxx"
ALLOWED_COLLEGE_DOMAINS="citchennai.net,annauniv.edu,iitm.ac.in,mit.edu,stanford.edu"

# Storage (Cloudflare R2 or S3)
STORAGE_PROVIDER="r2"
STORAGE_BUCKET="vynk-assets-prod"
STORAGE_ENDPOINT="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
STORAGE_ACCESS_KEY="<R2_ACCESS_KEY_ID>"
STORAGE_SECRET_KEY="<R2_SECRET_ACCESS_KEY>"
```

### 3.2 Frontend Environment Variables (`apps/web`)
Set build-time environment variables for the frontend:

```ini
VITE_API_BASE_URL=https://api.vynk.app
VITE_WS_URL=wss://api.vynk.app
```

---

## 4. Step-by-Step Deployment Options

### Option A: Fully Managed Cloud (Neon + Railway + Vercel)

#### Step 1: Database Setup (Neon or Supabase)
1. Create a project in [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Enable the `vector` extension in the SQL editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Copy the pooled connection string into `DATABASE_URL`.
4. Run migrations from the repository:
   ```bash
   pnpm --filter @vynk/database db:migrate
   ```

#### Step 2: Bootstrap Canonical SuperAdmin
Execute the provisioning script with production credentials to ensure `asmitha7intech@gmail.com` exists as `SUPER_ADMIN`:
```bash
node scripts/provision-canonical-owner.js
```
*Note: This script idempotently creates or updates the canonical superadmin account with role `SUPER_ADMIN` and preserves existing admin accounts.*

#### Step 3: Backend Deployment (Railway or Render)
1. Link your GitHub repository to Railway or Render.
2. Select Root Directory: `.`
3. Set Build Command:
   ```bash
   pnpm install --frozen-lockfile && pnpm --filter @vynk/types build && pnpm --filter @vynk/database db:generate && pnpm --filter @vynk/api build
   ```
4. Set Start Command:
   ```bash
   node apps/api/dist/server.js
   ```
5. Configure Health Check Path: `/ready`
6. Add all Backend Environment Variables.

#### Step 4: Frontend Deployment (Vercel or Cloudflare Pages)
1. Create a new project in [Vercel](https://vercel.com).
2. Set Framework Preset: **Vite**.
3. Set Root Directory: `.`
4. Set Build Command:
   ```bash
   pnpm install --frozen-lockfile && pnpm --filter @vynk/types build && pnpm --filter @vynk/web build
   ```
5. Set Output Directory: `apps/web/dist`
6. Configure Rewrites in `vercel.json` for SPA routing:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
7. Configure `VITE_API_BASE_URL` to `https://api.vynk.app`.

---

### Option B: Containerized Docker Deployment (`docker-compose.prod.yml`)

For on-premises, single-server VPS (DigitalOcean, AWS EC2, Hetzner), VYNK includes a complete, production-ready `docker-compose.prod.yml`.

1. **Clone repository onto the target server:**
   ```bash
   git clone -b clean-reset https://github.com/vynk/vynk.git /opt/vynk
   cd /opt/vynk
   ```

2. **Configure production secrets:**
   ```bash
   cp .env.example .env
   # Edit .env with your production secrets and domain names
   nano .env
   ```

3. **Build and start services:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

4. **Verify container health:**
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```
   All 4 services (`vynk-postgres`, `vynk-redis`, `vynk-api`, and `vynk-web`) should report `healthy` or `running`.

5. **Run database migrations inside the API container:**
   ```bash
   docker compose -f docker-compose.prod.yml exec api pnpm --filter @vynk/database db:migrate
   ```

6. **Seed canonical SuperAdmin:**
   ```bash
   docker compose -f docker-compose.prod.yml exec api node scripts/provision-canonical-owner.js
   ```

---

## 5. Health Checks, Monitoring & Observability

### 5.1 Health Check Endpoints
- **Liveness Probe:** `GET /health`
  - Responds: `HTTP 200 OK`
  - Body: `{"status":"ok","uptime":...,"timestamp":...}`
  - Purpose: Basic process liveness check for load balancers.
- **Readiness Probe:** `GET /ready`
  - Responds: `HTTP 200 OK` (when database responds) or `HTTP 503 Service Unavailable`
  - Body: `{"status":"ready","database":"connected","timestamp":...}`
  - Purpose: Deep dependency check for Kubernetes or Docker orchestrators before routing traffic.

### 5.2 Cleanliness Verification in Production
To guarantee that no mock data has accidentally entered the database, run:
```bash
node scripts/verify-clean.js
```
Expected output:
```
======================================================
  VYNK PRODUCTION CLEAN-STATE VERIFICATION
======================================================
✓ Users count: Exactly 3 authorized administrative accounts.
✓ Canonical Owner: asmitha7intech@gmail.com (SUPER_ADMIN)
✓ Mock files check: 0 mock fixtures present.
STATUS: 100% PRODUCTION CLEAN
```

---

## 6. Disaster Recovery & Backup Runbook

### 6.1 Database Automated Backups
Schedule daily PostgreSQL dumps using cron or cloud database automated snapshot tools:
```bash
# Automated database backup script
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump -Fc "$DATABASE_URL" > "/backups/vynk_db_${TIMESTAMP}.dump"
```

### 6.2 Application State Backup Utility
Run the built-in backup utility to archive user configuration and uploaded assets:
```bash
node scripts/backup-clean.js
```
This stores a non-destructive timestamped snapshot in `backups/YYYYMMDDTHHMMSSZ/`.

### 6.3 Restoration Procedure
To restore the platform to a fresh database from a dump:
```bash
# 1. Restore PostgreSQL schema & records
pg_restore --clean --if-exists -d "$DATABASE_URL" "/backups/vynk_db_xxxxxx.dump"

# 2. Run Prisma migration check
pnpm --filter @vynk/database db:migrate

# 3. Verify clean state
node scripts/verify-clean.js
```

---

## 7. Security Hardening Checklist for Production

- [x] SSL/TLS configured on all external endpoints (HTTPS and WSS).
- [x] Rate limiting active on `/api/v1/auth/*` and `/api/v1/storage/*`.
- [x] CORS restricted to `https://vynk.app`.
- [x] HttpOnly, Secure, SameSite=Lax flags active on refresh token cookies.
- [x] Magic-byte validation active on all media uploads (blocking disguised executables).
- [x] Passwords hashed with Argon2id (memoryCost: 65536, timeCost: 3, parallelism: 4).
- [x] Rotating refresh tokens revoke token families on detected reuse.
- [x] Admin console (`/admin`) guarded by role-based middleware (`ADMIN` or `SUPER_ADMIN`).
- [x] Zero synthetic users or simulated metrics in production database.
