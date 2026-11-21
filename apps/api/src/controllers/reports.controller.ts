import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { reportService, CreateReportInput } from '../services/report.service';

export async function reportsController(fastify: FastifyInstance) {
  // Student submits a report
  fastify.post('/', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Body: CreateReportInput }>, reply: FastifyReply) => {
    const userId = request.userPayload!.userId;
    const body = request.body;
    if (!body?.targetType || !body?.targetId || !body?.reason) {
      return reply.status(400).send({
        success: false,
        message: 'targetType, targetId, and reason are required.',
      });
    }

    const report = await reportService.createReport(userId, body);
    return reply.status(201).send({
      success: true,
      message: 'Report submitted successfully. Our safety team will review it.',
      data: report,
    });
  });

  // Admin moderation queue
  fastify.get('/', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Querystring: { status?: string } }>, reply: FastifyReply) => {
    const role = request.userPayload!.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ success: false, message: 'Forbidden: Admin access required.' });
    }

    const reports = await reportService.listReports(request.query.status);
    return reply.send({ success: true, data: reports });
  });

  // Admin resolves report
  fastify.patch('/:id/resolve', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string }; Body: { action: 'RESOLVED' | 'DISMISSED' } }>, reply: FastifyReply) => {
    const role = request.userPayload!.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ success: false, message: 'Forbidden: Admin access required.' });
    }

    const action = request.body?.action || 'RESOLVED';
    const report = await reportService.resolveReport(request.params.id, action, request.userPayload!.userId);
    return reply.send({ success: true, message: `Report marked as ${action}`, data: report });
  });
}
