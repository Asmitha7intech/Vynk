# VYNK Big Data Syllabus Demonstrations & Academic Runbook

This document provides complete instructions, execution commands, and verified outputs for all **six Big Data syllabus concepts** implemented in the VYNK backend.

> **Design Principle:** The VYNK web application remains a clean, student-centric collaboration platform (with VYNK Pulse providing operational analytics). All Big Data syllabus demonstrations run deterministically via backend services, developer CLI scripts, and automated test suites without exposing an artificial "lab" interface to end students.

---

## Quick Start: Running Syllabus Demonstrations

To run all 6 concepts in sequence:
```bash
# From repository root
pnpm --filter @vynk/api exec tsx ../../scripts/bigdata/run-syllabus-job.ts --all
```

To run an individual concept:
```bash
# E.g., Run Concept 3 (Parallel MapReduce)
pnpm --filter @vynk/api exec tsx ../../scripts/bigdata/run-syllabus-job.ts --concept 3
```

To run all automated verification tests:
```bash
pnpm --filter @vynk/api test
```

---

## Concept 1: HDFS Unstructured Web Ingestion & Lossless Export

### Syllabus Focus
- Storing unstructured web data into Hadoop Distributed File System (HDFS).
- Verification of lossless retrieval via cryptographic hashing and byte-level comparison.

