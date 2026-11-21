import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { messageService } from '../services/message.service';
import { sendMessageSchema } from '@vynk/validation';

export async function messagesController(fastify: FastifyInstance) {
  // GET /api/v1/messages/conversations
  fastify.get('/conversations', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const list = await messageService.getUserConversations(request.userPayload!.userId);
    return reply.send({ success: true, data: list });
  });

  // GET /api/v1/messages/conversations/:id/messages
  fastify.get('/conversations/:id/messages', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string }; Querystring: { limit?: string } }>, reply: FastifyReply) => {
    const limit = parseInt(request.query.limit || '50', 10);
    const messages = await messageService.getConversationMessages(request.params.id, request.userPayload!.userId, limit);
    return reply.send({ success: true, data: messages });
  });

  // POST /api/v1/messages/conversations/:id/read
  fastify.post('/conversations/:id/read', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const result = await messageService.markConversationRead(request.params.id, request.userPayload!.userId);
    return reply.send({ success: true, data: result });
  });

  // Direct conversation lookup/creation - support both GET and POST
  const directHandler = async (request: FastifyRequest<{ Params: { targetUserId: string } }>, reply: FastifyReply) => {
    try {
      const conv = await messageService.getOrCreateDirectConversation(request.userPayload!.userId, request.params.targetUserId);
      return reply.send({ success: true, data: conv });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  };

  fastify.get('/direct/:targetUserId', { preHandler: [(fastify as any).authenticate] }, directHandler);
  fastify.post('/direct/:targetUserId', { preHandler: [(fastify as any).authenticate] }, directHandler);

  // POST /api/v1/messages/send
  fastify.post(
    '/send',
    {
      preHandler: [(fastify as any).authenticate],
      config: {
        rateLimit:
          process.env.NODE_ENV === 'test'
            ? false
            : {
                max: 30,
                timeWindow: 60 * 1000, // 30 messages per minute
              },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const parsed = sendMessageSchema.parse(request.body);
        const msg = await messageService.sendMessage(
          parsed.conversationId,
          request.userPayload!.userId,
          parsed.content,
          parsed.attachments,
          parsed.replyToId || undefined
        );
        return reply.status(201).send({ success: true, data: msg });
      } catch (err: any) {
        if (err.message?.includes('blocked') || err.message?.includes('permission')) {
          return reply.status(403).send({ success: false, message: err.message });
        }
        return reply.status(400).send({ success: false, message: err.message });
      }
    });
}
