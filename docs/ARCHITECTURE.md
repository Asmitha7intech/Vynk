# VYNK System Architecture Documentation

**Tagline:** *Find your people. Learn. Build. Rise.*  
**Platform Version:** 5.0 (Production Architecture + Big Data Lab)

---

## 1. High-Level Monorepo Architecture

VYNK is engineered as a modern TypeScript monorepo orchestrated via `pnpm` workspaces and Turborepo.

```
vynk/
├── apps/
│   ├── api/                   # Fastify 5 REST API & WebSocket Realtime Gateway
│   └── web/                   # React 18 + Vite + Tailwind CSS + Framer Motion SPA
├── packages/
│   ├── database/              # Dual-Engine: PostgreSQL (pgvector) + LocalStore Proxy
│   ├── types/                 # Shared TypeScript domain contracts
│   ├── validation/            # Shared Zod validation schemas
│   └── config/                # Platform configuration constants
├── bigdata/
│   ├── mapreduce/             # Python MapReduce streaming scripts (Jobs A, B, C)
│   ├── pig/                   # Apache Pig Latin ETL transformation scripts
│   └── hive/                  # Apache Hive DDL, curated tables and analytical SQL
├── data/
│   ├── seeds/                 # Canonical 58-student classroom directory roster
│   ├── uploads/avatars/       # Static avatar binary store with magic-byte validation
│   ├── bigdata/fixtures/      # Academic test fixtures (skills, activities, corpus)
│   ├── bigdata/outputs/       # Executed job outputs and exports
│   └── vynk_db.json           # Resilient local JSON state store
├── data-platform/             # PySpark batch ETL & Kafka event streaming pipeline
└── docs/                      # Architectural specifications and runbooks
```

---

## 2. Authentication, Session & Security Model

1. **Password Hashing:** Passwords hashed with `bcryptjs` (salt rounds: 10).
2. **Session Revocation:**
   - Active user sessions tracked server-side in `prisma.session`.
   - JWT tokens include unique session IDs (`sessionId`).
   - Every authenticated request verifies `revokedAt === null` and `expiresAt > now`.
   - Logging out immediately marks the session as revoked in the database.
3. **Password Recovery:**
   - Single-use cryptographically random tokens stored in `prisma.passwordResetToken`.
   - Resetting password terminates all existing sessions of that user immediately.
4. **Profile Picture Uploads:**
   - Enforces a 5MB size ceiling.
   - Inspects file magic bytes (JPEG: `FF D8 FF`, PNG: `89 50 4E 47`, WebP: `RIFF...WEBP`).
   - Rejects unapproved MIME types or spoofed extensions.
   - Saves to `data/uploads/avatars/` with UUID filenames.
   - Serves statically via `/uploads/*` with path-traversal prevention.

---

## 3. Classroom Directory Subsystem

1. **Roster Model:**
   - Stores exact original display names, student IDs (e.g. `STU-2026-001` through `STU-2026-058`), departments, cohorts, and graduation year.
   - Normalized search fields (`normalizedName`) are isolated from display strings.
2. **Claiming Protocol:**
   - Unclaimed directory records are separated from registered user accounts.
   - Authenticated students claim their profile by matching official Student ID / USN credentials.
   - Atomic verification prevents duplicate claims or takeover.
   - Administrative spelling corrections log an immutable audit trail (`auditTrail`).
3. **Idempotent Seed Script:**
   - `scripts/seed-classroom-directory.ts` reads `data/seeds/classroom_roster.json`.
   - Supports `--dry-run` and `--reset`.
   - Re-running the script updates records idempotently without duplicate generation.

---

## 4. VYNK Big Data Lab Subsystem

The **VYNK Big Data Lab** implements all six required syllabus concepts:

### Concept 1: Website & Unstructured Data ↔ HDFS
- **Import:** Ingests CSV, JSON, and text into logical HDFS namespaces (`/vynk/raw/web/`, `/vynk/raw/uploads/`), computing SHA-256 hashes and validating file existence.
- **Export:** Lossless data extraction with schema and row-count verification.

### Concept 2: SQL ↔ HDFS Bidirectional Pipeline
- **Extraction:** Reads relational tables (`ClassroomDirectory`, `UserSkills`), serializes to JSONL/Parquet, and calculates checksums.
- **Reconciliation:** Verifies 100% row match between relational database and HDFS target.

### Concept 3: Parallel MapReduce (Streaming)
- **Job A (Skill Frequency):** `skill_frequency_mapper.py` emits `<skill>\t1`, `skill_frequency_reducer.py` aggregates totals.
- **Job B (Project Activity Aggregation):** Groups by project category and event type, summing volume and XP.
- **Job C (Text Corpus Analysis):** Tokenizes unstructured project descriptions, strips stopwords, and ranks term frequencies.

### Concept 4: NoSQL Document Storage (MongoDB)
- **Document Model:** Activity events stored with unique compound indexes (`{ eventId: 1 }`).
- **Aggregations:** Multi-stage pipelines (`$group`, `$sort`) analyzing activity volume, event distributions, and cross-department collaboration indexes.

### Concept 5: Apache Pig Latin ETL
- **Scripts:** `skill_analysis.pig`, `project_activity_analysis.pig`, `text_metadata_analysis.pig`, `data_quality_checks.pig`.
- **Quality Separation:** Uses Pig `SPLIT` operator to quarantine malformed rows while passing valid tuples into curated storage.

### Concept 6: Apache Hive Metastore Data Warehouse
- **Metastore Scripts:**
  - `00_create_database.sql`: Initializes `vynk_dw`.
  - `01_create_raw_tables.sql`: External tables over raw landing zones.
  - `02_create_curated_tables.sql`: Internal Parquet tables with column partitions.
  - `03_skill_analytics.sql`: Skill distribution and depth rankings.
  - `04_project_analytics.sql`: Project collaboration metrics.
  - `05_activity_analytics.sql`: Multi-table joins between Directory and Activity records.
  - `06_data_quality.sql`: Null check rates and completeness percentages.

---

## 5. Resilient Dual-Engine Database Architecture

The application uses an intelligent database proxy:
1. Probes native PostgreSQL on port 5432 with short timeout.
2. If PostgreSQL is reachable, executes queries against PostgreSQL.
3. If PostgreSQL is offline or unreachable, transparently falls back to `LocalStoreEngine` saving to `data/vynk_db.json`.
4. Zero downtime or crash during local evaluation.
