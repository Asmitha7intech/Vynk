import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { storageService, UploadRequest } from '../services/storage.service';
import { getUploadsDir } from '../utils/paths';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
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

  // Local development file upload handler
  const handleUpload = async (request: FastifyRequest<{ Querystring: { key?: string } }>, reply: FastifyReply) => {
    const fileKey = request.query.key;
    if (!fileKey) {
      return reply.status(400).send({ success: false, message: 'Missing key parameter' });
    }

    const safeKey = path.normalize(fileKey).replace(/^(\.\.[\/\\])+/, '');
    const uploadsDir = getUploadsDir();
    const destinationPath = path.join(uploadsDir, safeKey);

    if (!destinationPath.startsWith(uploadsDir)) {
      return reply.status(403).send({ success: false, message: 'Forbidden path traversal' });
    }

    await fs.promises.mkdir(path.dirname(destinationPath), { recursive: true });

    let buffer: Buffer | null = null;
    if (typeof (request as any).isMultipart === 'function' && (request as any).isMultipart()) {
      const filePart = await request.file();
      if (filePart) {
        buffer = await filePart.toBuffer();
      }
    } else if (Buffer.isBuffer(request.body)) {
      buffer = request.body;
    } else if ((request.body as any)?.data) {
      const b64 = (request.body as any).data;
      buffer = Buffer.from(b64.includes(',') ? b64.split(',')[1] : b64, 'base64');
    }

    if (!buffer) {
      return reply.status(400).send({ success: false, message: 'No file content provided' });
    }

    await fs.promises.writeFile(destinationPath, buffer);
    const publicUrl = `/uploads/${safeKey}`;

    return reply.send({
      success: true,
      message: 'File stored successfully',
      data: {
        publicUrl,
        fileKey: safeKey,
      },
    });
  };

  fastify.post('/upload', { preHandler: [(fastify as any).authenticate] }, handleUpload);
  fastify.put('/upload', { preHandler: [(fastify as any).authenticate] }, handleUpload);

  // Direct media upload for posts (supports images, GIFs, videos up to 50MB)
  fastify.post('/upload-media', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    let buffer: Buffer | null = null;
    let filename = `media-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.jpg`;
    let contentType = 'image/jpeg';

    if (typeof (request as any).isMultipart === 'function' && (request as any).isMultipart()) {
      const filePart = await request.file();
      if (filePart) {
        buffer = await filePart.toBuffer();
        if (filePart.filename) {
          const originalExt = path.extname(filePart.filename).toLowerCase() || '.jpg';
          filename = `media-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${originalExt}`;
        }
        if (filePart.mimetype) {
          contentType = filePart.mimetype;
        }
      }
    } else {
      const body: any = request.body || {};
      if (body.data) {
        const b64 = body.data;
        buffer = Buffer.from(b64.includes(',') ? b64.split(',')[1] : b64, 'base64');
        const ext = body.filename ? path.extname(body.filename) : (body.type === 'video' ? '.mp4' : '.jpg');
        filename = `media-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
      }
    }

    if (!buffer || buffer.length === 0) {
      return reply.status(400).send({ success: false, message: 'No media content provided' });
    }

    if (buffer.length > 50 * 1024 * 1024) {
      return reply.status(400).send({ success: false, message: 'Media file exceeds 50MB limit' });
    }

    const uploadsDir = path.join(getUploadsDir(), 'posts');
    await fs.promises.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/posts/${filename}`;
    return reply.send({
      success: true,
      data: {
        url: publicUrl,
        filename,
        contentType,
        size: buffer.length,
      },
    });
  });
}
