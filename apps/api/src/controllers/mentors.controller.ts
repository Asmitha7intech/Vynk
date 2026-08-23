import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { mentorService } from '../services/mentor.service';
import { createMentorProfileSchema, requestMentorshipSchema } from '@vynk/validation';

export async function mentorsController(fastify: FastifyInstance) {
  fastify.get('/', async (request: FastifyRequest<{ Querystring: { category?: string } }>, reply: FastifyReply) => {
    const list = await mentorService.listMentors(request.query.category);
    return reply.send({ success: true, data: list });
  });

  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const mentor = await mentorService.getMentor(request.params.id);
    if (!mentor) return reply.status(404).send({ success: false, message: 'Mentor not found' });
    return reply.send({ success: true, data: mentor });
  });

  fastify.post('/profile', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = createMentorProfileSchema.parse(request.body);
    const profile = await mentorService.createProfile(request.userPayload!.userId, parsed);
    return reply.status(201).send({ success: true, data: profile });
  });

  fastify.post('/request', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = requestMentorshipSchema.parse(request.body);
    const req = await mentorService.requestMentorship(request.userPayload!.userId, parsed);
    return reply.status(201).send({ success: true, data: req });
  });

  fastify.post('/request/:requestId/respond', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { requestId: string }; Body: { accept: boolean; note?: string } }>, reply: FastifyReply) => {
    const updated = await mentorService.respondToRequest(
      request.userPayload!.userId,
      request.params.requestId,
      request.body.accept,
      request.body.note
    );
    return reply.send({ success: true, data: updated });
  });
}
