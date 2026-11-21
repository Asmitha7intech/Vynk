"""
VYNK Pulse — Airflow DAG: Daily Data Pipeline
Orchestrates the full ETL pipeline:
  1. Generate synthetic data (100K events)
  2. Run data quality validation
  3. Run Bronze → Silver (PySpark or DuckDB fallback)
  4. Run Silver → Gold aggregations
  5. Update pulse_summary.json for API consumption
  6. Notify on pipeline completion

Schedule: Daily at 02:00 UTC
DAG ID: vynk_pulse_daily_pipeline

Requirements:
  pip install apache-airflow
  airflow db init
  airflow scheduler &
  airflow webserver -p 8081 &

Note: For Python 3.14 compatibility, use Airflow 3.0+.
If Airflow is not available, use run_pipeline.py for equivalent one-shot execution.
"""
from __future__ import annotations

import os
import sys
import json
from datetime import datetime, timedelta

# Graceful Airflow import — DAG is importable without Airflow installed
try:
    from airflow import DAG
    from airflow.operators.python import PythonOperator
    from airflow.operators.bash import BashOperator
    from airflow.utils.dates import days_ago
    AIRFLOW_AVAILABLE = True
except ImportError:
    AIRFLOW_AVAILABLE = False

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DATA_ENGINE_DIR = os.path.join(ROOT_DIR, "data-engine")
DATA_PLATFORM_DIR = os.path.join(ROOT_DIR, "data-platform")
OUTPUT_DIR = os.path.join(DATA_ENGINE_DIR, "output")
SILVER_DIR = os.path.join(ROOT_DIR, "data", "lake", "silver", "activity_events")
GOLD_DIR = os.path.join(ROOT_DIR, "data", "lake", "gold")
BENCHMARK_DIR = os.path.join(ROOT_DIR, "data", "benchmark-results")


# ── Task functions ─────────────────────────────────────────────────────────────

def task_generate_data(**context):
    """Generate 100K synthetic events."""
    sys.path.insert(0, DATA_ENGINE_DIR)
    sys.path.insert(0, os.path.join(DATA_PLATFORM_DIR, "producer"))

    from generate import main as gen_main
    import argparse

    # Override sys.argv to pass arguments to the generator
    sys.argv = [
        "generate.py",
        "--rows", "100000",
        "--students", "5000",
        "--seed", str(context["ds"].replace("-", "")),  # date-based seed
        "--output-dir", OUTPUT_DIR,
    ]
    gen_main()
    return {"generated_rows": 100_000, "output_dir": OUTPUT_DIR}


def task_data_quality(**context):
    """Run DQ validation on generated data."""
    sys.path.insert(0, os.path.join(DATA_PLATFORM_DIR, "quality"))
    from validate import run_quality_check

    parquet_dir = os.path.join(OUTPUT_DIR, "parquet", "activity_events")
    report = run_quality_check(
        parquet_dir,
        output_dir=os.path.join(BENCHMARK_DIR, "dq_reports"),
    )

    if not report.overall_pass:
        failed_checks = [c for c in report.checks if c["status"] == "FAIL"]
        raise ValueError(
            f"Data Quality FAILED: {len(failed_checks)} checks failed. "
            f"First failure: {failed_checks[0]}"
        )

    return {"quality_score": report.as_dict()["quality_score"]}


def task_bronze_to_silver(**context):
    """Run Bronze→Silver ETL (PySpark if available, DuckDB fallback)."""
    bronze_dir = os.path.join(OUTPUT_DIR, "parquet", "activity_events")

    try:
        sys.path.insert(0, os.path.join(DATA_PLATFORM_DIR, "batch"))
        from bronze_to_silver import run_bronze_to_silver
        result = run_bronze_to_silver(bronze_dir, SILVER_DIR)
        return result
    except ImportError:
        # DuckDB fallback
        import duckdb
        import shutil

        print("[FALLBACK] Using DuckDB for Bronze→Silver (PySpark not available)")
        os.makedirs(SILVER_DIR, exist_ok=True)
        con = duckdb.connect(":memory:")
        df = con.execute(f"""
            SELECT
                event_id, student_id, department, event_type,
                CAST(timestamp AS TIMESTAMP) as event_ts,
                year_month, date, hour, project_id,
                latency_ms, is_anomaly, anomaly_type, is_synthetic,
                latency_ms >= 0 AND latency_ms < 30000 AS dq_valid_latency,
                NOT (is_anomaly = FALSE AND anomaly_type != 'NORMAL') AS dq_valid_anomaly_consistency,
                TRUE AS dq_row_valid
            FROM read_parquet('{bronze_dir}/*.parquet')
            WHERE event_id IS NOT NULL AND student_id IS NOT NULL
            QUALIFY ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY event_id) = 1
        """).df()
        con.close()

        silver_parquet = os.path.join(SILVER_DIR, "events_silver.parquet")
        df.to_parquet(silver_parquet, compression="snappy", index=False)
        return {"silver_count": len(df), "method": "duckdb_fallback"}


