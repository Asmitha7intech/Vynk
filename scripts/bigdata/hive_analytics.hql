-- VYNK Big Data Platform — Apache Hive Analytics Pipeline
-- Analyzes student activity, cross-department collaboration, and skill demand

CREATE DATABASE IF NOT EXISTS vynk_analytics;
USE vynk_analytics;

-- 1. Create External Raw Telemetry Table backed by HDFS
CREATE EXTERNAL TABLE IF NOT EXISTS student_activity_events (
    event_id STRING,
    user_id STRING,
    institution_id STRING,
    event_type STRING,
    source_dept STRING,
    target_dept STRING,
    event_timestamp STRING,
    xp_earned INT
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ','
STORED AS TEXTFILE
LOCATION '/vynk/raw/events/';

-- 2. Create Partitioned Analytical Table (ORC format for fast columnar scanning)
CREATE TABLE IF NOT EXISTS fact_student_events (
    event_id STRING,
    user_id STRING,
    event_type STRING,
    target_dept STRING,
    event_timestamp TIMESTAMP,
    xp_earned INT
)
PARTITIONED BY (institution_id STRING, source_dept STRING)
STORED AS ORC;

-- 3. Query: Top Cross-Department Collaboration Pairs
-- Identifies which departments frequently collaborate on Crews and Projects
SELECT 
    source_dept,
    target_dept,
    COUNT(*) as total_collaborations,
    SUM(xp_earned) as total_xp_generated
FROM student_activity_events
WHERE source_dept != target_dept 
  AND event_type IN ('CREW_APPLICATION', 'CREW_AGREEMENT_SIGNED', 'CROSS_DEPT_DISCOVERY_CLICK')
GROUP BY source_dept, target_dept
ORDER BY total_collaborations DESC
LIMIT 25;

-- 4. Query: Skill Growth Heatmap by Department
SELECT 
    source_dept,
    COUNT(DISTINCT user_id) as active_builders,
    SUM(xp_earned) as aggregate_xp,
    ROUND(SUM(xp_earned) / COUNT(DISTINCT user_id), 2) as avg_xp_per_student
FROM student_activity_events
GROUP BY source_dept
ORDER BY avg_xp_per_student DESC;
