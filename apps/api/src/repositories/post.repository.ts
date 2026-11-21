import { prisma } from '@vynk/database';

export const postRepository = {
  listFeed: async (limit = 20, cursor?: string, currentUserId?: string) => {
    const posts: any[] = await prisma.post.findMany({
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        voyage: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'asc' },
        },
        reactions: true,
        _count: {
          select: { comments: true, reactions: true },
        },
      },
    });

    return posts.map((post) => {
      const reactions = post.reactions || [];
      const comments = post.comments || [];
      const likesCount = typeof post.likesCount === 'number' && post.likesCount > 0
        ? post.likesCount
        : (post._count?.reactions ?? reactions.length);
      const commentsCount = typeof post.commentsCount === 'number' && post.commentsCount > 0
        ? post.commentsCount
        : (post._count?.comments ?? comments.length);
      const isLikedByMe = currentUserId
        ? reactions.some((r: any) => r.userId === currentUserId)
        : false;

      return {
        ...post,
        likesCount,
        commentsCount,
        isLikedByMe,
      };
    });
  },

  findById: async (id: string, currentUserId?: string) => {
    const post: any = await prisma.post.findUnique({
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
    if (!post) return null;

    const reactions = post.reactions || [];
    const comments = post.comments || [];
    const likesCount = typeof post.likesCount === 'number' && post.likesCount > 0
      ? post.likesCount
      : reactions.length;
    const commentsCount = typeof post.commentsCount === 'number' && post.commentsCount > 0
      ? post.commentsCount
      : comments.length;
    const isLikedByMe = currentUserId
      ? reactions.some((r: any) => r.userId === currentUserId)
      : false;

    return {
      ...post,
      likesCount,
      commentsCount,
      isLikedByMe,
    };
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

  getComments: async (postId: string) => {
    return prisma.comment.findMany({
      where: { postId },
      include: { author: true },
      orderBy: { createdAt: 'asc' },
    });
  },

  deleteComment: async (commentId: string, userId: string, userRole?: string) => {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new Error('Comment not found');
    const isOwner = comment.authorId === userId;
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    if (!isOwner && !isAdmin) {
      const err: any = new Error('Forbidden: You do not own this comment.');
      err.statusCode = 403;
      throw err;
    }

    await prisma.comment.delete({ where: { id: commentId } });
    await prisma.post.update({
      where: { id: comment.postId },
      data: { commentsCount: { decrement: 1 } },
    });

    return { success: true };
  },

  updatePost: async (postId: string, userId: string, data: { content?: string; title?: string; tags?: string[] }, userRole?: string) => {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');
    const isOwner = post.authorId === userId;
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    if (!isOwner && !isAdmin) {
      const err: any = new Error('Forbidden: You do not own this post.');
      err.statusCode = 403;
      throw err;
    }
    return prisma.post.update({
      where: { id: postId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.tags !== undefined ? { tags: data.tags } : {}),
      },
      include: { author: true },
    });
  },

  deletePost: async (postId: string, userId: string, userRole?: string) => {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');
    const isOwner = post.authorId === userId;
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    if (!isOwner && !isAdmin) {
      const err: any = new Error('Forbidden: You do not own this post.');
      err.statusCode = 403;
      throw err;
    }
    await prisma.comment.deleteMany({ where: { postId } });
    await prisma.reaction.deleteMany({ where: { postId } });
    return prisma.post.delete({ where: { id: postId } });
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
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      });
      return { reacted: false, likesCount: Math.max(0, updatedPost.likesCount) };
    } else {
      await prisma.reaction.create({
        data: { postId, userId, emoji },
      });
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      });
      return { reacted: true, likesCount: updatedPost.likesCount };
    }
  },
};
