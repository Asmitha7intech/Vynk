import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { bigDataService } from '../services/bigdata.service';

export async function bigDataController(fastify: FastifyInstance) {
  fastify.get('/campus-heatmap', async (request: FastifyRequest<{ Querystring: { college?: string } }>, reply: FastifyReply) => {
    const data = await bigDataService.getCampusSkillHeatmap(request.query.college);
    return reply.send({ success: true, data });
  });

  fastify.get('/dept-collaboration', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await bigDataService.getDepartmentCollaborationMatrix();
    return reply.send({ success: true, data });
  });

  fastify.get('/skill-demand', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = await bigDataService.getSkillDemandSupply();
    return reply.send({ success: true, data });
  });
}
