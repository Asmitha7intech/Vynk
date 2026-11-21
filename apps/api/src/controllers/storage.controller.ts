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

export function validateMagicBytes(buffer: Buffer): { valid: boolean; ext: string; mime: string } {
  if (buffer.length < 4) {
    return { valid: false, ext: '', mime: '' };
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, ext: '.jpg', mime: 'image/jpeg' };
  }
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { valid: true, ext: '.png', mime: 'image/png' };
  }
  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return { valid: true, ext: '.gif', mime: 'image/gif' };
  }
  // WebP: RIFF (52 49 46 46) and bytes 8-11 'WEBP'
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, ext: '.webp', mime: 'image/webp' };
  }
  return { valid: false, ext: '', mime: '' };
}

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

    if (buffer.length > 5 * 1024 * 1024) {
      return reply.status(400).send({ success: false, message: 'File exceeds 5MB size limit' });
    }

    const lowerKey = safeKey.toLowerCase();
    if (lowerKey.endsWith('.jpg') || lowerKey.endsWith('.jpeg') || lowerKey.endsWith('.png') || lowerKey.endsWith('.webp')) {
      const check = validateMagicBytes(buffer);
      if (!check.valid) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid file format: content does not match expected image magic signature',
        });
      }
    }

    await fs.promises.writeFile(destinationPath, buffer);
    const normalizedKey = safeKey.replace(/\\/g, '/');
    const publicUrl = `/uploads/${normalizedKey}`;

    return reply.send({
      success: true,
      message: 'File stored successfully',
      data: {
        publicUrl,
        fileKey: normalizedKey,
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
