import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { postRepository } from '../repositories/post.repository';
import { createPostSchema, createCommentSchema } from '@vynk/validation';

export async function postsController(fastify: FastifyInstance) {
  fastify.get('/feed', async (request: FastifyRequest, reply: FastifyReply) => {
    const posts = await postRepository.getFeed(30);
    return reply.send({ success: true, data: posts });
  });

  fastify.post('/', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = createPostSchema.parse(request.body);
    const post = await postRepository.create({
      ...parsed,
      authorId: request.userPayload!.userId,
    });
    return reply.status(201).send({ success: true, data: post });
  });

  fastify.post('/:id/comments', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parsed = createCommentSchema.parse(request.body);
    const comment = await postRepository.addComment(
      request.params.id,
      request.userPayload!.userId,
      parsed.content,
      parsed.parentId || undefined
    );
    return reply.status(201).send({ success: true, data: comment });
  });

  fastify.post('/:id/react', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string }; Body: { emoji?: string } }>, reply: FastifyReply) => {
    const emoji = request.body?.emoji || '🔥';
    const result = await postRepository.toggleReaction(request.params.id, request.userPayload!.userId, emoji);
    return reply.send({ success: true, data: result });
  });
}
