import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { directoryService } from '../services/directory.service';
import { claimDirectoryRecordSchema, updateDirectoryRecordSchema } from '@vynk/validation';

export async function directoryController(fastify: FastifyInstance) {
  // Public / student directory search
  fastify.get('/', async (request: FastifyRequest<{
    Querystring: {
      search?: string;
      page?: string;
      limit?: string;
      status?: 'all' | 'claimed' | 'unclaimed';
      department?: string;
      sortBy?: 'name_asc' | 'name_desc' | 'studentId_asc' | 'studentId_desc';
    };
  }>, reply: FastifyReply) => {
    const { search, page, limit, status, department, sortBy } = request.query;
    const result = await directoryService.search({
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
      department,
      sortBy,
    });
    return reply.send({ success: true, ...result });
  });

  // Single directory record
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const record = await directoryService.getById(request.params.id);
    if (!record) {
      return reply.status(404).send({ success: false, message: 'Classroom directory record not found' });
    }
    return reply.send({ success: true, data: record });
  });

  // Claim a directory record (Authenticated student)
  fastify.post('/claim', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = claimDirectoryRecordSchema.parse(request.body);
    const userId = request.userPayload!.userId;

    try {
      const claimed = await directoryService.claim(userId, parsed.directoryId, parsed.studentId);
      return reply.send({
        success: true,
        message: 'Successfully claimed your classroom directory profile!',
        data: claimed,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message || 'Failed to claim directory record',
      });
    }
  });

  // Update a directory record (Admin / Moderator audit trail)
  fastify.patch('/:id', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const parsed = updateDirectoryRecordSchema.parse(request.body);
    const userId = request.userPayload!.userId;

    try {
      const updated = await directoryService.update(request.params.id, userId, parsed);
      return reply.send({
        success: true,
        message: 'Directory record updated with audit trail logged',
        data: updated,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        message: err.message || 'Failed to update directory record',
      });
    }
  });
}
