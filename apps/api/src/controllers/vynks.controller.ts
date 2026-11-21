import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { vynkService } from '../services/vynk.service';

export async function vynksController(fastify: FastifyInstance) {
  fastify.get('/connections', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const list = await vynkService.getConnections(request.userPayload!.userId);
    return reply.send({ success: true, data: list });
  });

  fastify.get('/requests/pending', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const list = await vynkService.getPendingRequests(request.userPayload!.userId);
    return reply.send({ success: true, data: list });
  });

  fastify.get('/requests/sent', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const list = await vynkService.getOutgoingPendingRequests(request.userPayload!.userId);
    return reply.send({ success: true, data: list });
  });

  fastify.delete('/requests/:connectionId', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { connectionId: string } }>, reply: FastifyReply) => {
    await vynkService.cancelRequest(request.params.connectionId, request.userPayload!.userId);
    return reply.send({ success: true, message: 'Request canceled' });
  });

  fastify.post('/request/:targetUserId', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { targetUserId: string } }>, reply: FastifyReply) => {
    const conn = await vynkService.sendRequest(request.userPayload!.userId, request.params.targetUserId);
    return reply.status(201).send({ success: true, data: conn });
  });

  fastify.post('/requests/:connectionId/accept', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { connectionId: string } }>, reply: FastifyReply) => {
    const conn = await vynkService.acceptRequest(request.params.connectionId, request.userPayload!.userId);
    return reply.send({ success: true, data: conn });
  });

  fastify.post('/accept/:connectionId', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { connectionId: string } }>, reply: FastifyReply) => {
    const conn = await vynkService.acceptRequest(request.params.connectionId, request.userPayload!.userId);
    return reply.send({ success: true, data: conn });
  });

  fastify.post('/requests/:connectionId/reject', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { connectionId: string } }>, reply: FastifyReply) => {
    const conn = await vynkService.rejectRequest(request.params.connectionId, request.userPayload!.userId);
    return reply.send({ success: true, data: conn });
  });

  fastify.post('/reject/:connectionId', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { connectionId: string } }>, reply: FastifyReply) => {
    const conn = await vynkService.rejectRequest(request.params.connectionId, request.userPayload!.userId);
    return reply.send({ success: true, data: conn });
  });

  fastify.post('/follow/:targetUserId', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { targetUserId: string } }>, reply: FastifyReply) => {
    const follow = await vynkService.followUser(request.userPayload!.userId, request.params.targetUserId);
    return reply.status(201).send({ success: true, data: follow });
  });

  fastify.delete('/follow/:targetUserId', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { targetUserId: string } }>, reply: FastifyReply) => {
    await vynkService.unfollowUser(request.userPayload!.userId, request.params.targetUserId);
    return reply.send({ success: true, message: 'Unfollowed' });
  });
}
