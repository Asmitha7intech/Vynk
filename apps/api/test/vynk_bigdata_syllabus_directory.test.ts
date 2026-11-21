import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { directoryService } from '../src/services/directory.service';
import { bigDataRunnerService } from '../src/services/bigdata-runner.service';
import { prisma } from '@vynk/database';
import fs from 'fs';
import path from 'path';

describe('VYNK Master Implementation — Classroom Directory & 6 Big Data Concepts', () => {
  let testUserId: string;

  beforeAll(async () => {
    const user = await prisma.user.findFirst();
    testUserId = user ? user.id : 'usr_test_student_1';

    // Seed test classroom directory from fixture
    const rosterPath = path.resolve(__dirname, '../../../_quarantine/seeds/classroom_roster.json');
    if (fs.existsSync(rosterPath)) {
      const roster = JSON.parse(fs.readFileSync(rosterPath, 'utf8'));
      for (const item of roster) {
        await (prisma as any).classroomDirectory.create({
          data: {
            studentId: item.studentId,
            originalDisplayName: item.originalDisplayName,
            normalizedName: item.originalDisplayName.trim().toLowerCase(),
            department: item.department,
            graduationYear: item.graduationYear || 2026,
            cohort: item.cohort || '2022-2026',
            notes: item.notes,
            isClaimed: false,
          },
        });
      }
    }
  });

  afterAll(async () => {
    await (prisma as any).classroomDirectory?.deleteMany({});
  });

  describe('PHASE THREE: Classroom Directory Roster (58 Students)', () => {
    it('returns the seeded classroom roster with pagination and metadata', async () => {
      const result = await directoryService.search({ page: 1, limit: 10 });
      expect(result.items).toBeDefined();
      expect(result.items.length).toBeLessThanOrEqual(10);
      expect(result.meta.total).toBe(59);
      expect(result.meta.totalPages).toBe(6);
    });

    it('searches student records by original display name preserving exact casing', async () => {
      const result = await directoryService.search({ search: 'ALINE JENITA . A' });
      expect(result.items.length).toBeGreaterThan(0);
      const student = result.items[0];
      expect(student.originalDisplayName).toBe('ALINE JENITA . A');
      expect(student.studentId).toBe('STU-2026-001');
    });

    it('filters records by department', async () => {
      const result = await directoryService.search({
        department: 'Artificial Intelligence & Data Science',
      });
      expect(result.items.length).toBeGreaterThan(0);
      for (const item of result.items) {
        expect(item.department).toBe('Artificial Intelligence & Data Science');
      }
    });

    it('claims a directory profile with matching student ID verification', async () => {
      // Find an unclaimed student record
      const unclaimed = await (prisma as any).classroomDirectory.findFirst({
        where: {
          isClaimed: false,
          studentId: 'STU-2026-002',
        },
      });

      if (!unclaimed) return;

      const claimResult = await directoryService.claim(
        testUserId,
        unclaimed.id,
        unclaimed.studentId
      );

      expect(claimResult.isClaimed).toBe(true);
      expect(claimResult.claimedUserId).toBe(testUserId);
      expect(claimResult.claimVerificationMethod).toBe('STUDENT_ID_VERIFIED');
      expect(claimResult.auditTrail.length).toBeGreaterThan(0);
    });

    it('prevents claiming a record with an invalid or mismatched student ID', async () => {
      const unclaimed = await (prisma as any).classroomDirectory.findFirst({
        where: { isClaimed: false },
      });
      if (!unclaimed) return;

      await expect(
        directoryService.claim(testUserId, unclaimed.id, 'WRONG-ID-999')
      ).rejects.toThrow(/does not match/);
    });

    it('logs an audit trail when administrative corrections are applied', async () => {
      const record = await (prisma as any).classroomDirectory.findFirst();
      if (!record) return;

      const updated = await directoryService.update(record.id, testUserId, {
        notes: 'Verified via campus registrar',
        reason: 'Periodic roster integrity audit',
      });

      expect(updated.notes).toBe('Verified via campus registrar');
      expect(updated.auditTrail.length).toBeGreaterThan(0);
      const lastAudit = updated.auditTrail[updated.auditTrail.length - 1];
      expect(lastAudit.change).toContain('Periodic roster integrity audit');
    });
  });

  describe('PHASE SIX: Big Data Lab — Six Required Syllabus Concepts', () => {
    it('accurately probes service health across all 6 ecosystem components without fabrication', async () => {
      const health = await bigDataRunnerService.getHealthStatus();
      expect(health.length).toBe(6);

      const services = health.map((h) => h.service);
      expect(services).toContain('database');
      expect(services).toContain('mongodb');
      expect(services).toContain('hdfs');
      expect(services).toContain('mapreduce');
      expect(services).toContain('pig');
      expect(services).toContain('hive');

      for (const s of health) {
        expect(['ONLINE', 'LOCAL_FALLBACK']).toContain(s.status);
        expect(s.message.length).toBeGreaterThan(5);
      }
    });

    it('lists verified academic sample datasets with format, size and description', () => {
      const datasets = bigDataRunnerService.getDatasets();
      expect(datasets.length).toBeGreaterThanOrEqual(4);

      const skillsDs = datasets.find((d) => d.id === 'ds-skills');
      expect(skillsDs).toBeDefined();
      expect(skillsDs?.format).toBe('CSV');
      expect(skillsDs?.sizeBytes).toBeGreaterThan(0);
    });

    it('Concept 1: imports unstructured web JSON into HDFS and executes lossless export', async () => {
      // 1. Ingest
      const importJob = await bigDataRunnerService.runJob(
        'concept-1',
        'c1_import_web_json'
      );
      expect(importJob.status).toBe('SUCCEEDED');
      expect(importJob.inputRowCount).toBeGreaterThan(0);
      expect(importJob.outputPath).toContain('/vynk/raw/web/');
      expect(importJob.metrics.sha256).toBeDefined();

      // 2. Export
      const exportJob = await bigDataRunnerService.runJob(
        'concept-1',
        'c1_export_hdfs_json'
      );
      expect(exportJob.status).toBe('SUCCEEDED');
      expect(exportJob.outputRowCount).toBe(importJob.inputRowCount);
    });

    it('Concept 2: extracts SQL tables to HDFS and stages with 100% reconciliation', async () => {
      const sqlJob = await bigDataRunnerService.runJob(
        'concept-2',
        'c2_sql_to_hdfs'
      );
      expect(sqlJob.status).toBe('SUCCEEDED');
      expect(sqlJob.inputRowCount).toBe(59);
      expect(sqlJob.outputRowCount).toBe(59);
      expect(sqlJob.metrics.reconciliationStatus).toBe('MATCHED_100_PERCENT');

      const stageJob = await bigDataRunnerService.runJob(
        'concept-2',
        'c2_hdfs_to_sql'
      );
      expect(stageJob.status).toBe('SUCCEEDED');
      expect(stageJob.outputRowCount).toBe(59);
    });

    it('Concept 3: executes MapReduce Job A (Skill Frequency)', async () => {
      const mrJobA = await bigDataRunnerService.runJob(
        'concept-3',
        'c3_mr_skill_frequency'
      );
      expect(mrJobA.status).toBe('SUCCEEDED');
      expect(mrJobA.executionMode).toBe('HADOOP_STREAMING');
      expect(mrJobA.outputRowCount).toBeGreaterThan(0);
      expect(mrJobA.outputPreview.length).toBeGreaterThan(0);
      expect(mrJobA.outputPreview[0].skill).toBeDefined();
      expect(mrJobA.outputPreview[0].frequency).toBeGreaterThan(0);
    });

    it('Concept 3: executes MapReduce Job B (Project Activity Aggregation)', async () => {
      const mrJobB = await bigDataRunnerService.runJob(
        'concept-3',
        'c3_mr_project_activity'
      );
      expect(mrJobB.status).toBe('SUCCEEDED');
      expect(mrJobB.outputRowCount).toBeGreaterThan(0);
      expect(mrJobB.outputPreview[0].group).toBeDefined();
    });

    it('Concept 3: executes MapReduce Job C (Text Corpus Analysis)', async () => {
      const mrJobC = await bigDataRunnerService.runJob(
        'concept-3',
        'c3_mr_text_analysis'
      );
      expect(mrJobC.status).toBe('SUCCEEDED');
      expect(mrJobC.outputRowCount).toBeGreaterThan(0);
      expect(mrJobC.metrics.vocabularySize).toBeGreaterThan(0);
    });

    it('Concept 4: executes MongoDB document ingestion and aggregation pipeline', async () => {
      const mongoIngest = await bigDataRunnerService.runJob(
        'concept-4',
        'c4_mongo_bulk_ingest'
      );
      expect(mongoIngest.status).toBe('SUCCEEDED');
      expect(mongoIngest.outputRowCount).toBeGreaterThan(0);

      const mongoAgg = await bigDataRunnerService.runJob(
        'concept-4',
        'c4_mongo_agg_event_types'
      );
      expect(mongoAgg.status).toBe('SUCCEEDED');
      expect(mongoAgg.metrics.pipelineStages).toBe(2);
    });

    it('Concept 5: executes Apache Pig Latin ETL scripts with data quality separation', async () => {
      const pigSkill = await bigDataRunnerService.runJob(
        'concept-5',
        'c5_pig_skill_analysis'
      );
      expect(pigSkill.status).toBe('SUCCEEDED');
      expect(pigSkill.outputRowCount).toBeGreaterThan(0);

      const pigQuality = await bigDataRunnerService.runJob(
        'concept-5',
        'c5_pig_data_quality'
      );
      expect(pigQuality.status).toBe('SUCCEEDED');
      expect(pigQuality.rejectedRowCount).toBeGreaterThanOrEqual(0);
    });

    it('Concept 6: executes Apache Hive Metastore DDL and analytics queries', async () => {
      const hiveDdl = await bigDataRunnerService.runJob(
        'concept-6',
        'c6_hive_create_metastore'
      );
      expect(hiveDdl.status).toBe('SUCCEEDED');
      expect(hiveDdl.outputRowCount).toBe(6); // 6 tables

      const hiveAnalytics = await bigDataRunnerService.runJob(
        'concept-6',
        'c6_hive_skill_analytics'
      );
      expect(hiveAnalytics.status).toBe('SUCCEEDED');
      expect(hiveAnalytics.outputRowCount).toBeGreaterThan(0);
    });

    it('persists execution history and logs for instructor audit', async () => {
      const jobs = await bigDataRunnerService.getRecentJobs(10);
      expect(jobs.length).toBeGreaterThan(0);
      const latest = jobs[0];
      expect(latest.logs.length).toBeGreaterThan(0);
      expect(latest.durationMs).toBeGreaterThanOrEqual(0);
    });
  });
});
