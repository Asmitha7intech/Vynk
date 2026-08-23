const fs = require('fs');
const path = require('path');

const analyticsCtrlPath = path.resolve(__dirname, '../apps/api/src/controllers/analytics.controller.ts');
const eventsCtrlPath = path.resolve(__dirname, '../apps/api/src/controllers/events.controller.ts');

const analyticsCtrlContent = `
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
`;

const eventsCtrlContent = `
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@vynk/database';

export async function eventsController(fastify: FastifyInstance) {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const events = await prisma.event.findMany({
      orderBy: { startsAt: 'asc' },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    return reply.send({
      success: true,
      data: events.map((e) => ({
        ...e,
        registrationsCount: e._count.registrations,
      })),
    });
  });

  fastify.post('/:id/register', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = (request as any).user.userId;
    const eventId = request.params.id;

    const registration = await prisma.eventRegistration.upsert({
      where: {
        eventId_userId: { eventId, userId },
      },
      update: {},
      create: {
        eventId,
        userId,
      },
    });

    return reply.send({ success: true, data: registration });
  });
}
`;

fs.writeFileSync(analyticsCtrlPath, analyticsCtrlContent.trim() + '\n', 'utf8');
fs.writeFileSync(eventsCtrlPath, eventsCtrlContent.trim() + '\n', 'utf8');
console.log('Created analytics and events controllers');
