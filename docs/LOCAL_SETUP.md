# VYNK Local Setup & Verification Guide

Follow these instructions to run the application, seed the 58-student classroom roster, verify student collaboration, and execute Big Data Lab jobs.

---

## 1. Prerequisites

- **Node.js**: v18.0.0 or later (v20+ recommended)
- **pnpm**: v9.0.0 or later
- **Python**: v3.9+ (for MapReduce scripts and PySpark data platform)
- **Docker** (Optional): For native PostgreSQL, Redis, MongoDB, or Hadoop services.

---

## 2. Quickstart Installation

In the project root directory:

```bash
# 1. Install all dependencies across monorepo packages
pnpm install

# 2. Seed the 58-student Classroom Directory
pnpm --filter @vynk/api exec tsx ../../scripts/seed-classroom-directory.ts

# 3. Start API backend (runs on http://localhost:4000)
pnpm --filter @vynk/api dev

# 4. In a second terminal, start the web frontend (runs on http://localhost:5173)
pnpm --filter @vynk/web dev
```

Open `http://localhost:5173` in your browser.

---

## 3. Running Automated Test Suites

To verify the complete full-stack implementation:

```bash
# Run all 37 Vitest unit and integration tests (Auth, Sessions, Directory, Big Data Lab)
pnpm --filter @vynk/api test

# Run the 58-student directory dry-run
pnpm --filter @vynk/api exec tsx ../../scripts/seed-classroom-directory.ts --dry-run

# Run fullstack database verification
pnpm --filter @vynk/api exec tsx ../../scripts/verify-fullstack-db.ts

# Run PySpark data platform tests (17 tests)
pytest data-platform/tests/test_data_platform.py

# Run Parquet 100K-row Data Quality validation
python data-platform/quality/validate.py

# Build frontend production bundle
pnpm --filter @vynk/web build
```

---

## 4. Demonstrating the Six Big Data Syllabus Concepts

Navigate to `http://localhost:5173/bigdata-lab` in the browser or use the API directly:

1. **Service Health Probe**: Click **"Probe Services"** to see live status of HDFS, MapReduce, MongoDB, Pig, Hive, and PostgreSQL.
2. **Concept 1 (HDFS Web Ingest/Export)**: Select Concept 1, click **"Run Job"** to ingest web JSON into HDFS and export lossless data packages.
3. **Concept 2 (SQL ↔ HDFS)**: Run SQL extraction and staging reconciliation.
4. **Concept 3 (Parallel MapReduce)**:
   - **Job A**: Student Skill Frequency Aggregation.
   - **Job B**: Project Activity Volume & XP Aggregation.
   - **Job C**: Unstructured Text Corpus Term Frequency.
5. **Concept 4 (MongoDB NoSQL)**: Run document bulk ingestion and multi-stage aggregation pipelines.
6. **Concept 5 (Apache Pig)**: Run Pig Latin ETL scripts with data quality splitting.
7. **Concept 6 (Apache Hive)**: Run metastore table creation (00, 01, 02) and analytical queries (03, 04, 05, 06).
8. **Job History**: Inspect live console logs, input/output row counts, and execution metrics in the **"Job History"** tab.

---

## 5. Demonstrating Classroom Directory & Profile Claiming

1. Navigate to `http://localhost:5173/directory`.
2. Search for any student from the 58-student cohort (e.g., `Aarav Patel` or `Asmitha S`).
3. Click **"Claim This Profile"** on an unclaimed card.
4. Enter the matching student ID (e.g., `STU-2026-001`).
5. Upon successful verification, the card immediately updates to **"Claimed"**, links to the student profile, and displays the student's avatar.
