import { prisma } from '@vynk/database';

export interface CreateReportInput {
  targetType: 'USER' | 'POST' | 'MESSAGE' | 'COMMENT';
  targetId: string;
  reason: string;
  details?: string;
}

export const reportService = {
  createReport: async (reporterId: string, input: CreateReportInput) => {
    return (prisma as any).report.create({
      data: {
        reporterId,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        details: input.details || null,
        status: 'PENDING',
      },
    });
  },

  listReports: async (status?: string) => {
    const where = status ? { status } : {};
    return (prisma as any).report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { reporter: true },
    });
  },

  resolveReport: async (reportId: string, action: 'RESOLVED' | 'DISMISSED', moderatorId: string) => {
    const report = await (prisma as any).report.update({
      where: { id: reportId },
      data: { status: action },
    });

    // Record in AuditLog
    await (prisma as any).auditLog.create({
      data: {
        actorId: moderatorId,
        action: `REPORT_${action}`,
        entityType: 'Report',
        entityId: reportId,
        details: { targetType: report.targetType, targetId: report.targetId },
      },
    });

    return report;
  },
};
