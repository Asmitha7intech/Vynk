const fs = require('fs');
const path = require('path');

// 1. apps/api/src/services/institutions.service.ts
const instServicePath = path.resolve(__dirname, '../apps/api/src/services/institutions.service.ts');
const instServiceContent = `
import { prisma } from '@vynk/database';

export const institutionsService = {
  listApproved: async () => {
    return prisma.institution.findMany({
      where: { isApproved: true },
      orderBy: { name: 'asc' },
    });
  },

  verifyCampusEmail: async (userId: string, institutionId: string, campusEmail: string) => {
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new Error('Institution not found');
    }

    const emailDomain = campusEmail.split('@')[1]?.toLowerCase();
    const isDomainMatch = institution.domains.some((d) => d.toLowerCase() === emailDomain);

    if (!isDomainMatch) {
      throw new Error(\`Email '\${campusEmail}' does not belong to verified domains for \${institution.name}\`);
    }

    const verification = await prisma.studentVerification.upsert({
      where: { userId },
      update: {
        institutionId,
        campusEmail,
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
      },
      create: {
        userId,
        institutionId,
        campusEmail,
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
      },
    });

    // Update User college and emailVerified flag
    await prisma.user.update({
      where: { id: userId },
      data: {
        college: institution.name,
        emailVerified: true,
      },
    });

    return verification;
  },
};
`;

// 2. apps/api/src/controllers/institutions.controller.ts
const instCtrlPath = path.resolve(__dirname, '../apps/api/src/controllers/institutions.controller.ts');
const instCtrlContent = `
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
`;

// 3. apps/api/src/repositories/post.repository.ts (Add cursor-based feed support)
const postRepoPath = path.resolve(__dirname, '../apps/api/src/repositories/post.repository.ts');
const postRepoContent = `
import { prisma } from '@vynk/database';

export const postRepository = {
  listFeed: async (limit = 20, cursor?: string) => {
    return prisma.post.findMany({
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        voyage: true,
        _count: {
          select: { comments: true, reactions: true },
        },
      },
    });
  },

  findById: async (id: string) => {
    return prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
        voyage: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'asc' },
        },
        reactions: true,
      },
    });
  },

  createPost: async (authorId: string, data: any) => {
    return prisma.post.create({
      data: {
        authorId,
        type: data.type || 'TEXT',
        title: data.title || null,
        content: data.content,
        mediaUrls: data.mediaUrls || [],
        tags: data.tags || [],
        voyageId: data.voyageId || null,
      },
      include: {
        author: true,
        voyage: true,
      },
    });
  },

  addComment: async (postId: string, authorId: string, content: string, parentId?: string) => {
    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId,
        content,
        parentId: parentId || null,
      },
      include: { author: true },
    });

    await prisma.post.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } },
    });

    return comment;
  },

  toggleReaction: async (postId: string, userId: string, emoji = '🔥') => {
    const existing = await prisma.reaction.findUnique({
      where: {
        postId_userId_emoji: { postId, userId, emoji },
      },
    });

    if (existing) {
      await prisma.reaction.delete({
        where: { id: existing.id },
      });
      await prisma.post.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      });
      return { reacted: false };
    } else {
      await prisma.reaction.create({
        data: { postId, userId, emoji },
      });
      await prisma.post.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      });
      return { reacted: true };
    }
  },
};
`;

fs.writeFileSync(instServicePath, instServiceContent.trim() + '\n', 'utf8');
fs.writeFileSync(instCtrlPath, instCtrlContent.trim() + '\n', 'utf8');
fs.writeFileSync(postRepoPath, postRepoContent.trim() + '\n', 'utf8');
console.log('Created institutions service/controller and updated postRepository');
