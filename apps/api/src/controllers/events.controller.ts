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

  fastify.post('/:id/register', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
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
