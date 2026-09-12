const fs = require('fs');
const path = require('path');

const serverPath = path.resolve(__dirname, '../apps/api/src/server.ts');
let serverContent = fs.readFileSync(serverPath, 'utf8');

if (!serverContent.includes('institutionsController')) {
  serverContent = serverContent.replace(
    "import { storageController } from './controllers/storage.controller';",
    "import { storageController } from './controllers/storage.controller';\nimport { institutionsController } from './controllers/institutions.controller';"
  );

  serverContent = serverContent.replace(
    "fastify.register(storageController, { prefix: `${prefix}/storage` });",
    "fastify.register(storageController, { prefix: `${prefix}/storage` });\n    fastify.register(institutionsController, { prefix: `${prefix}/institutions` });"
  );

  fs.writeFileSync(serverPath, serverContent, 'utf8');
  console.log('Registered institutionsController in server.ts');
}

const postsCtrlPath = path.resolve(__dirname, '../apps/api/src/controllers/posts.controller.ts');
const postsCtrlContent = `
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
    const userId = (request as any).user.userId;
    const post = await postRepository.createPost(userId, parsed);
    return reply.status(201).send({ success: true, data: post });
  });

  fastify.post('/:id/comments', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parsed = createCommentSchema.parse(request.body);
    const userId = (request as any).user.userId;
    const comment = await postRepository.addComment(request.params.id, userId, parsed.content, parsed.parentId);
    return reply.status(201).send({ success: true, data: comment });
  });

  fastify.post('/:id/react', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = (request as any).user.userId;
    const result = await postRepository.toggleReaction(request.params.id, userId);
    return reply.send({ success: true, data: result });
  });
}
`;

fs.writeFileSync(postsCtrlPath, postsCtrlContent.trim() + '\n', 'utf8');
console.log('Updated posts.controller.ts with cursor pagination');
