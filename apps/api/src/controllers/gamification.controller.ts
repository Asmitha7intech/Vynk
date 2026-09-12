import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { gamificationService } from '../services/gamification.service';
import { LeaderboardScope } from '@vynk/types';

export async function gamificationController(fastify: FastifyInstance) {
  fastify.get('/leaderboard', async (request: FastifyRequest<{ Querystring: { scope?: string; filter?: string } }>, reply: FastifyReply) => {
    const scope = (request.query.scope?.toUpperCase() as LeaderboardScope) || 'GLOBAL';
    const entries = await gamificationService.getLeaderboard(scope, request.query.filter);
    return reply.send({ success: true, data: entries });
  });

  fastify.get('/rank-explanation/:userId', async (request: FastifyRequest<{ Params: { userId: string }; Querystring: { scope?: string } }>, reply: FastifyReply) => {
    const scope = (request.query.scope?.toUpperCase() as LeaderboardScope) || 'GLOBAL';
    try {
      const explanation = await gamificationService.getRankExplanation(request.params.userId, scope);
      return reply.send({ success: true, data: explanation });
    } catch (err: any) {
      return reply.status(404).send({ success: false, message: err.message });
    }
  });
}
