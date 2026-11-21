import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { voyageService } from '../services/voyage.service';
import {
  createVoyageSchema,
  createProjectJoinRequestSchema,
  updateProjectJoinRequestSchema,
  createProjectTaskSchema,
  updateProjectTaskSchema,
  createProjectDiscussionSchema,
  createProjectMilestoneSchema,
  updateProjectMilestoneSchema,
} from '@vynk/validation';

export async function voyagesController(fastify: FastifyInstance) {
  fastify.get('/', async (request: FastifyRequest<{ Querystring: { category?: string } }>, reply: FastifyReply) => {
    const list = await voyageService.listVoyages(request.query.category);
    return reply.send({ success: true, data: list });
  });

  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const voyage = await voyageService.getVoyage(request.params.id);
    if (!voyage) return reply.status(404).send({ success: false, message: 'Voyage not found' });
    return reply.send({ success: true, data: voyage });
  });

  fastify.post('/', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = createVoyageSchema.parse(request.body);
    const voyage = await voyageService.createVoyage(request.userPayload!.userId, parsed);
    return reply.status(201).send({ success: true, data: voyage });
  });

  fastify.post('/:id/like', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const updated = await voyageService.likeVoyage(request.params.id, request.userPayload?.userId);
    return reply.send({ success: true, data: updated });
  });

  // Team Join Requests
  fastify.post('/:id/join-request', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parsed = createProjectJoinRequestSchema.parse(request.body);
    const result = await voyageService.createJoinRequest(request.params.id, request.userPayload!.userId, parsed);
    return reply.status(201).send({ success: true, data: result });
  });

  fastify.get('/:id/join-requests', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const list = await voyageService.getJoinRequests(request.params.id, request.userPayload!.userId);
    return reply.send({ success: true, data: list });
  });

  fastify.patch('/:id/join-requests/:requestId', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string; requestId: string } }>, reply: FastifyReply) => {
    const parsed = updateProjectJoinRequestSchema.parse(request.body);
    const updated = await voyageService.respondToJoinRequest(
      request.params.id,
      request.params.requestId,
      request.userPayload!.userId,
      parsed.status
    );
    return reply.send({ success: true, data: updated });
  });

  // Project Tasks
  fastify.post('/:id/tasks', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parsed = createProjectTaskSchema.parse(request.body);
    const task = await voyageService.createTask(request.params.id, request.userPayload!.userId, parsed);
    return reply.status(201).send({ success: true, data: task });
  });

  fastify.patch('/:id/tasks/:taskId', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string; taskId: string } }>, reply: FastifyReply) => {
    const parsed = updateProjectTaskSchema.parse(request.body);
    const updated = await voyageService.updateTask(
      request.params.id,
      request.params.taskId,
      request.userPayload!.userId,
      parsed
    );
    return reply.send({ success: true, data: updated });
  });

  fastify.delete('/:id/tasks/:taskId', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string; taskId: string } }>, reply: FastifyReply) => {
    try {
      await voyageService.deleteTask(
        request.params.id,
        request.params.taskId,
        request.userPayload!.userId,
        request.userPayload!.role
      );
      return reply.send({ success: true, message: 'Task deleted successfully' });
    } catch (err: any) {
      const status = err.statusCode || 400;
      return reply.status(status).send({ success: false, message: err.message });
    }
  });

  // Discussions
  fastify.post('/:id/discussions', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parsed = createProjectDiscussionSchema.parse(request.body);
    const discussion = await voyageService.createDiscussion(
      request.params.id,
      request.userPayload!.userId,
      parsed.content
    );
    return reply.status(201).send({ success: true, data: discussion });
  });

  // Milestones
  fastify.post('/:id/milestones', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parsed = createProjectMilestoneSchema.parse(request.body);
    const milestone = await voyageService.createMilestone(
      request.params.id,
      request.userPayload!.userId,
      parsed
    );
    return reply.status(201).send({ success: true, data: milestone });
  });

  fastify.patch('/:id/milestones/:milestoneId', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string; milestoneId: string } }>, reply: FastifyReply) => {
    const parsed = updateProjectMilestoneSchema.parse(request.body);
    const updated = await voyageService.updateMilestone(
      request.params.id,
      request.params.milestoneId,
      request.userPayload!.userId,
      parsed
    );
    return reply.send({ success: true, data: updated });
  });
}
