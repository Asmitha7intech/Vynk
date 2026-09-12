# VYNK — Big Data & Campus Intelligence Architecture

> **Platform Tagline**: *"Find your people. Learn. Build. Rise."*  
> **Document Version**: 1.0.0 — Production Analytics & Big Data Specification  

---

## 1. System Overview & Clean Separation of Concerns

VYNK distinguishes between the **Transactional Core** (real-time student interactions, mutual Vynks, Crew assembly, and messaging) and the **Analytical Big Data Layer** (campus-wide skill heatmaps, cross-department collaboration metrics, retention cohorts, and learning analytics).

```
             VYNK WEB CLIENT
                   │
             VYNK API (Fastify)
                   │
      ┌────────────┴────────────┐
      ▼                         ▼
PostgreSQL 16 (pgvector)      Redis 7
Transactional Source of Truth  Real-time Cache / Presence / Queues
      │
      ▼ Event Telemetry
Data Ingestion Worker
      │
      ▼
   MongoDB
Event & Activity Document Store
      │
      ▼
    HDFS
Distributed Data Lake
      │
 ┌────┼──────────────┐
 ▼    ▼              ▼
Hive  Pig ETL   MapReduce / Spark
 └────┬──────────────┘
      ▼
Campus Intelligence API
(/api/v1/analytics/bigdata/*)
 ┌────────────────────────────────────────┐
 │ • Campus Skill Heatmap                 │
 │ • Department Collaboration Matrix      │
 │ • Skill Demand vs Supply Gap Analysis  │
 │ • Quest Difficulty Curve Analytics     │
 │ • D1/D7/D30 Student Retention Funnel   │
 └────────────────────────────────────────┘
```

---

## 2. Operational vs Analytical Stores

| Layer | Technology | Role & Purpose in VYNK |
| :--- | :--- | :--- |
| **Operational RDBMS** | **PostgreSQL 16** | Strict transactional integrity for Users, Institutions, Departments, Vynks, Crews, Voyages, and Quests. |
| **High-Speed State** | **Redis 7** | Socket.IO presence, rate limiting, and BullMQ worker queue state. |
| **Document Telemetry** | **MongoDB** | Semi-structured activity events, recommendation metadata snapshots, and audit streams. |
| **Data Lake Storage** | **HDFS** | Partitioned historical event datasets (`/events/year=2026/month=09/dept=CSE/`). |
| **Analytical Querying**| **Apache Hive** | Structured SQL querying across massive historical event logs. |
| **Distributed ETL**    | **Apache Pig** | Batch cleaning and institutional deduplication scripts. |
| **Batch Aggregation**  | **MapReduce / Spark** | Heavy aggregations (Leaderboard history, Department collaboration networks). |

---

## 3. Implemented Big Data Intelligence Features

1. **Campus Skill Heatmap (`/api/v1/analytics/bigdata/campus-heatmap`)**:
   - Calculates density vs scarcity of engineering, design, and hardware skills per academic department.
2. **Department Collaboration Matrix (`/api/v1/analytics/bigdata/dept-collaboration`)**:
   - Tracks cross-department synergy (e.g. *ECE <-> CSE*, *AI/DS <-> Design*, *Cybersecurity <-> Systems*).
3. **Skill Demand vs Supply Gap Analysis (`/api/v1/analytics/bigdata/skill-demand`)**:
   - Identifies high-demand roles that currently lack sufficient builders on campus, guiding university workshop creators.

---

## 4. Big Data Processing Jobs

### Job 1: Student Cumulative Growth & XP Aggregation
- **Map**: `(studentId, timestamp) -> (studentId, xpAwarded)`
- **Reduce**: `(studentId, sum(xpAwarded)) -> updated leaderboards`

### Job 2: Cross-Department Collaboration Frequency
- **Map**: `(crewId, memberDepartments) -> (deptPair, 1)`
- **Reduce**: `(deptPair, sum(1)) -> cross-department affinity score`
