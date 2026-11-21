# VYNK 4.0 — Big Data Architecture Document
# Full system audit, tech stack, pipeline design, and implementation status

# VYNK Pulse — Big Data Architecture & System Audit

## 1. Project Overview

**VYNK** (Find your people. Learn. Build. Rise.) is a full-stack student collaboration platform with an integrated Big Data analytics subsystem called **VYNK Pulse — Student Ecosystem Intelligence**.

The system has two tightly coupled parts:
1. **Student-facing web app** — React + Vite + TypeScript frontend, Fastify 5 backend, LocalStoreEngine JSON persistence
2. **VYNK Pulse Data Platform** — End-to-end Big Data pipeline: generation → ingestion → ETL → analytics → API → dashboard

---

## 2. Repository Structure

```
vynk/
├── apps/
│   ├── api/                    # Fastify 5 backend (TypeScript)
│   └── web/                    # React + Vite frontend (TypeScript)
├── packages/
│   ├── database/               # Prisma schema + LocalStoreEngine
│   ├── types/                  # Shared TypeScript types
│   ├── validation/             # Zod schemas
│   └── config/                 # Shared config
├── data-engine/                # Python synthetic data engine (Phase 3)
│   ├── config.py
│   ├── generate.py             # 100K events, 57K rows/sec
│   ├── analytics.py            # DuckDB OLAP queries
│   ├── anomaly_detection.py    # MAD Z-score, F1=0.898
│   ├── output/                 # Parquet, DuckDB, pulse_summary.json
│   └── tests/                  # 5/5 passing
├── data-platform/              # Phase 4 Big Data Platform
│   ├── schemas/                # JSON Schema v1 event contracts
│   ├── quality/                # Data quality framework (10 checks)
│   ├── producer/               # Enhanced producer + Kafka producer
│   ├── batch/                  # PySpark Bronze→Silver, Silver→Gold
│   ├── streaming/              # PySpark Structured Streaming
│   └── tests/                  # 17/17 passing
├── infrastructure/
│   ├── docker/                 # Kafka KRaft docker-compose
│   └── airflow/dags/           # Airflow DAG (daily pipeline)
├── data/
│   ├── lake/                   # Bronze/Silver/Gold lake layers
│   └── benchmark-results/      # Verified benchmark results
└── docs/                       # ADRs, architecture docs, reports
```

---

## 3. Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.8 | UI framework |
| Vite | 6.4.3 | Build tool + dev server |
| TypeScript | 5.9.3 | Type safety |
| Tailwind CSS | 3.4.19 | Utility-first styling |
| Framer Motion | (installed) | Animations |
| Zustand | 5.0.15 | State management |
| Lucide React | (installed) | Icon library |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Fastify | 5.x | HTTP framework |
| TypeScript | 5.9.3 | Type safety |
| Socket.IO | (installed) | Real-time events |
| LocalStoreEngine | custom | JSON persistence (dev) |
| Prisma | (schema only) | ORM (production path) |

### Data Platform
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.14.7 | Data engineering language |
| PySpark | 4.2.0 | Distributed batch + streaming ETL |
| DuckDB | 1.5.6 | OLAP analytics engine |
| Apache Parquet | (via PyArrow 26) | Columnar storage format |
| PyArrow | 26.0.0 | Parquet I/O |
| Pandas | (installed) | DataFrame processing |
| NumPy | (installed) | Numerical generation |
| Faker | 40.43.0 | Synthetic profile data |

### Infrastructure
| Technology | Version | Purpose |
|---|---|---|
| Docker | 29.7.2 | Container runtime |
| Kafka (Confluent) | 7.6.1 | Event streaming (KRaft mode) |
| Java | OpenJDK 17.0.20 | Spark/Kafka JVM |
| Airflow | (3.0+) | Pipeline orchestration |
| Turborepo | 2.10.11 | Monorepo build orchestration |
| pnpm | (installed) | Package manager |

---

## 4. Big Data Pipeline Architecture

