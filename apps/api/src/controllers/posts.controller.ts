import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { postRepository } from '../repositories/post.repository';
import { createPostSchema, createCommentSchema } from '@vynk/validation';

export async function postsController(fastify: FastifyInstance) {
  fastify.get('/feed', async (request: FastifyRequest<{ Querystring: { limit?: string; cursor?: string } }>, reply: FastifyReply) => {
    const limit = parseInt(request.query.limit || '20', 10);
    const cursor = request.query.cursor;

    const posts = await postRepository.listFeed(limit, cursor);
    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return reply.send({
      success: true,
      data: items,
      nextCursor,
      hasMore,
    });
  });

  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const post = await postRepository.findById(request.params.id);
    if (!post) {
      return reply.status(404).send({ success: false, message: 'Post not found' });
    }
    return reply.send({ success: true, data: post });
  });

  fastify.post('/', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = createPostSchema.parse(request.body);
    const userId = request.userPayload?.userId || (request as any).user?.userId;
    const post = await postRepository.createPost(userId, parsed);
    return reply.status(201).send({ success: true, data: post });
  });

  fastify.post('/:id/comments', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parsed = createCommentSchema.parse(request.body);
    const userId = request.userPayload?.userId || (request as any).user?.userId;
    const comment = await postRepository.addComment(request.params.id, userId, parsed.content, parsed.parentId);
    return reply.status(201).send({ success: true, data: comment });
  });

  fastify.post('/:id/react', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string }; Body?: { emoji?: string } }>, reply: FastifyReply) => {
    const userId = request.userPayload?.userId || (request as any).user?.userId;
    const emoji = (request.body as any)?.emoji || '🔥';
    const result = await postRepository.toggleReaction(request.params.id, userId, emoji);
    return reply.send({ success: true, data: result });
  });

  fastify.post('/:id/reactions', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string }; Body?: { emoji?: string } }>, reply: FastifyReply) => {
    const userId = request.userPayload?.userId || (request as any).user?.userId;
    const emoji = (request.body as any)?.emoji || '🔥';
    const result = await postRepository.toggleReaction(request.params.id, userId, emoji);
    return reply.send({ success: true, data: result });
  });
}
