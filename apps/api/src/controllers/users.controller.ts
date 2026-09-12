import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { userService } from '../services/user.service';
import { crossDepartmentService } from '../services/cross-department.service';
import { updateProfileSchema, addSkillSchema } from '@vynk/validation';

export async function usersController(fastify: FastifyInstance) {

  fastify.get('/cross-department', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userPayload!.userId;
    const matches = await crossDepartmentService.getCrossDepartmentMatches(userId, 10);
    return reply.send({ success: true, data: matches });
  });

  fastify.get('/search', async (request: FastifyRequest<{ Querystring: { q?: string } }>, reply: FastifyReply) => {
    const query = request.query.q || '';
    const users = await userService.search(query);
    return reply.send({ success: true, data: users });
  });

  fastify.get('/:username', async (request: FastifyRequest<{ Params: { username: string } }>, reply: FastifyReply) => {
    const summary = await userService.getByUsername(request.params.username);
    return reply.send({ success: true, data: summary });
  });

  fastify.patch('/profile', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = updateProfileSchema.parse(request.body);
    const updated = await userService.updateProfile(request.userPayload!.userId, parsed);
    return reply.send({ success: true, data: updated });
  });

  fastify.post('/skills', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = addSkillSchema.parse(request.body);
    const skill = await userService.addSkill(request.userPayload!.userId, parsed);
    return reply.status(201).send({ success: true, data: skill });
  });
}