```
[VYNK Web App] → [Activity Events] → [Fastify API]
                                            │
                                    [Outbox Worker]
                                            │
                              ┌─────────────┼──────────────┐
                              │             │              │
                    [data/lake/raw]   [Kafka Topic]  [Direct Parquet]
                    (JSONL partitioned) (vynk.student-activity)
                              │
                    [Bronze Layer]
                    data-engine/output/parquet/activity_events/
                    Snappy-compressed Parquet, 100K events
                              │
                    [PySpark Bronze→Silver ETL]
                    - Deduplication (event_id)
                    - Type casting & timestamp parsing
                    - Data Quality flags (4 checks per row)
                    - Output: data/lake/silver/activity_events/
                              │
                    [PySpark Silver→Gold Aggregations]
                    - dept_activity_summary
                    - hourly_engagement_heatmap
                    - anomaly_summary
                    - top_active_students
                    - daily_event_volume
                    Output: data/lake/gold/
                              │
                    [DuckDB Analytics]
                    - 121K rows/sec OLAP throughput
                    - Anomaly detection (MAD Z-score, F1=0.898)
                    - Generates pulse_summary.json
                              │
                    [Fastify /api/v1/pulse/*]
                    8 endpoints serving Gold analytics
                              │
                    [React PulsePage]
                    KPI cards, SVG charts, anomaly explorer
```

---

## 5. Ten Big Data Concepts — Implementation Status

| # | Concept | Implementation | Status |
|---|---|---|---|
| 1 | **Synthetic Data Generation** | `data-engine/generate.py` — 57K rows/sec, 100K events, 5K students, relational integrity | ✅ VERIFIED |
| 2 | **Event Schemas & Contracts** | `data-platform/schemas/` — JSON Schema v1 for student_activity, project_activity, pipeline_errors | ✅ COMPLETE |
| 3 | **Kafka Event Ingestion** | `infrastructure/docker/docker-compose.yml` (KRaft), `data-platform/producer/kafka_producer.py` | ✅ READY (Docker 29.7.2 available) |
| 4 | **Spark Batch ETL** | `data-platform/batch/bronze_to_silver.py`, `silver_to_gold.py` — PySpark 4.2.0 | ✅ COMPLETE |
| 5 | **Spark Structured Streaming** | `data-platform/streaming/stream_processor.py` — file mode + Kafka mode, windowed aggs, watermarks | ✅ COMPLETE |
| 6 | **DuckDB OLAP Analytics** | `data-engine/analytics.py` — 121K rows/sec, 5 query types, pulse_summary.json | ✅ VERIFIED |
| 7 | **Data Quality Framework** | `data-platform/quality/validate.py` — 10 checks, 100K real dataset scored 10/10 | ✅ VERIFIED |
| 8 | **Anomaly Detection** | `data-engine/anomaly_detection.py` — MAD Z-score, threshold=6.0, F1=0.898 | ✅ VERIFIED |
| 9 | **Airflow Orchestration** | `infrastructure/airflow/dags/vynk_pulse_dag.py` — daily DAG with DuckDB fallbacks | ✅ COMPLETE |
| 10 | **Performance Benchmarking** | `data-platform/batch/benchmark.py` — 100K/500K/1M scales | ✅ VERIFIED |

---

## 6. Verified Benchmark Results

Run timestamp: 2026-10-13T15:11:41Z

| Scale | Generation | Parquet Write | Parquet Read | DuckDB (4 queries) |
|---|---|---|---|---|
| 100K events | 321,896 rows/sec | 666,412 rows/sec | 138,132 rows/sec | 0.084s |
| 500K events | 319,569 rows/sec | 968,447 rows/sec | 4,242,948 rows/sec | 0.125s |
| 1M events | 293,869 rows/sec | 970,385 rows/sec | 4,363,651 rows/sec | 0.303s |

**Key takeaways:**
- Generation scales linearly at ~300K rows/sec
- Parquet write peaks at ~970K rows/sec at 500K+ scale
- Read throughput jumps 30× from 100K to 500K (OS disk cache saturation)
- DuckDB handles 1M events in 0.303s for 4 OLAP queries (dept×type, heatmap, anomaly, top students)

---

## 7. Data Quality Results

Real dataset: 100,000 events from `data-engine/output/parquet/activity_events/`

