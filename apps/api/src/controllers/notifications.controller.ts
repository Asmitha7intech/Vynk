import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { notificationService } from '../services/notification.service';

export async function notificationsController(fastify: FastifyInstance) {
  // GET /api/v1/notifications
  fastify.get('/', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Querystring: { limit?: string } }>, reply: FastifyReply) => {
    const limit = parseInt(request.query.limit || '50', 10);
    const userId = request.userPayload!.userId;
    const result = await notificationService.getUserNotifications(userId, limit);
    return reply.send({ success: true, data: result });
  });

  // PATCH /api/v1/notifications/:id/read
  fastify.patch('/:id/read', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = request.userPayload!.userId;
    try {
      const updated = await notificationService.markAsRead(request.params.id, userId);
      return reply.send({ success: true, data: updated });
    } catch (err: any) {
      return reply.status(404).send({ success: false, message: err.message });
    }
  });

  // POST /api/v1/notifications/read-all
  fastify.post('/read-all', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userPayload!.userId;
    await notificationService.markAllAsRead(userId);
    return reply.send({ success: true, message: 'All notifications marked as read' });
  });
}
