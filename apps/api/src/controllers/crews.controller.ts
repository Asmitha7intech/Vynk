import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { crewService } from '../services/crew.service';
import { createCrewSchema, updateTeamAgreementSchema } from '@vynk/validation';

export async function crewsController(fastify: FastifyInstance) {
  fastify.get('/', async (request: FastifyRequest<{ Querystring: { category?: string } }>, reply: FastifyReply) => {
    const list = await crewService.listCrews(request.query.category);
    return reply.send({ success: true, data: list });
  });

  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const crew = await crewService.getCrew(request.params.id);
    if (!crew) return reply.status(404).send({ success: false, message: 'Crew not found' });
    return reply.send({ success: true, data: crew });
  });

  fastify.post('/', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = createCrewSchema.parse(request.body);
    const crew = await crewService.createCrew(request.userPayload!.userId, parsed);
    return reply.status(201).send({ success: true, data: crew });
  });

  fastify.post('/:id/join', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string }; Body: { roleName: string } }>, reply: FastifyReply) => {
    const member = await crewService.joinCrew(request.params.id, request.userPayload!.userId, request.body.roleName || 'Contributor');
    return reply.status(201).send({ success: true, data: member });
  });

  fastify.patch('/:id/agreement', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parsed = updateTeamAgreementSchema.parse(request.body);
    const updated = await crewService.updateAgreement(request.params.id, parsed);
    return reply.send({ success: true, data: updated });
  });

  fastify.post('/:id/sign-agreement', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const updated = await crewService.signTeamAgreement(request.params.id, request.userPayload!.userId);
    return reply.send({ success: true, data: updated, message: 'Team agreement signed successfully' });
  });
}