| Check | Result | Value |
|---|---|---|
| minimum_row_count | PASS | 100,000 ≥ 1,000 |
| required_fields_present | PASS | 13/12 fields (all required present) |
| null_rate_required_fields | PASS | 0.000% nulls |
| event_type_enum_valid | PASS | 0 invalid values |
| department_enum_valid | PASS | 0 invalid values |
| latency_ms_range_valid | PASS | neg=0, extreme=0 |
| duplicate_event_id_rate | PASS | 0.0000% (0 dups) |
| anomaly_flag_consistency | PASS | 0 mismatches |
| is_synthetic_always_true | PASS | 0 non-synthetic rows |
| hour_range_0_to_23 | PASS | 0 bad values |

**Quality Score: 10/10 = 100%**

---

## 8. Kafka Topics

| Topic | Partitions | Retention | Purpose |
|---|---|---|---|
| `vynk.student-activity` | 4 | 7 days | Primary activity event stream |
| `vynk.project-activity` | 2 | 7 days | Project lifecycle events |
| `vynk.profile-events` | 2 | 7 days | Profile update events |
| `vynk.pipeline-errors` | 1 | 30 days | Dead Letter Queue (DLQ) |

---

## 9. Test Results Summary

| Test Suite | Tests | Status |
|---|---|---|
| `data-engine/tests/test_data_engine.py` | 5/5 | ✅ ALL PASS |
| `data-platform/tests/test_data_platform.py` | 17/17 | ✅ ALL PASS |
| `pnpm typecheck` (full monorepo) | 6/6 packages | ✅ ALL PASS |
| `pnpm test` (Vitest) | 10/10 | ✅ ALL PASS |
| `pnpm verify` (integration) | 22/22 | ✅ ALL PASS |
| `pnpm build` | 2/2 tasks | ✅ SUCCESS |
| **Data Quality (real dataset)** | 10/10 checks | ✅ ALL PASS |

**Total: 72/72 tests and checks passing**

---

## 10. API Endpoints

### Application API (`/api/v1/`)
- `POST /auth/register` — User registration
- `POST /auth/login` — JWT login
- `GET /users` — User discovery / network
- `GET /users/:id/profile` — Profile view
- `GET /posts` — Feed posts
- `POST /posts` — Create post
- `GET /connections` — Connection list
- `POST /connections/request` — Send connection request
- `GET /projects` — Projects list
- `POST /projects` — Create project
- `GET /notifications` — User notifications
- `GET /crews` — Crew/team list
- `POST /crews` — Create crew

### VYNK Pulse API (`/api/v1/pulse/`)
- `GET /health` — Pipeline health status
- `GET /summary` — KPI dashboard metrics
- `GET /timeseries` — 30-day activity timeseries
- `GET /top-skills` — Skill demand rankings
- `GET /connections` — Network graph metrics
- `GET /anomalies` — Anomaly event list
- `GET /events` — Paginated event explorer
- `GET /export.csv` — Full dataset CSV export

---

## 11. Running the System

### Quick Start
```bash
# 1. Install dependencies
pnpm install

# 2. Start backend + frontend (two terminals)
pnpm --filter @vynk/api dev    # http://localhost:3001
pnpm --filter @vynk/web dev    # http://localhost:5173

# 3. Generate analytics data
cd data-engine
python analytics.py
```

### Data Platform
```bash
# Generate 100K events
python data-engine/generate.py --rows 100000 --students 5000

# Run DQ validation
python data-platform/quality/validate.py data-engine/output/parquet/activity_events

# Run PySpark Bronze→Silver
python data-platform/batch/bronze_to_silver.py

# Run PySpark Silver→Gold
python data-platform/batch/silver_to_gold.py

# Run benchmarks
python data-platform/batch/benchmark.py --scales 100000 500000 1000000

# Start Kafka (Docker required)
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

### Run All Tests
```bash
# Node.js tests
pnpm typecheck && pnpm test && pnpm verify && pnpm build

# Python tests
python data-engine/tests/test_data_engine.py
python data-platform/tests/test_data_platform.py
python data-platform/quality/validate.py data-engine/output/parquet/activity_events
```
