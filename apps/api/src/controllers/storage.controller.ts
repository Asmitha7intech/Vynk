import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { storageService, UploadRequest } from '../services/storage.service';
import { z } from 'zod';

const GetSignedUrlSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  folder: z.enum(['avatars', 'voyages', 'posts', 'evidence']).optional(),
});

export async function storageController(fastify: FastifyInstance) {
  fastify.post('/signed-url', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parse = GetSignedUrlSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ success: false, errors: parse.error.flatten().fieldErrors });
    }

    try {
      const res = await storageService.getSignedUploadUrl(parse.data);
      return reply.send({ success: true, data: res });
    } catch (err: any) {
      return reply.status(400).send({ success: false, message: err.message });
    }
  });
}
