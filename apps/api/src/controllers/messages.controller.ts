import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { messageService } from '../services/message.service';
import { sendMessageSchema } from '@vynk/validation';

export async function messagesController(fastify: FastifyInstance) {
  fastify.get('/conversations', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const list = await messageService.getUserConversations(request.userPayload!.userId);
    return reply.send({ success: true, data: list });
  });

  fastify.get('/conversations/:id/messages', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const messages = await messageService.getConversationMessages(request.params.id, request.userPayload!.userId);
    return reply.send({ success: true, data: messages });
  });

  fastify.post('/direct/:targetUserId', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { targetUserId: string } }>, reply: FastifyReply) => {
    const conv = await messageService.getOrCreateDirectConversation(request.userPayload!.userId, request.params.targetUserId);
    return reply.send({ success: true, data: conv });
  });

  fastify.post('/send', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = sendMessageSchema.parse(request.body);
    const msg = await messageService.sendMessage(
      parsed.conversationId,
      request.userPayload!.userId,
      parsed.content,
      parsed.attachments,
      parsed.replyToId || undefined
    );
    return reply.status(201).send({ success: true, data: msg });
  });
}
