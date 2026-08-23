import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminService } from '../services/admin.service';

export async function adminController(fastify: FastifyInstance) {
  fastify.get('/analytics', { preHandler: [(fastify as any).requireRoles(['ADMIN', 'SUPER_ADMIN', 'MODERATOR'])] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const analytics = await adminService.getSystemAnalytics();
    return reply.send({ success: true, data: analytics });
  });

  fastify.get('/reports', { preHandler: [(fastify as any).requireRoles(['ADMIN', 'SUPER_ADMIN', 'MODERATOR'])] }, async (request: FastifyRequest<{ Querystring: { status?: string } }>, reply: FastifyReply) => {
    const reports = await adminService.listReports(request.query.status || 'PENDING');
    return reply.send({ success: true, data: reports });
  });

  fastify.post('/reports/:id/resolve', { preHandler: [(fastify as any).requireRoles(['ADMIN', 'SUPER_ADMIN', 'MODERATOR'])] }, async (request: FastifyRequest<{ Params: { id: string }; Body: { status: 'ACTIONED' | 'DISMISSED' } }>, reply: FastifyReply) => {
    const resolved = await adminService.resolveReport(request.params.id, request.body.status);
    return reply.send({ success: true, data: resolved });
  });
}
