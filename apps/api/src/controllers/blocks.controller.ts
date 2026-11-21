import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { blockService } from '../services/block.service';

export async function blocksController(fastify: FastifyInstance) {
  fastify.get('/', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userPayload!.userId;
    const blockedUsers = await blockService.getBlockedUsers(userId);
    return reply.send({ success: true, data: blockedUsers });
  });

  fastify.post('/:targetUserId', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { targetUserId: string } }>, reply: FastifyReply) => {
    const userId = request.userPayload!.userId;
    try {
      const block = await blockService.blockUser(userId, request.params.targetUserId);
      return reply.status(201).send({ success: true, message: 'User blocked successfully', data: block });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });

  fastify.delete('/:targetUserId', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { targetUserId: string } }>, reply: FastifyReply) => {
    const userId = request.userPayload!.userId;
    await blockService.unblockUser(userId, request.params.targetUserId);
    return reply.send({ success: true, message: 'User unblocked successfully' });
  });
}