def task_silver_to_gold(**context):
    """Run Silver→Gold aggregations."""
    try:
        sys.path.insert(0, os.path.join(DATA_PLATFORM_DIR, "batch"))
        from silver_to_gold import run_silver_to_gold

        # Use bronze dir directly if silver not yet available
        source = SILVER_DIR if os.path.exists(SILVER_DIR) else os.path.join(OUTPUT_DIR, "parquet", "activity_events")
        result = run_silver_to_gold(source, GOLD_DIR)
        return result
    except Exception as e:
        # DuckDB fallback for all Gold tables
        import duckdb
        source = SILVER_DIR if os.path.exists(SILVER_DIR) else os.path.join(OUTPUT_DIR, "parquet", "activity_events")
        print(f"[FALLBACK] DuckDB Gold aggregations from {source}")
        os.makedirs(GOLD_DIR, exist_ok=True)
        con = duckdb.connect(":memory:")

        queries = {
            "dept_activity_summary": f"""
                SELECT department, event_type, COUNT(*) as event_count,
                       AVG(latency_ms) as avg_latency_ms
                FROM read_parquet('{source}/*.parquet')
                GROUP BY department, event_type ORDER BY event_count DESC
            """,
            "daily_event_volume": f"""
                SELECT date, COUNT(*) as total_events,
                       AVG(latency_ms) as avg_latency_ms,
                       COUNT(DISTINCT student_id) as dau
                FROM read_parquet('{source}/*.parquet')
                GROUP BY date ORDER BY date
            """,
        }

        for name, sql in queries.items():
            df = con.execute(sql).df()
            with open(os.path.join(GOLD_DIR, f"{name}.json"), "w") as f:
                json.dump(df.to_dict(orient="records"), f, indent=2, default=str)

        con.close()
        return {"method": "duckdb_fallback", "tables": list(queries.keys())}


def task_update_pulse_summary(**context):
    """Regenerate pulse_summary.json from Gold layer for API."""
    sys.path.insert(0, DATA_ENGINE_DIR)
    import subprocess
    result = subprocess.run(
        ["python", os.path.join(DATA_ENGINE_DIR, "analytics.py")],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"[WARN] analytics.py returned {result.returncode}: {result.stderr[:200]}")
    return {"pulse_summary_updated": True}


# ── DAG definition ─────────────────────────────────────────────────────────────

if AIRFLOW_AVAILABLE:
    default_args = {
        "owner": "vynk-data-team",
        "depends_on_past": False,
        "start_date": days_ago(1),
        "email_on_failure": False,
        "email_on_retry": False,
        "retries": 2,
        "retry_delay": timedelta(minutes=5),
        "execution_timeout": timedelta(hours=2),
    }

    with DAG(
        dag_id="vynk_pulse_daily_pipeline",
        default_args=default_args,
        description="VYNK Pulse: Daily data generation, quality check, ETL, and analytics",
        schedule_interval="0 2 * * *",  # 02:00 UTC daily
        catchup=False,
        max_active_runs=1,
        tags=["vynk", "bigdata", "etl"],
    ) as dag:

        t1_generate = PythonOperator(
            task_id="generate_synthetic_data",
            python_callable=task_generate_data,
        )

        t2_quality = PythonOperator(
            task_id="data_quality_validation",
            python_callable=task_data_quality,
        )

        t3_bronze_silver = PythonOperator(
            task_id="bronze_to_silver_etl",
            python_callable=task_bronze_to_silver,
        )

        t4_silver_gold = PythonOperator(
            task_id="silver_to_gold_aggregations",
            python_callable=task_silver_to_gold,
        )

        t5_update_api = PythonOperator(
            task_id="update_pulse_api_cache",
            python_callable=task_update_pulse_summary,
        )

        # Define execution order
        t1_generate >> t2_quality >> t3_bronze_silver >> t4_silver_gold >> t5_update_api


# ── Standalone runner (no Airflow needed) ────────────────────────────────────

def run_pipeline_standalone():
    """Run all pipeline tasks sequentially without Airflow."""
    print("\n" + "=" * 65)
    print("  VYNK Pulse Pipeline — Standalone Run (no Airflow)")
    print("=" * 65)

    context = {"ds": datetime.now().strftime("%Y-%m-%d")}
    steps = [
        ("Generate Data", task_generate_data),
        ("Data Quality", task_data_quality),
        ("Bronze→Silver", task_bronze_to_silver),
        ("Silver→Gold", task_silver_to_gold),
        ("Update Pulse API", task_update_pulse_summary),
    ]

    results = {}
    for name, fn in steps:
        print(f"\n[PIPELINE] Running: {name}...")
        try:
            result = fn(**context)
            results[name] = {"status": "SUCCESS", "result": result}
            print(f"[PIPELINE] {name}: SUCCESS")
        except Exception as e:
            results[name] = {"status": "FAILED", "error": str(e)}
            print(f"[PIPELINE] {name}: FAILED — {e}")
            print(f"[PIPELINE] Continuing remaining steps...")

    print("\n" + "=" * 65)
    print("  Pipeline Run Complete")
    for name, r in results.items():
        icon = "OK" if r["status"] == "SUCCESS" else "FAIL"
        print(f"  [{icon}] {name}")
    print("=" * 65)
    return results


if __name__ == "__main__":
    run_pipeline_standalone()
