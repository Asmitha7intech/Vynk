# VYNK Pulse — Pipeline Operations Runbook

## Overview

This runbook describes how to operate, monitor, and troubleshoot the VYNK Pulse Big Data Engineering Pipeline across synthetic generation, Kafka streaming, PySpark batch ETL, DuckDB OLAP, and Airflow orchestration.

---

## 1. Quick Start Commands

### Prerequisites
- Node.js 22+ with `pnpm`
- Python 3.14+ with `duckdb`, `pyarrow`, `pandas`, `pyspark`
- Java 17+ (Temurin OpenJDK)
- Docker 29+ (optional for Kafka container)

### Standard Daily Workflow
```bash
# 1. Generate 100K synthetic events with relational integrity
python data-engine/generate.py --rows 100000 --students 5000

# 2. Execute Data Quality suite (10 assertions)
python data-platform/quality/validate.py data-engine/output/parquet/activity_events --output-dir data/benchmark-results/dq_reports

# 3. Run PySpark Bronze -> Silver ETL (deduplication + typing + DQ flags)
python data-platform/batch/bronze_to_silver.py

# 4. Run PySpark Silver -> Gold Aggregations (5 OLAP tables)
python data-platform/batch/silver_to_gold.py

# 5. Refresh DuckDB analytical summary cache for API
python data-engine/analytics.py
```

---

## 2. Kafka Ingestion Cluster (Docker KRaft)

### Start Cluster
```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```
- Kafka Broker: `localhost:9092`
- Kafka UI Web Console: `http://localhost:8080`

### Provisioned Topics
- `vynk.student-activity` (4 partitions, Snappy compression)
- `vynk.project-activity` (2 partitions)
- `vynk.profile-events` (2 partitions)
- `vynk.pipeline-errors` (Dead Letter Queue, 1 partition, log compaction)

### Stream Events to Kafka
```bash
python data-platform/producer/kafka_producer.py --rows 10000 --batch-size 500
```

---

## 3. PySpark Structured Streaming

The stream processor operates in dual modes:
- **File Mode (Micro-batch on Parquet):** Runs standalone without requiring a Kafka broker.
- **Kafka Mode:** Connects to `localhost:9092` topic `vynk.student-activity`.

```bash
# Run file-based streaming with 5-minute tumbling window and 10-minute watermark
python data-platform/streaming/stream_processor.py --mode file --duration 60
```

---

## 4. Airflow Orchestration DAG

The DAG `vynk_pulse_daily_pipeline` runs daily at `02:00 UTC`:
- **Task 1 (`generate_synthetic_data`):** Produces 100K events.
- **Task 2 (`data_quality_validation`):** Asserts 10 rules. Fails pipeline if DQ score < 100%.
- **Task 3 (`bronze_to_silver_etl`):** Cleans and deduplicates records.
- **Task 4 (`silver_to_gold_aggregations`):** Computes OLAP aggregates.
- **Task 5 (`update_pulse_api_cache`):** Generates `pulse_summary.json` for Fastify.

### Standalone Runner (No Airflow Daemon Needed)
```bash
python infrastructure/airflow/dags/vynk_pulse_dag.py
```

---

## 5. Troubleshooting & Health Checks

| Symptom | Diagnostic Step | Resolution |
|---|---|---|
| Fastify `/pulse/summary` returns fallback | Check if `data-engine/output/pulse_summary.json` exists | Run `python data-engine/analytics.py` |
| PySpark Out of Memory | Spark executor memory default is 2g | Adjust `--driver-memory 4g` in `bronze_to_silver.py` |
| Kafka broker refused connection | `docker ps -a` check if `vynk-kafka` is healthy | Run `docker compose -f infrastructure/docker/docker-compose.yml restart` |
| DQ validation fails on row count | Confirm generator reached `--rows 1000` minimum | Re-run `generate.py` with default `--rows 100000` |
