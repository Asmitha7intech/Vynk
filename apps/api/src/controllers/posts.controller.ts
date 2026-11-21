import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { postRepository } from '../repositories/post.repository';
import { createPostSchema, createCommentSchema } from '@vynk/validation';
import { eventService } from '../services/event.service';

export async function postsController(fastify: FastifyInstance) {
  // GET /api/v1/posts/feed
  fastify.get('/feed', async (request: FastifyRequest<{ Querystring: { limit?: string; cursor?: string } }>, reply: FastifyReply) => {
    const limit = parseInt(request.query.limit || '20', 10);
    const cursor = request.query.cursor;

    let userId: string | undefined;
    try {
      await request.jwtVerify();
      userId = (request.user as any)?.userId;
    } catch {
      // Unauthenticated client viewing public feed
    }

    const posts = await postRepository.listFeed(limit, cursor, userId);
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

  // GET /api/v1/posts/:id
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    let userId: string | undefined;
    try {
      await request.jwtVerify();
      userId = (request.user as any)?.userId;
    } catch {}

    const post = await postRepository.findById(request.params.id, userId);
    if (!post) {
      return reply.status(404).send({ success: false, message: 'Post not found' });
    }
    return reply.send({ success: true, data: post });
  });

  // POST /api/v1/posts
  fastify.post(
    '/',
    {
      preHandler: [(fastify as any).authenticate],
      config: {
        rateLimit:
          process.env.NODE_ENV === 'test'
            ? false
            : {
                max: 15,
                timeWindow: 60 * 1000, // 15 posts per minute
              },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = createPostSchema.parse(request.body);
      const userId = request.userPayload?.userId || (request as any).user?.userId;
      const post = await postRepository.createPost(userId, parsed);

      await eventService.publish({
        eventType: 'POST_CREATED',
        userId,
        college: post.author?.college || undefined,
        department: post.author?.department || undefined,
        payload: {
          postId: post.id,
          authorId: userId,
          type: post.type,
          title: post.title,
          tags: post.tags,
          voyageId: post.voyageId,
        },
      });

      return reply.status(201).send({ success: true, data: post });
    }
  );

  // PUT /api/v1/posts/:id (IDOR protected: author or admin only)
  fastify.put(
    '/:id',
    { preHandler: [(fastify as any).authenticate] },
    async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) => {
      const userId = request.userPayload!.userId;
      const userRole = request.userPayload!.role;
      try {
        const updated = await postRepository.updatePost(request.params.id, userId, request.body as any, userRole);
        return reply.send({ success: true, data: updated });
      } catch (err: any) {
        const status = err.statusCode || 400;
        return reply.status(status).send({ success: false, message: err.message });
      }
    }
  );

  // DELETE /api/v1/posts/:id (IDOR protected: author or admin only)
  fastify.delete(
    '/:id',
    { preHandler: [(fastify as any).authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const userId = request.userPayload!.userId;
      const userRole = request.userPayload!.role;
      try {
        await postRepository.deletePost(request.params.id, userId, userRole);
        return reply.send({ success: true, message: 'Post successfully deleted' });
      } catch (err: any) {
        const status = err.statusCode || 400;
        return reply.status(status).send({ success: false, message: err.message });
      }
    }
  );

  // GET /api/v1/posts/:id/comments
  fastify.get('/:id/comments', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const comments = await postRepository.getComments(request.params.id);
    return reply.send({ success: true, data: comments });
  });

  // POST /api/v1/posts/:id/comments
  fastify.post('/:id/comments', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parsed = createCommentSchema.parse(request.body);
    const userId = request.userPayload?.userId || (request as any).user?.userId;
    const comment = await postRepository.addComment(request.params.id, userId, parsed.content, parsed.parentId);

    await eventService.publish({
      eventType: 'POST_COMMENTED',
      userId,
      college: comment.author?.college || undefined,
      department: comment.author?.department || undefined,
      payload: {
        commentId: comment.id,
        postId: request.params.id,
        authorId: userId,
        parentId: parsed.parentId || null,
      },
    });

    return reply.status(201).send({ success: true, data: comment });
  });

  // DELETE /api/v1/posts/:postId/comments/:commentId
  fastify.delete(
    '/:postId/comments/:commentId',
    { preHandler: [(fastify as any).authenticate] },
    async (request: FastifyRequest<{ Params: { postId: string; commentId: string } }>, reply: FastifyReply) => {
      const userId = request.userPayload!.userId;
      const userRole = request.userPayload!.role;
      try {
        const result = await postRepository.deleteComment(request.params.commentId, userId, userRole);
        return reply.send({ success: true, data: result });
      } catch (err: any) {
        const status = err.statusCode || 400;
        return reply.status(status).send({ success: false, message: err.message });
      }
    }
  );

  // POST /api/v1/posts/:id/react
  fastify.post('/:id/react', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string }; Body?: { emoji?: string } }>, reply: FastifyReply) => {
    const userId = request.userPayload?.userId || (request as any).user?.userId;
    const emoji = (request.body as any)?.emoji || '🔥';
    const result = await postRepository.toggleReaction(request.params.id, userId, emoji);

    await eventService.publish({
      eventType: result.reacted ? 'POST_LIKED' : 'POST_UNLIKED',
      userId,
      payload: {
        postId: request.params.id,
        userId,
        emoji,
        reacted: result.reacted,
      },
    });

    return reply.send({ success: true, data: result });
  });

  // POST /api/v1/posts/:id/reactions
  fastify.post('/:id/reactions', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string }; Body?: { emoji?: string } }>, reply: FastifyReply) => {
    const userId = request.userPayload?.userId || (request as any).user?.userId;
    const emoji = (request.body as any)?.emoji || '🔥';
    const result = await postRepository.toggleReaction(request.params.id, userId, emoji);

    await eventService.publish({
      eventType: result.reacted ? 'POST_LIKED' : 'POST_UNLIKED',
      userId,
      payload: {
        postId: request.params.id,
        userId,
        emoji,
        reacted: result.reacted,
      },
    });

    return reply.send({ success: true, data: result });
  });
}
