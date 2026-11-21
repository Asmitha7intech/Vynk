import path from 'path';
import { bigDataRunnerService } from '../../apps/api/src/services/bigdata-runner.service';

async function main() {
  const args = process.argv.slice(2);
  const isAll = args.includes('--all');
  const conceptIdx = args.indexOf('--concept');
  const conceptNum = conceptIdx !== -1 ? args[conceptIdx + 1] : null;

  console.log('====================================================');
  console.log(' VYNK Big Data Syllabus CLI Runner');
  console.log('====================================================\n');

  // Probe services first
  console.log('[1/2] Probing Infrastructure Services:');
  const health = await bigDataRunnerService.getHealthStatus();
  for (const h of health) {
    const statusColor = h.status === 'ONLINE' ? 'ONLINE' : 'LOCAL FALLBACK';
    console.log(` - ${h.displayName}: [${statusColor}] -> ${h.message}`);
  }
  console.log('\n[2/2] Executing Syllabus Concept Demonstrations:\n');

  const jobsToRun: Array<{ conceptId: any; jobId: string; label: string }> = [];

  if (isAll || conceptNum === '1') {
    jobsToRun.push(
      { conceptId: 'concept-1', jobId: 'c1_import_web_json', label: 'Concept 1A: Web Unstructured JSON Ingest to HDFS' },
      { conceptId: 'concept-1', jobId: 'c1_export_hdfs_json', label: 'Concept 1B: Lossless HDFS Data Export' }
    );
  }
  if (isAll || conceptNum === '2') {
    jobsToRun.push(
      { conceptId: 'concept-2', jobId: 'c2_sql_to_hdfs', label: 'Concept 2A: SQL Roster Extraction to HDFS' },
      { conceptId: 'concept-2', jobId: 'c2_hdfs_to_sql', label: 'Concept 2B: HDFS Staging & Reconciliation' }
    );
  }
  if (isAll || conceptNum === '3') {
    jobsToRun.push(
      { conceptId: 'concept-3', jobId: 'c3_mr_skill_frequency', label: 'Concept 3A: MapReduce Skill Frequency' },
      { conceptId: 'concept-3', jobId: 'c3_mr_project_activity', label: 'Concept 3B: MapReduce Project Activity Aggregation' },
      { conceptId: 'concept-3', jobId: 'c3_mr_text_analysis', label: 'Concept 3C: MapReduce Text Corpus Tokenization' }
    );
  }
  if (isAll || conceptNum === '4') {
    jobsToRun.push(
      { conceptId: 'concept-4', jobId: 'c4_mongo_bulk_ingest', label: 'Concept 4A: MongoDB Ingestion & Unique Index Check' },
      { conceptId: 'concept-4', jobId: 'c4_mongo_agg_event_types', label: 'Concept 4B: MongoDB Multi-Stage Aggregation Pipeline' },
      { conceptId: 'concept-4', jobId: 'c4_mongo_agg_categories', label: 'Concept 4C: MongoDB Category Engagement Matrix' }
    );
  }
  if (isAll || conceptNum === '5') {
    jobsToRun.push(
      { conceptId: 'concept-5', jobId: 'c5_pig_skill_analysis', label: 'Concept 5A: Apache Pig skill_analysis.pig' },
      { conceptId: 'concept-5', jobId: 'c5_pig_data_quality', label: 'Concept 5B: Apache Pig data_quality_checks.pig' }
    );
  }
  if (isAll || conceptNum === '6') {
    jobsToRun.push(
      { conceptId: 'concept-6', jobId: 'c6_hive_create_metastore', label: 'Concept 6A: Apache Hive Metastore DDL (00, 01, 02)' },
      { conceptId: 'concept-6', jobId: 'c6_hive_skill_analytics', label: 'Concept 6B: Apache Hive Analytical Query (03_skill_analytics)' },
      { conceptId: 'concept-6', jobId: 'c6_hive_activity_analytics', label: 'Concept 6C: Apache Hive Multi-Table Join Query (05)' }
    );
  }

  if (jobsToRun.length === 0) {
    console.log('Usage:');
    console.log('  pnpm --filter @vynk/api exec tsx ../../scripts/bigdata/run-syllabus-job.ts --all');
    console.log('  pnpm --filter @vynk/api exec tsx ../../scripts/bigdata/run-syllabus-job.ts --concept <1-6>');
    return;
  }

  for (const item of jobsToRun) {
    console.log(`>>> Running ${item.label}...`);
    const res = await bigDataRunnerService.runJob(item.conceptId, item.jobId, 'Academic Fixture');
    console.log(`    Status:      ${res.status}`);
    console.log(`    Mode:        ${res.executionMode}`);
    console.log(`    Duration:    ${res.durationMs}ms`);
    console.log(`    Input Rows:  ${res.inputRowCount}`);
    console.log(`    Output Rows: ${res.outputRowCount}`);
    if (res.outputPreview) {
      const previewStr = Array.isArray(res.outputPreview)
        ? `Array(${res.outputPreview.length} items)`
        : JSON.stringify(res.outputPreview);
      console.log(`    Preview:     ${previewStr.slice(0, 80)}...`);
    }
    console.log('');
  }

  console.log('----------------------------------------------------');
  console.log('All requested syllabus jobs executed successfully.');
  console.log('----------------------------------------------------');
}

main().catch(err => {
  console.error('[Error] CLI runner failed:', err);
  process.exit(1);
});
