# VYNK Pulse — Data Dictionary & Event Schemas

## Overview

This document defines every data contract, field, and event type used in the VYNK Pulse data platform. All data is **100% synthetic** — no real student PII is present.

---

## Event Schema Registry

### Schema Versioning
All schemas follow semantic versioning in the format `<entity>.<version>`.
Breaking changes increment the major version (v1 → v2).
Schemas are stored in `data-platform/schemas/`.

---

## 1. `student.activity.v1`

**File**: `data-platform/schemas/student_activity_v1.json`
**Topic**: `vynk.student-activity`
**Purpose**: Telemetry event from any student interaction with the VYNK platform.

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `event_id` | string | ✅ | Pattern: `ev-[0-9]{8}` | Globally unique event ID |
| `student_id` | string | ✅ | Pattern: `std-[0-9]{6}` | Synthetic student reference |
| `department` | string | ✅ | Enum (8 values) | Student's academic department |
| `event_type` | string | ✅ | Enum (12 values) | Type of activity performed |
| `timestamp` | string | ✅ | ISO 8601 date-time | UTC timestamp of event |
| `year_month` | string | ✅ | Pattern: `YYYY-MM` | Partition key |
| `date` | string | ✅ | Format: date | Day partition key |
| `hour` | integer | ✅ | 0–23 | UTC hour |
| `project_id` | string\|null | ❌ | Pattern: `proj-[0-9]{5}` | Optional project context |
| `latency_ms` | number | ✅ | ≥ 0 | Backend processing latency |
| `is_anomaly` | boolean | ✅ | — | Anomaly flag |
| `anomaly_type` | string | ✅ | Enum (4 values) | NORMAL or anomaly class |
| `is_synthetic` | boolean | ✅ | const: true | Always true — no real PII |

### Department Enum Values
- `Computer Science`
- `AI & Data Science`
- `Computer & Communication Engineering`
- `Information Security`
- `Design & HCI`
- `Electrical & Electronics`
- `Mechanical Engineering`
- `Biomedical Informatics`

### Event Type Enum Values
| Event Type | Frequency Weight | Description |
|---|---|---|
| `post_view` | 22% | Student viewed a post |
| `user_login` | 15% | User authenticated |
| `post_reaction` | 18% | Liked/reacted to post |
| `comment_create` | 10% | Created a comment |
| `quest_completed` | 6% | Completed a learning quest |
| `connection_request_sent` | 7% | Sent a connection request |
| `connection_request_accepted` | 5% | Accepted connection |
| `crew_invitation_sent` | 4% | Invited someone to crew |
| `crew_agreement_signed` | 3% | Signed crew agreement |
| `voyage_milestone_published` | 4% | Published project milestone |
| `code_snippet_shared` | 4% | Shared a code snippet |
| `mentor_session_booked` | 2% | Booked mentor session |

### Anomaly Type Enum Values
| Anomaly Type | Latency Range | Description |
|---|---|---|
| `NORMAL` | 12–200ms | No anomaly |
| `LATENCY_SPIKE` | 1200–5000ms | Unusually high latency |
| `UNUSUAL_BURST` | 1200–3000ms | High-frequency burst activity |
| `OFF_HOURS_SURGE` | 1200–4000ms | Activity surge during low-traffic hours |

---

## 2. `project.activity.v1`

**File**: `data-platform/schemas/project_activity_v1.json`
**Purpose**: Project lifecycle events (creation, status changes, collaborations).

| Field | Type | Required | Description |
|---|---|---|---|
| `event_id` | string | ✅ | Unique project event ID |
| `project_id` | string | ✅ | Project reference (`proj-XXXXX`) |
| `creator_student_id` | string | ✅ | Creator's student ID |
| `category` | string | ✅ | Project category enum |
| `status` | string | ✅ | `PLANNING`, `IN_PROGRESS`, `SHOWCASED`, `COMPLETED` |
| `stars_count` | integer | ✅ | Number of stars received |
| `created_at` | string | ✅ | ISO 8601 creation timestamp |
| `is_synthetic` | boolean | ✅ | Always true |

### Project Categories
- `Autonomous Robotics`
- `Generative AI & Agents`
- `Distributed Campus Ledger`
- `Open Source Developer Tools`
- `Student Mental Wellness`
- `Renewable Energy Analytics`
- `Collaborative Real-time Canvas`

---

## 3. `pipeline.errors.v1`

**File**: `data-platform/schemas/pipeline_errors_v1.json`
**Topic**: `vynk.pipeline-errors` (Dead Letter Queue)
**Purpose**: Pipeline error events for monitoring and debugging.

| Field | Type | Required | Description |
|---|---|---|---|
| `error_id` | string | ✅ | Unique error event ID |
| `source_topic` | string | ✅ | Origin topic that failed |
| `error_code` | string | ✅ | Error classification enum |
| `error_message` | string | ✅ | Human-readable error |
| `raw_payload` | string | ✅ | JSON-serialized original message |
| `occurred_at` | string | ✅ | ISO 8601 timestamp |
| `retry_count` | integer | ✅ | 0–3 retry attempts |
| `is_dead_letter` | boolean | ❌ | True if retries exhausted |

### Error Code Enum Values
- `SCHEMA_VALIDATION_FAILED`
- `MISSING_REQUIRED_FIELD`
- `TYPE_MISMATCH`
- `DUPLICATE_EVENT_ID`
- `DESERIALIZATION_ERROR`
- `DOWNSTREAM_WRITE_FAILED`

---

## 4. Student Profile Schema (Parquet)

**File**: `data-engine/output/parquet/students.parquet`
**Records**: 5,000 synthetic students

| Field | Type | Description |
|---|---|---|
| `student_id` | string | `std-XXXXXX` |
| `username` | string | Synthetic username |
| `display_name` | string | Faker-generated full name |
| `college` | string | One of 7 institutions |
| `department` | string | Academic department |
| `graduation_year` | int | 2026–2029 |
| `level` | int | 1–10 (power-law distribution) |
| `xp` | int | Experience points |
| `streak_days` | int | Consecutive active days |
| `activity_segment` | string | `CORE_BUILDER`, `CASUAL_LEARNER`, `HACKATHON_CAPTAIN`, `MENTOR` |
| `is_available_crews` | boolean | Open to crew invites (72%) |
| `is_available_mentorship` | boolean | Open to mentoring (28%) |
| `created_at` | string | Account creation timestamp |
| `is_synthetic` | boolean | Always true |

---

## 5. Gold Layer Tables

Produced by `data-platform/batch/silver_to_gold.py` using PySpark.

### `dept_activity_summary`
Groups events by department × event_type.
Fields: `department`, `event_type`, `event_count`, `avg_latency_ms`, `p95_latency_ms`, `anomaly_count`

### `hourly_engagement_heatmap`
24×8 matrix of event counts per hour per department.
Fields: `hour`, `department`, `event_count`, `unique_students`

### `anomaly_summary`
Aggregates by anomaly type.
Fields: `anomaly_type`, `count`, `avg_latency_ms`, `max_latency_ms`, `min_latency_ms`, `affected_students`

### `top_active_students`
Top 100 most active students.
Fields: `student_id`, `event_count`, `avg_latency_ms`, `anomaly_count`, `unique_event_types`

### `daily_event_volume`
Day-by-day event totals across the 42-day window.
Fields: `date`, `total_events`, `avg_latency_ms`, `dau`, `anomaly_count`
