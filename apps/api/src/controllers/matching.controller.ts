import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { matchingService } from '../services/matching.service';

export async function matchingController(fastify: FastifyInstance) {
  // v1: Crew-specific matching
  fastify.get('/crew/:crewId', async (request: FastifyRequest<{ Params: { crewId: string } }>, reply: FastifyReply) => {
    const recommendations = await matchingService.findCompatibleMembersForCrew(request.params.crewId);
    return reply.send({ success: true, data: recommendations });
  });

  // v2: Personalized collaborator discovery for authenticated user
  fastify.get('/collaborators', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userPayload?.userId || (request as any).user?.userId;
    const limit = parseInt((request.query as any)?.limit || '10', 10);
    const results = await matchingService.findCollaboratorsV2(userId, limit);
    return reply.send({ success: true, data: results, version: 'v2' });
  });

  // Recommendation feedback endpoint
  fastify.post('/feedback', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userPayload?.userId || (request as any).user?.userId;
    const { targetId, action, recommendationType, context } = request.body as any;

    if (!targetId || !action) {
      return reply.code(400).send({ success: false, message: 'targetId and action are required' });
    }

    const record = await matchingService.recordFeedback(userId, targetId, action, recommendationType, context);
    return reply.status(201).send({ success: true, data: record });
  });
}

