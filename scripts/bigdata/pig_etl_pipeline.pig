-- ============================================================
-- VYNK Big Data Platform — Apache Pig Latin ETL Pipeline v2
-- Processes Medallion BRONZE events → SILVER (clean, deduplicated)
-- and generates cross-department synergy matrices
-- ============================================================

-- ============================================================
-- STEP 1: Load BRONZE zone events (partitioned JSONL)
-- ============================================================
-- Note: JsonLoader requires the elephant-bird or piggybank UDF in production.
-- In development, the Node.js spark-runner.js handles this step natively.

raw_bronze = LOAD '/data/lake/bronze/*/*/*/*/events.jsonl'
    USING JsonLoader('event_id:chararray, event_type:chararray, timestamp:chararray,
                       correlation_id:chararray, version:int, data_source:chararray,
                       user_id:chararray, college:chararray, department:chararray,
                       _year:int, _month:int, _day:int, _hour:int');

-- ============================================================
-- STEP 2: Filter — Only PROD data, no nulls, no SYNTHETIC
-- ============================================================
prod_events = FILTER raw_bronze BY
    data_source == 'PROD'
    AND user_id IS NOT NULL
    AND event_type IS NOT NULL
    AND event_id IS NOT NULL;

-- ============================================================
-- STEP 3: Deduplicate by event_id (take first occurrence)
-- ============================================================
grouped_by_id = GROUP prod_events BY event_id;
deduped_events = FOREACH grouped_by_id GENERATE
    FLATTEN(TOP(1, 0, prod_events));

-- ============================================================
-- STEP 4: Normalize department names (uppercase, no spaces)
-- ============================================================
normalized_events = FOREACH deduped_events GENERATE
    event_id,
    event_type,
    timestamp,
    data_source,
    user_id,
    college,
    department,
    UPPER(REPLACE(department, ' ', '_')) AS dept_normalized,
    UPPER(REPLACE(college, ' ', '_')) AS college_normalized,
    _year,
    _month,
    _day,
    _hour;

-- Store to SILVER zone
STORE normalized_events INTO '/data/lake/silver/pig_processed/'
    USING JsonStorage();

-- ============================================================
-- STEP 5: Cross-Department Interaction Matrix
-- ============================================================
crew_events = FILTER normalized_events BY
    event_type == 'CREW_MEMBER_JOINED' OR event_type == 'CREW_CREATED';

-- Self-join to find cross-department crews
-- (Two users in the same crew but different departments = cross-dept collaboration)
crew_a = FOREACH crew_events GENERATE user_id AS user_a, dept_normalized AS dept_a, timestamp AS ts_a;
crew_b = FOREACH crew_events GENERATE user_id AS user_b, dept_normalized AS dept_b, timestamp AS ts_b;

cross_dept_pairs = JOIN crew_a BY dept_a, crew_b BY dept_b;
cross_dept_filter = FILTER cross_dept_pairs BY crew_a::dept_a != crew_b::dept_b;

cross_dept_grouped = GROUP cross_dept_filter BY (crew_a::dept_a, crew_b::dept_b);
synergy_matrix = FOREACH cross_dept_grouped GENERATE
    FLATTEN(group) AS (source_dept, target_dept),
    COUNT(cross_dept_filter) AS interaction_count;

-- Store the cross-dept synergy matrix
STORE synergy_matrix INTO '/data/lake/gold/pig_dept_synergy/'
    USING PigStorage(',');

-- ============================================================
-- STEP 6: Quest Completion Funnel Analysis
-- ============================================================
quest_events = FILTER normalized_events BY
    event_type == 'DAILY_CHALLENGE_ATTEMPTED' OR event_type == 'QUIZ_COMPLETED';

quest_by_dept = GROUP quest_events BY (dept_normalized, event_type, _year, _month, _day);
quest_summary = FOREACH quest_by_dept GENERATE
    FLATTEN(group) AS (department, event_type, year, month, day),
    COUNT(quest_events) AS completions;

STORE quest_summary INTO '/data/lake/gold/pig_quest_funnel/'
    USING PigStorage(',');

-- ============================================================
-- STEP 7: XP Distribution Heatmap per Department per Day
-- ============================================================
xp_events = FILTER normalized_events BY event_type == 'XP_EARNED';

xp_by_dept_day = GROUP xp_events BY (dept_normalized, _year, _month, _day);
xp_summary = FOREACH xp_by_dept_day GENERATE
    FLATTEN(group) AS (department, year, month, day),
    COUNT(xp_events) AS xp_event_count;

STORE xp_summary INTO '/data/lake/gold/pig_xp_heatmap/'
    USING PigStorage(',');
