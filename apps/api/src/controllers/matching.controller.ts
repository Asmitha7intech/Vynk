import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { matchingService } from '../services/matching.service';

export async function matchingController(fastify: FastifyInstance) {
  fastify.get('/crew/:crewId', async (request: FastifyRequest<{ Params: { crewId: string } }>, reply: FastifyReply) => {
    const recommendations = await matchingService.findCompatibleMembersForCrew(request.params.crewId);
    return reply.send({ success: true, data: recommendations });
  });
}
