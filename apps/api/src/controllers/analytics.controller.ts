import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { analyticsService } from '../services/analytics.service';
import { TrackAnalyticsEventSchema } from '@vynk/validation';

export async function analyticsController(fastify: FastifyInstance) {
  fastify.post('/track', async (request: FastifyRequest, reply: FastifyReply) => {
    const parse = TrackAnalyticsEventSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.code(400).send({ success: false, errors: parse.error.flatten().fieldErrors });
    }

    const userId = (request as any).user?.userId;
    const { eventName, sessionId, metadata } = parse.data;

    await analyticsService.track(eventName, userId, sessionId, metadata);
    return reply.send({ success: true });
  });

  fastify.get('/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    const metrics = await analyticsService.getPlatformMetrics();
    return reply.send({ success: true, data: metrics });
  });
}
