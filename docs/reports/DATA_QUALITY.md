# VYNK Pulse — Data Quality Framework & Validation Report

## 1. Overview

The VYNK Data Platform incorporates automated Data Quality (DQ) testing as a non-negotiable stage before data reaches downstream analytics or Silver/Gold lakehouse layers.

Every batch is subjected to 10 automated assertions covering schema adherence, null tolerances, domain enums, statistical ranges, entity duplication, and privacy requirements.

---

## 2. Real Dataset Validation Results

**Dataset Under Test:** `data-engine/output/parquet/activity_events` (100,000 records)  
**Execution Timestamp:** 2026-10-13T15:20:06Z  
**Result:** 10 / 10 CHECKS PASSED (Quality Score: 100.0%)  

| # | Check Name | Assertion | Observed Value | Threshold | Status |
|---|---|---|---|---|---|
| 1 | `minimum_row_count` | Volume check | 100,000 rows | ≥ 1,000 | PASS |
| 2 | `required_fields_present` | Schema completeness | 13 / 12 fields | All required | PASS |
| 3 | `null_rate_required_fields` | Null tolerance | 0.000% nulls | < 0.5% | PASS |
| 4 | `event_type_enum_valid` | Domain integrity | 0 invalid | 0 invalid | PASS |
| 5 | `department_enum_valid` | Campus taxonomy | 0 invalid | 0 invalid | PASS |
| 6 | `latency_ms_range_valid` | Physical bounds | neg=0, extreme=0 | neg=0, extreme<1% | PASS |
| 7 | `duplicate_event_id_rate` | Uniqueness | 0.0000% (0 dups) | < 0.1% | PASS |
| 8 | `anomaly_flag_consistency` | Logical consistency | 0 mismatches | 0 mismatches | PASS |
| 9 | `is_synthetic_always_true` | Privacy & compliance | 100% synthetic | 0 real PII | PASS |
| 10 | `hour_range_0_to_23` | Diurnal timeline | 0 bad values | 0 bad values | PASS |

---

## 3. Injected Error Testing (Fault Tolerance)

The validation framework was tested against intentionally corrupted batches in `data-platform/tests/test_data_platform.py`:
- Injected invalid event type (`INVALID_TYPE_XYZ`) → Immediately flagged by check #4.
- Injected negative latency (`-1.0ms`) → Immediately flagged by check #6.
- Injected duplicate UUIDs → Immediately flagged by check #7.
- Injected contradictory anomaly flag (`is_anomaly=False` with `anomaly_type=LATENCY_SPIKE`) → Immediately flagged by check #8.

In all cases, the pipeline raises an exception and halts execution before corrupted data can contaminate the Silver layer.
