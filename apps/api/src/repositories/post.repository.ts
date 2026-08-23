import { prisma } from '@vynk/database';

export const postRepository = {
  getFeed: (limit = 30) => prisma.post.findMany({
    include: {
      author: {
        include: { skills: true },
      },
      voyage: true,
      comments: {
        include: { author: true },
        take: 3,
        orderBy: { createdAt: 'desc' },
      },
      reactions: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  }),

  create: (data: any) => prisma.post.create({
    data,
    include: {
      author: true,
      voyage: true,
    },
  }),

  addComment: (postId: string, authorId: string, content: string, parentId?: string) => prisma.comment.create({
    data: {
      postId,
      authorId,
      content,
      parentId,
    },
    include: { author: true },
  }),

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