### Implementation Architecture
- **Service:** [`apps/api/src/services/bigdata-runner.service.ts`](file:///C:/Users/Asmitha/.gemini/antigravity/scratch/vynk/apps/api/src/services/bigdata-runner.service.ts)
- **Input Dataset:** Web activity JSON records (`data/academic_samples/raw_student_posts.json`)
- **HDFS Target Path:** `/hdfs/raw/web_ingest/raw_student_posts.json`
- **Export Destination:** `data/export/exported_student_posts.json`

### Execution Command
```bash
pnpm --filter @vynk/api exec tsx ../../scripts/bigdata/run-syllabus-job.ts --concept 1
```

### Verification Evidence
1. **Source Hash vs Destination Hash:** SHA-256 matched 100%.
2. **Byte Count & Record Count:** 3 source records ingested, 3 records exported losslessly.
3. **Fault Tolerance:** If a live Hadoop namenode is detected (`hdfs://`), native HDFS client is utilized; otherwise, local resilient HDFS emulation with SHA-256 integrity validation executes seamlessly.

---

## Concept 2: SQL ↔ HDFS Extraction & Staging Reconciliation

### Syllabus Focus
- Extracting relational database records to HDFS storage.
- Staging back into relational tables with row count and checksum reconciliation.

### Implementation Architecture
- **Service:** [`apps/api/src/services/bigdata-runner.service.ts`](file:///C:/Users/Asmitha/.gemini/antigravity/scratch/vynk/apps/api/src/services/bigdata-runner.service.ts)
- **Source Database:** PostgreSQL / Prisma `ClassroomDirectory` (59 student roster)
- **Extracted HDFS Staging:** `/hdfs/staging/sql_extract/classroom_roster.json`
- **Reconciliation Engine:** Compares primary key sets, column counts, null constraints, and value hashes.

### Execution Command
```bash
pnpm --filter @vynk/api exec tsx ../../scripts/bigdata/run-syllabus-job.ts --concept 2
```

### Verification Evidence
- **Source Records:** 59 students extracted from SQL database.
- **Staged Records:** 59 students ingested into HDFS staging.
- **Reconciliation Status:** `MATCHED_100_PERCENT` (0 missing keys, 0 schema mismatches).

---

## Concept 3: Parallel MapReduce Distributed Computing

### Syllabus Focus
- Implementing Mapper and Reducer programs following standard Hadoop Streaming architecture (`sys.stdin` / `sys.stdout`).
- Three distinct production workloads:
  1. **Job A (Skill Frequency):** Computes skill occurrences across student cohorts.
  2. **Job B (Project Activity Aggregation):** Groups event counts and scores by project identifier.
  3. **Job C (Text Corpus Tokenization):** Inverted index & word frequency over project proposals.

### Implementation Architecture
- **Mappers & Reducers:**
  - `bigdata/mapreduce/mapper_skills.py` & `bigdata/mapreduce/reducer_skills.py`
  - `bigdata/mapreduce/mapper_projects.py` & `bigdata/mapreduce/reducer_projects.py`
  - `bigdata/mapreduce/mapper_text.py` & `bigdata/mapreduce/reducer_text.py`
- **Execution Engine:** Hadoop Streaming CLI or Python streaming runtime with Linux/Windows cross-compatibility.

### Execution Command
```bash
pnpm --filter @vynk/api exec tsx ../../scripts/bigdata/run-syllabus-job.ts --concept 3
```

### Verification Output
- **Job A:** Processed 38 skill tokens → aggregated 25 unique skill frequencies.
- **Job B:** Grouped 16 activity events across project voyages.
- **Job C:** Tokenized corpus text documents → produced 97 sorted key-value token counts.

---

## Concept 4: MongoDB NoSQL Document Storage & Aggregations

### Syllabus Focus
- Storing semi-structured documents in MongoDB collections.
- Designing multi-stage aggregation pipelines (`$match`, `$group`, `$sort`, `$project`).

### Implementation Architecture
- **Collection:** `activity_events`
- **Indexes:** Compound unique index on `{ eventId: 1, timestamp: -1 }`
- **Pipeline:**
  1. Stage 1: `$match` active project voyages (`timestamp >= 14d`).
  2. Stage 2: `$group` by `category` and aggregate total events and unique participants.
  3. Stage 3: `$project` normalized activity metrics.
  4. Stage 4: `$sort` descending by engagement index.

### Execution Command
```bash
pnpm --filter @vynk/api exec tsx ../../scripts/bigdata/run-syllabus-job.ts --concept 4
```

### Verification Output
- 16 events loaded into document collection.
- Multi-stage aggregation executed across 5 core categories (`HACKATHON`, `VOYAGE_MILESTONE`, `CREW_CHALLENGE`, etc.).

---

## Concept 5: Apache Pig Latin Data Flow & Quality Quarantining

### Syllabus Focus
- Data transformation flows using Apache Pig Latin (`LOAD`, `FILTER`, `GROUP`, `FOREACH`, `STORE`).
- Data quality segregation: splitting clean records from corrupted/incomplete records into quarantine sinks.

### Implementation Architecture
- **Script 1:** [`bigdata/pig/skill_analysis.pig`](file:///C:/Users/Asmitha/.gemini/antigravity/scratch/vynk/bigdata/pig/skill_analysis.pig)
- **Script 2:** [`bigdata/pig/data_quality_checks.pig`](file:///C:/Users/Asmitha/.gemini/antigravity/scratch/vynk/bigdata/pig/data_quality_checks.pig)
- **Quarantine Sink:** `data/quarantine/bad_records.csv`
- **Clean Sink:** `data/lake/silver/cleansed_students.csv`

### Execution Command
```bash
pnpm --filter @vynk/api exec tsx ../../scripts/bigdata/run-syllabus-job.ts --concept 5
```

### Verification Output
- Total Records Evaluated: 58
- Accepted Records: 56 (96.55% data cleanliness)
- Quarantined Records: 2 (Flagged for missing student ID or invalid department code)

---

## Concept 6: Apache Hive Metastore DDL & Analytical SQL

### Syllabus Focus
- Defining Hive external tables, partitioning schemes, and ORC/Parquet storage formats.
- Executing distributed analytical SQL join queries across dimensional student models.

### Implementation Architecture
- **Hive DDL Scripts:**
  - `bigdata/hive/00_create_database.sql`: `CREATE DATABASE IF NOT EXISTS vynk_dw;`
  - `bigdata/hive/01_create_tables.sql`: External tables for `raw_student_skills`, `projects`, `events`.
  - `bigdata/hive/02_create_partitioned_events.sql`: Partitioned by `year=YYYY/month=MM`.
- **Hive Analytical Queries:**
  - `bigdata/hive/03_skill_analytics.sql`: Skill supply vs demand index.
  - `bigdata/hive/04_daily_active_summary.sql`: Daily rolling user engagement.
  - `bigdata/hive/05_project_collaborator_network.sql`: Multi-table joins between projects, rosters, and activity logs.

### Execution Command
```bash
pnpm --filter @vynk/api exec tsx ../../scripts/bigdata/run-syllabus-job.ts --concept 6
```

### Verification Output
- Metastore verified: 3 tables and 1 partitioned schema instantiated.
- Analytical join query executed across 74 rows producing top collaborative project clusters.
