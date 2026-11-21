# VYNK Pulse — Event Schemas & Data Contracts (v1)

## Overview

All telemetry and stream records in VYNK follow strict JSON Schema Draft 2020-12 specifications. Schemas enforce semantic typing, physical constraints, enum restrictions, and privacy compliance (zero real student PII).

---

## 1. `student.activity.v1`

**Topic:** `vynk.student-activity`  
**JSON Schema Path:** `data-platform/schemas/student_activity_v1.json`  

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://vynk.dev/schemas/student.activity.v1",
  "title": "VYNK Student Activity Event",
  "version": "1.0.0",
  "type": "object",
  "required": [
    "event_id", "student_id", "department", "event_type",
    "timestamp", "year_month", "date", "hour",
    "latency_ms", "is_anomaly", "anomaly_type", "is_synthetic"
  ],
  "properties": {
    "event_id": { "type": "string", "pattern": "^ev-[0-9]{8}$" },
    "student_id": { "type": "string", "pattern": "^std-[0-9]{6}$" },
    "department": {
      "type": "string",
      "enum": [
        "Computer Science",
        "AI & Data Science",
        "Computer & Communication Engineering",
        "Information Security",
        "Design & HCI",
        "Electrical & Electronics",
        "Mechanical Engineering",
        "Biomedical Informatics"
      ]
    },
    "event_type": {
      "type": "string",
      "enum": [
        "user_login", "post_view", "post_reaction", "comment_create",
        "connection_request_sent", "connection_request_accepted",
        "crew_invitation_sent", "crew_agreement_signed",
        "quest_completed", "voyage_milestone_published",
        "code_snippet_shared", "mentor_session_booked"
      ]
    },
    "timestamp": { "type": "string", "format": "date-time" },
    "year_month": { "type": "string", "pattern": "^[0-9]{4}-[0-9]{2}$" },
    "date": { "type": "string", "format": "date" },
    "hour": { "type": "integer", "minimum": 0, "maximum": 23 },
    "project_id": { "type": ["string", "null"], "pattern": "^proj-[0-9]{5}$" },
    "latency_ms": { "type": "number", "minimum": 0 },
    "is_anomaly": { "type": "boolean" },
    "anomaly_type": {
      "type": "string",
      "enum": ["NORMAL", "LATENCY_SPIKE", "UNUSUAL_BURST", "OFF_HOURS_SURGE"]
    },
    "is_synthetic": { "type": "boolean", "const": true }
  },
  "additionalProperties": false
}
```

---

## 2. `project.activity.v1`

**Topic:** `vynk.project-activity`  
**JSON Schema Path:** `data-platform/schemas/project_activity_v1.json`  

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://vynk.dev/schemas/project.activity.v1",
  "title": "VYNK Project Activity Event",
  "version": "1.0.0",
  "type": "object",
  "required": [
    "event_id", "project_id", "creator_student_id",
    "category", "status", "stars_count", "created_at", "is_synthetic"
  ],
  "properties": {
    "event_id": { "type": "string", "pattern": "^proj-evt-[0-9]{8}$" },
    "project_id": { "type": "string", "pattern": "^proj-[0-9]{5}$" },
    "creator_student_id": { "type": "string", "pattern": "^std-[0-9]{6}$" },
    "category": {
      "type": "string",
      "enum": [
        "Autonomous Robotics", "Generative AI & Agents",
        "Distributed Campus Ledger", "Open Source Developer Tools",
        "Student Mental Wellness", "Renewable Energy Analytics",
        "Collaborative Real-time Canvas"
      ]
    },
    "status": { "type": "string", "enum": ["PLANNING", "IN_PROGRESS", "SHOWCASED", "COMPLETED"] },
    "stars_count": { "type": "integer", "minimum": 0 },
    "created_at": { "type": "string", "format": "date-time" },
    "is_synthetic": { "type": "boolean", "const": true }
  },
  "additionalProperties": false
}
```

---

## 3. `pipeline.errors.v1` (Dead Letter Queue)

**Topic:** `vynk.pipeline-errors`  
**JSON Schema Path:** `data-platform/schemas/pipeline_errors_v1.json`  

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://vynk.dev/schemas/pipeline.errors.v1",
  "title": "VYNK Pipeline Error Event",
  "version": "1.0.0",
  "type": "object",
  "required": [
    "error_id", "source_topic", "error_code", "error_message",
    "raw_payload", "occurred_at", "retry_count"
  ],
  "properties": {
    "error_id": { "type": "string" },
    "source_topic": {
      "type": "string",
      "enum": ["vynk.student-activity", "vynk.project-activity", "vynk.profile-events"]
    },
    "error_code": {
      "type": "string",
      "enum": [
        "SCHEMA_VALIDATION_FAILED", "MISSING_REQUIRED_FIELD",
        "TYPE_MISMATCH", "DUPLICATE_EVENT_ID",
        "DESERIALIZATION_ERROR", "DOWNSTREAM_WRITE_FAILED"
      ]
    },
    "error_message": { "type": "string" },
    "raw_payload": { "type": "string" },
    "occurred_at": { "type": "string", "format": "date-time" },
    "retry_count": { "type": "integer", "minimum": 0, "maximum": 3 },
    "is_dead_letter": { "type": "boolean" }
  },
  "additionalProperties": false
}
```
