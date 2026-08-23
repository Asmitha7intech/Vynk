import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { gamificationService } from '../services/gamification.service';

export async function gamificationController(fastify: FastifyInstance) {
  fastify.get('/leaderboard', async (request: FastifyRequest<{ Querystring: { scope?: string; college?: string; department?: string } }>, reply: FastifyReply) => {
    const scope = request.query.scope || 'GLOBAL';
    const entries = await gamificationService.getLeaderboard(scope, request.query.college, request.query.department);
    return reply.send({ success: true, data: entries });
  });

  fastify.get('/badges', async (request: FastifyRequest, reply: FastifyReply) => {
    const badges = await gamificationService.listBadges();
    return reply.send({ success: true, data: badges });
  });
}
