# VYNK Pulse — Benchmark Methodology & Rig Specification

## 1. Objectives

The VYNK Pulse performance benchmark suite measures empirical throughput and latency of data ingestion, columnar compression, disk reading, and in-memory analytical aggregation at 3 progressive scales:
- **100,000 events** (Baseline Campus Day)
- **500,000 events** (Multi-Campus Ecosystem)
- **1,000,000 events** (Production National Scale)

---

## 2. Measurement Rig

- **OS:** Windows 11 x64
- **Runtime:** Python 3.14.7, PySpark 4.2.0, DuckDB 1.5.6, PyArrow 26.0.0
- **Storage:** Local SSD (NTFS), Snappy compression
- **Clock Source:** Python `time.perf_counter()` (high-resolution monotonic hardware clock)

---

## 3. Operations Under Test

### Operation 1: Vectorized Synthetic Generation
- Pre-allocates random NumPy vectors for student IDs, departments, event types, timestamps, and latencies.
- Injects 1.2% synthetic anomaly rate with Pareto/exponential distribution.
- Metric: Rows per second (`total_rows / elapsed_seconds`).

### Operation 2: Columnar Snappy Parquet Serialization
- Converts DataFrame to Apache Arrow RecordBatches.
- Compresses with Snappy algorithm.
- Measures I/O write rate, resulting file size, and compression ratio against in-memory footprint.

### Operation 3: Parquet Deserialization
- Reads back the written Parquet file using `pd.read_parquet()` (PyArrow engine).
- Evaluates OS page caching and vectorized column projection.

### Operation 4: DuckDB Multi-Aggregation OLAP Suite
Executes 4 complex analytical queries in sequence on an in-memory database:
1. `dept_activity_count`: Multi-column `GROUP BY department, event_type` with sorting.
2. `hourly_heatmap`: 24-hour diurnal matrix `GROUP BY hour, department`.
3. `anomaly_rate`: Statistical filter `WHERE is_anomaly = TRUE` and latency aggregations.
4. `top_students`: Top 100 ranking with `LIMIT 100` and `ORDER BY event_count DESC`.

---

## 4. How to Reproduce

Execute the standalone benchmark runner:
```bash
python data-platform/batch/benchmark.py --scales 100000 500000 1000000
```
Machine-readable outputs are written to `data/benchmark-results/BENCHMARK_RESULTS.json`.
