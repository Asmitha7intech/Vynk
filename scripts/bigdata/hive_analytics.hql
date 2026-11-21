-- ============================================================
-- VYNK Big Data Platform — Apache Hive Analytics Pipeline v2
-- Updated to query the Medallion Data Lake partitioned structure
-- Lake Path: /data/lake/{zone}/year=YYYY/month=MM/day=DD/hour=HH/events.jsonl
-- ============================================================

CREATE DATABASE IF NOT EXISTS vynk_analytics;
USE vynk_analytics;

-- ============================================================
-- EXTERNAL TABLE: BRONZE Zone (Schema-Validated JSON Events)
-- ============================================================
CREATE EXTERNAL TABLE IF NOT EXISTS bronze_events (
    event_id        STRING,
    event_type      STRING,
    timestamp       STRING,
    correlation_id  STRING,
    version         INT,
    data_source     STRING,  -- 'PROD' | 'SYNTHETIC'
    user_id         STRING,
    college         STRING,
    department      STRING,
    payload         STRING   -- JSON blob
)
PARTITIONED BY (_year INT, _month INT, _day INT, _hour INT)
ROW FORMAT SERDE 'org.apache.hive.hcatalog.data.JsonSerDe'
STORED AS TEXTFILE
LOCATION '/data/lake/bronze/'
TBLPROPERTIES ('skip.header.line.count'='0');

-- Repair partitions to auto-discover new data
MSCK REPAIR TABLE bronze_events;

-- ============================================================
-- EXTERNAL TABLE: SILVER Zone (Deduplicated, Enriched Events)
-- ============================================================
CREATE EXTERNAL TABLE IF NOT EXISTS silver_events (
    event_id                STRING,
    event_type              STRING,
    timestamp               STRING,
    data_source             STRING,
    user_id                 STRING,
    college                 STRING,
    department              STRING,
    _department_normalized  STRING,
    _college_normalized     STRING,
    payload                 STRING
)
PARTITIONED BY (_year INT, _month INT, _day INT, _hour INT)
ROW FORMAT SERDE 'org.apache.hive.hcatalog.data.JsonSerDe'
STORED AS TEXTFILE
LOCATION '/data/lake/silver/'
TBLPROPERTIES ('skip.header.line.count'='0');

MSCK REPAIR TABLE silver_events;

-- ============================================================
-- GOLD TABLE: User Engagement Summary
-- ============================================================
CREATE TABLE IF NOT EXISTS gold_user_engagement
STORED AS ORC
AS
SELECT
    user_id,
    college,
    _department_normalized AS department,
    COUNT(*) AS total_events,
    SUM(CASE WHEN event_type = 'POST_CREATED' THEN 1 ELSE 0 END) AS posts_created,
    SUM(CASE WHEN event_type = 'DAILY_CHALLENGE_ATTEMPTED' THEN 1 ELSE 0 END) AS quest_attempts,
    SUM(CASE WHEN event_type = 'QUIZ_COMPLETED' THEN 1 ELSE 0 END) AS quizzes_completed,
    SUM(CASE WHEN event_type = 'VOYAGE_CREATED' THEN 1 ELSE 0 END) AS voyages_created,
    SUM(CASE WHEN event_type = 'CREW_MEMBER_JOINED' THEN 1 ELSE 0 END) AS crews_joined,
    SUM(CASE WHEN event_type = 'XP_EARNED' THEN 1 ELSE 0 END) AS xp_events,
    data_source
FROM silver_events
WHERE data_source = 'PROD'  -- Exclude SYNTHETIC data from production reports
GROUP BY user_id, college, _department_normalized, data_source;

-- ============================================================
-- GOLD TABLE: Cross-Department Collaboration Matrix
-- ============================================================
CREATE TABLE IF NOT EXISTS gold_dept_collaboration
STORED AS ORC
AS
SELECT
    a._department_normalized AS source_dept,
    b._department_normalized AS target_dept,
    COUNT(*) AS collaboration_events
FROM silver_events a
JOIN silver_events b
    ON a.user_id != b.user_id
    AND a.event_type IN ('CREW_CREATED', 'CREW_MEMBER_JOINED')
    AND b.event_type IN ('CREW_CREATED', 'CREW_MEMBER_JOINED')
    AND ABS(
        UNIX_TIMESTAMP(a.timestamp) - UNIX_TIMESTAMP(b.timestamp)
    ) < 3600  -- Within the same hour
WHERE a._department_normalized != b._department_normalized
    AND a.data_source = 'PROD'
GROUP BY a._department_normalized, b._department_normalized
ORDER BY collaboration_events DESC;

-- ============================================================
-- GOLD TABLE: Skill Trend Analysis (over time windows)
-- ============================================================
CREATE TABLE IF NOT EXISTS gold_skill_trends
STORED AS ORC
AS
SELECT
    get_json_object(payload, '$.skillName') AS skill_name,
    get_json_object(payload, '$.category') AS category,
    _department_normalized AS department,
    _year AS year,
    _month AS month,
    COUNT(*) AS occurrences
FROM silver_events
WHERE event_type IN ('SKILL_ADDED', 'SKILL_VERIFIED')
    AND data_source = 'PROD'
    AND get_json_object(payload, '$.skillName') IS NOT NULL
GROUP BY
    get_json_object(payload, '$.skillName'),
    get_json_object(payload, '$.category'),
    _department_normalized,
    _year,
    _month
ORDER BY occurrences DESC;

-- ============================================================
-- GOLD VIEW: Real-time Campus Intelligence Dashboard
-- ============================================================
CREATE VIEW IF NOT EXISTS campus_intelligence AS
SELECT
    college,
    _department_normalized AS department,
    COUNT(DISTINCT user_id) AS active_users,
    SUM(CASE WHEN event_type = 'POST_CREATED' THEN 1 ELSE 0 END) AS content_created,
    SUM(CASE WHEN event_type IN ('DAILY_CHALLENGE_ATTEMPTED', 'QUIZ_COMPLETED') THEN 1 ELSE 0 END) AS learning_events,
    SUM(CASE WHEN event_type IN ('CREW_CREATED', 'CREW_MEMBER_JOINED') THEN 1 ELSE 0 END) AS collaboration_events,
    SUM(CASE WHEN event_type = 'VOYAGE_CREATED' THEN 1 ELSE 0 END) AS projects_launched,
    MAX(timestamp) AS last_activity
FROM silver_events
WHERE data_source = 'PROD'
GROUP BY college, _department_normalized
ORDER BY active_users DESC;
