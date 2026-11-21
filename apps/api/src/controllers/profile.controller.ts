import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs';
import path from 'path';
import { prisma } from '@vynk/database';
import { userRepository } from '../repositories/user.repository';
import { userService } from '../services/user.service';
import { eventService } from '../services/event.service';
import { updateProfileSchema } from '@vynk/validation';

import { getUploadsDir } from '../utils/paths';
import crypto from 'crypto';

function detectImageExtension(buffer: Buffer): 'jpg' | 'png' | 'webp' | 'gif' | null {
  if (buffer.length < 12) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg';
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }
  // WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'webp';
  }
  // GIF: GIF87a or GIF89a (47 49 46 38)
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'gif';
  }
  return null;
}

export async function profileController(fastify: FastifyInstance) {
  // GET /api/v1/profile/me
  fastify.get('/me', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userPayload!.userId;
    const user = await userRepository.findById(userId);
    if (!user) {
      return reply.status(404).send({ success: false, message: 'User not found' });
    }
    return reply.send({ success: true, data: { user } });
  });

  // PATCH /api/v1/profile/me
  fastify.patch('/me', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userPayload!.userId;
    const parsed = updateProfileSchema.parse(request.body);
    const updated = await userService.updateProfile(userId, parsed);

    await eventService.publish({
      eventType: 'USER_PROFILE_UPDATED',
      userId,
      college: updated.college || undefined,
      department: updated.department || undefined,
      payload: {
        userId,
        updatedFields: Object.keys(parsed),
      },
    });

    return reply.send({ success: true, data: updated });
  });

  // POST /api/v1/profile/me/avatar
  fastify.post('/me/avatar', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userPayload!.userId;
    let buffer: Buffer | null = null;

    // 1. Check if multipart form data was submitted
    if (typeof (request as any).isMultipart === 'function' && (request as any).isMultipart()) {
      try {
        const filePart = await request.file();
        if (filePart) {
          buffer = await filePart.toBuffer();
        }
      } catch (err: any) {
        return reply.status(400).send({
          success: false,
          message: err.message || 'Failed to parse multipart file upload.',
        });
      }
    }

    // 2. Check JSON base64 or binary buffer payload
    if (!buffer) {
      const body: any = request.body || {};
      if (Buffer.isBuffer(body)) {
        buffer = body;
      } else {
        const rawString = body.avatarData || body.image || body.file || body.data;
        if (typeof rawString === 'string') {
          const base64Data = rawString.includes(',') ? rawString.split(',')[1] : rawString;
          try {
            buffer = Buffer.from(base64Data, 'base64');
          } catch {
            buffer = null;
          }
        }
      }
    }

    if (!buffer || buffer.length === 0) {
      return reply.status(400).send({
        success: false,
        message: 'No valid image data provided. Please select an image file (JPEG, PNG, WebP, or GIF).',
      });
    }

    // Maximum 5MB size limit
    const MAX_SIZE = 5 * 1024 * 1024;
    if (buffer.length > MAX_SIZE) {
      return reply.status(400).send({
        success: false,
        message: `Image size exceeds the 5MB limit (${(buffer.length / (1024 * 1024)).toFixed(2)}MB).`,
      });
    }

    // Magic-byte MIME type validation
    const ext = detectImageExtension(buffer);
    if (!ext) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid file signature. Only genuine JPEG, PNG, WebP, and GIF images are accepted.',
      });
    }

    // Save to persistent data/uploads/avatars directory
    const uploadsDir = path.join(getUploadsDir(), 'avatars');
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    // Clean up previous uploaded avatar file if one existed
    const currentUser = await userRepository.findById(userId);
    if (currentUser?.avatarUrl && currentUser.avatarUrl.startsWith('/uploads/avatars/')) {
      const oldFilename = path.basename(currentUser.avatarUrl);
      const oldFilePath = path.join(uploadsDir, oldFilename);
      try {
        await fs.promises.unlink(oldFilePath);
      } catch {
        // Safe to ignore if file was already removed
      }
    }

    // Secure, non-colliding filename
    const uniqueSuffix = crypto.randomBytes(4).toString('hex');
    const filename = `${userId}-${Date.now()}-${uniqueSuffix}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;

    const updatedUser = await (prisma as any).user.update({
      where: { id: userId },
      data: { avatarUrl },
      include: {
        skills: true,
        interests: true,
        badges: { include: { badge: true } },
      },
    });

    await eventService.publish({
      eventType: 'USER_AVATAR_UPDATED',
      userId,
      college: updatedUser.college || undefined,
      department: updatedUser.department || undefined,
      payload: {
        userId,
        avatarUrl,
        sizeBytes: buffer.length,
        format: ext,
      },
    });

    return reply.send({
      success: true,
      message: 'Avatar uploaded and profile updated successfully.',
      data: {
        avatarUrl,
        user: updatedUser,
      },
    });
  });

  // DELETE /api/v1/profile/me/avatar
  fastify.delete('/me/avatar', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userPayload!.userId;
    const user = await userRepository.findById(userId);

    if (user?.avatarUrl && user.avatarUrl.startsWith('/uploads/avatars/')) {
      const filename = path.basename(user.avatarUrl);
      const filePath = path.join(getUploadsDir(), 'avatars', filename);
      try {
        await fs.promises.unlink(filePath);
      } catch {
        // Continue if file was already removed
      }
    }

    const updatedUser = await (prisma as any).user.update({
      where: { id: userId },
      data: { avatarUrl: null },
      include: {
        skills: true,
        interests: true,
        badges: { include: { badge: true } },
      },
    });

    await eventService.publish({
      eventType: 'USER_PROFILE_UPDATED',
      userId,
      college: updatedUser.college || undefined,
      department: updatedUser.department || undefined,
      payload: {
        userId,
        avatarUrl: null,
      },
    });

    return reply.send({
      success: true,
      message: 'Avatar removed successfully.',
      data: {
        avatarUrl: null,
        user: updatedUser,
      },
    });
  });
}
