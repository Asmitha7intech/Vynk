import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { analyticsService } from '../services/analytics.service';
import { TrackAnalyticsEventSchema } from '@vynk/validation';
import { dataLakeService } from '../services/data-lake.service';
import { eventService } from '../services/event.service';
import { outboxWorker } from '../services/outbox-worker.service';

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

  // Real-time event stream metrics
  fastify.get('/realtime', async (request: FastifyRequest, reply: FastifyReply) => {
    const metrics = dataLakeService.getRealtimeMetrics();
    return reply.send({ success: true, data: metrics });
  });

  // Medallion lake zone file statistics
  fastify.get('/lake/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const stats = dataLakeService.getLakeStats();
    return reply.send({ success: true, data: stats });
  });

  // Outbox worker + queue statistics
  fastify.get('/outbox/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const [stats, workerStatus] = await Promise.all([
      eventService.getOutboxStats(),
      Promise.resolve(outboxWorker.getStatus()),
    ]);
    return reply.send({
      success: true,
      data: { queue: stats, worker: workerStatus },
    });
  });
}

