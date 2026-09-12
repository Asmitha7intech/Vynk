-- VYNK Big Data Platform — Apache Pig Latin ETL Pipeline
-- Ingests raw campus telemetry, cleans dirty records, and outputs aggregated synergy matrices

-- Load raw CSV stream from HDFS
raw_events = LOAD '/vynk/raw/events/vynk_events_*.csv' USING PigStorage(',') AS (
    event_id:chararray,
    user_id:chararray,
    institution_id:chararray,
    event_type:chararray,
    source_dept:chararray,
    target_dept:chararray,
    timestamp:chararray,
    xp_earned:int
);

-- Filter valid non-header events
valid_events = FILTER raw_events BY event_id != 'event_id' AND user_id IS NOT NULL;

-- Filter for cross-department crew synergy interactions
cross_dept_events = FILTER valid_events BY source_dept != target_dept;

-- Group by Department Pairs
dept_groups = GROUP cross_dept_events BY (institution_id, source_dept, target_dept);

-- Calculate Aggregated Metrics
synergy_summary = FOREACH dept_groups GENERATE
    group.institution_id AS institution_id,
    group.source_dept AS source_dept,
    group.target_dept AS target_dept,
    COUNT(cross_dept_events) AS interaction_count,
    SUM(cross_dept_events.xp_earned) AS total_xp;

-- Store to HDFS processed directory for Hive ingestion & Dashboard caching
STORE synergy_summary INTO '/vynk/processed/department_synergy/' USING PigStorage(',');
