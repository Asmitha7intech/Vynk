import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { institutionsService } from '../services/institutions.service';
import { z } from 'zod';

const VerifyCampusEmailSchema = z.object({
  institutionId: z.string().uuid(),
  campusEmail: z.string().email(),
});

export async function institutionsController(fastify: FastifyInstance) {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const list = await institutionsService.listApproved();
    return reply.send({ success: true, data: list });
  });

  fastify.post('/verify-campus', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parse = VerifyCampusEmailSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ success: false, errors: parse.error.flatten().fieldErrors });
    }

    const userId = (request as any).user.userId;
    try {
      const res = await institutionsService.verifyCampusEmail(userId, parse.data.institutionId, parse.data.campusEmail);
      return reply.send({ success: true, data: res, message: 'Campus verified successfully' });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });
}
