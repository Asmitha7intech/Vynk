# VYNK Deterministic Synthetic Data Generator

This guide explains how to generate, scale, and utilize deterministic synthetic datasets for VYNK Big Data performance testing and syllabus demonstrations.

---

## 1. Core Principles & Guarantees

1. **100% Deterministic Reproducibility:**
   Uses a seeded pseudo-random generator (LCG). Generating with seed `42` will always yield identical UUIDs, timestamps, activity sequences, and text corpora on any machine or operating system.

2. **Strict Namespace & Storage Isolation:**
   All synthetic entities use isolated namespaces:
   - Namespace tag: `synthetic-v1`
   - Student IDs: `syn-stu-XXXXXX`
   - Project IDs: `syn-prj-XXXXXX`
   - Event IDs: `syn-evt-XXXXXX`
   - Data Directory: `data/synthetic/`

3. **Zero Contamination of Production Data:**
   Synthetic records are never merged into `vynk_db.json` or the production classroom directory. Real student profiles, XP leaderboards, daily streak metrics, and activity feeds remain completely uncontaminated.

---

## 2. CLI Usage & Commands

Run via the API package runner:

### Generate Standard Datasets
```bash
# Small scale (500 events, 25 projects, 50 students)
pnpm --filter @vynk/api exec tsx ../../scripts/generate-synthetic-data.ts --scale small

# Medium scale (2,500 events, 125 projects, 250 students)
pnpm --filter @vynk/api exec tsx ../../scripts/generate-synthetic-data.ts --scale medium

# Large scale (10,000 events, 500 projects, 1,000 students)
pnpm --filter @vynk/api exec tsx ../../scripts/generate-synthetic-data.ts --scale large

# Custom count (e.g., 50,000 events)
pnpm --filter @vynk/api exec tsx ../../scripts/generate-synthetic-data.ts --scale 50000
```

### Specifying a Custom Seed
```bash
# Custom seed for unique variations
pnpm --filter @vynk/api exec tsx ../../scripts/generate-synthetic-data.ts --scale medium --seed 1337
```

### Dry Run (Preview without writing to disk)
```bash
pnpm --filter @vynk/api exec tsx ../../scripts/generate-synthetic-data.ts --scale small --dry-run
```

### Clean / Purge Synthetic Data
```bash
pnpm --filter @vynk/api exec tsx ../../scripts/generate-synthetic-data.ts --clean
```

---

## 3. Generated Dataset Schemas

When executed, the generator outputs structured files to `data/synthetic/`:

| File | Description | Typical Record Count (Medium) |
| :--- | :--- | :--- |
| `synthetic_projects.json` | Collaborative project voyages with tech stacks, stages, and goals | 125 |
| `synthetic_students.json` | Student profiles with department affiliations, skills, and roles | 250 |
| `synthetic_events.json` | Activity log events (`VOYAGE_JOINED`, `TASK_COMPLETED`, etc.) | 2,500 |
| `synthetic_corpus.txt` | Unstructured multi-paragraph project pitches for MapReduce text mining | 100 docs |
| `data_quality_edge_cases.json` | Deliberately malformed records for Pig/Hive cleaning tests | 5 cases |
| `manifest.json` | Metadata manifest with generation timestamp, seed, checksums, and counts | 1 |

### Sample Manifest (`data/synthetic/manifest.json`)
```json
{
  "version": "1.0.0",
  "generatedAt": "2026-10-14T09:23:41.282Z",
  "seed": 42,
  "scale": "medium",
  "namespace": "synthetic-v1",
  "recordCounts": {
    "projects": 125,
    "students": 250,
    "activityEvents": 2500,
    "corpusDocuments": 100,
    "qualityEdgeCases": 5
  },
  "fileHashes": {
    "projects": "9d48b79b2923...",
    "events": "6a908f515cd..."
  }
}
```

---

## 4. Integration with Big Data Jobs

The synthetic datasets can be fed directly into MapReduce, Pig Latin, and Hive pipelines to benchmark distributed processing throughput:

- **MapReduce Skill Frequency:** Evaluates skills extracted from `synthetic_students.json`.
- **MapReduce Text Tokenization:** Streams `synthetic_corpus.txt` through `mapper_text.py`.
- **Pig Latin Data Quality Checks:** Verifies filtering of `data_quality_edge_cases.json` into quarantine.
- **Hive DW Partitions:** Ingests partitioned year/month segments from `synthetic_events.json`.
