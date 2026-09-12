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
