# VYNK Big Data & Campus Intelligence Architecture

## 1. Vision & Pipeline

VYNK is designed to analyze campus-wide builder dynamics, team formation friction, and skill gaps across multi-department university campuses.

### Pipeline Flow:
1. **Telemetry Capture**: Student interactions (profile views, project stars, squad applications, cross-department clicks) are emitted as structured telemetry.
2. **Buffer & Store**: Events stream into MongoDB and batch-export to HDFS in partitioned CSV/ORC format.
3. **ETL & Processing**: Apache Pig cleans dirty records and aggregates departmental synergy metrics.
4. **Analytical SQL**: Apache Hive executes OLAP queries on top of HDFS tables to generate campus heatmaps and skill demand matrices.
5. **Consumption**: Aggregated metrics are served via `/api/v1/analytics/bigdata/*` to the web dashboard.

## 2. Running Big Data Scripts

```bash
# 1. Generate 10,000 synthetic campus activity events
npm run generate:bigdata

# 2. View generated datasets
cat data/vynk_events_10k.csv | head -n 10

# 3. Execute Hive queries (in Hive CLI or Beeline)
hive -f scripts/bigdata/hive_analytics.hql

# 4. Execute Pig ETL pipeline
pig -x local scripts/bigdata/pig_etl_pipeline.pig
```
