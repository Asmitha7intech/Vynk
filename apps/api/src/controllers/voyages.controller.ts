import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { voyageService } from '../services/voyage.service';
import { createVoyageSchema } from '@vynk/validation';

export async function voyagesController(fastify: FastifyInstance) {
  fastify.get('/', async (request: FastifyRequest<{ Querystring: { category?: string } }>, reply: FastifyReply) => {
    const list = await voyageService.listVoyages(request.query.category);
    return reply.send({ success: true, data: list });
  });

  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const voyage = await voyageService.getVoyage(request.params.id);
    if (!voyage) return reply.status(404).send({ success: false, message: 'Voyage not found' });
    return reply.send({ success: true, data: voyage });
  });

  fastify.post('/', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = createVoyageSchema.parse(request.body);
    const voyage = await voyageService.createVoyage(request.userPayload!.userId, parsed);
    return reply.status(201).send({ success: true, data: voyage });
  });

  fastify.post('/:id/like', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const updated = await voyageService.likeVoyage(request.params.id);
    return reply.send({ success: true, data: updated });
  });
}
