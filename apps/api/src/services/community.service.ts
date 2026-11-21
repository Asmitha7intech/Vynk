import { prisma } from '@vynk/database';
import { eventService } from './event.service';
import crypto from 'crypto';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export const communityService = {
  create: async (userId: string, data: {
    name: string;
    description: string;
    category: string;
    tags?: string[];
    avatarUrl?: string;
    bannerUrl?: string;
    isPrivate?: boolean;
  }) => {
    let baseSlug = slugify(data.name);
    let slug = baseSlug;
    let counter = 1;

    // Check slug uniqueness
    while (await prisma.community.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const communityId = (crypto as any).randomUUID ? (crypto as any).randomUUID() : `comm_${Date.now()}`;

    const community = await prisma.community.create({
      data: {
        id: communityId,
        name: data.name,
        slug,
        description: data.description,
        category: data.category,
        tags: data.tags || [],
        avatarUrl: data.avatarUrl || null,
        bannerUrl: data.bannerUrl || null,
        isPrivate: data.isPrivate || false,
        creatorId: userId,
      },
      include: {
        creator: true,
        _count: { select: { members: true, posts: true } },
      },
    });

    // Auto-join creator as APPROVED ADMIN
    const memberId = (crypto as any).randomUUID ? (crypto as any).randomUUID() : `cm_${Date.now()}`;
    await prisma.communityMember.create({
      data: {
        id: memberId,
        communityId: community.id,
        userId,
        role: 'ADMIN',
        status: 'APPROVED',
      },
    });

    await eventService.publish({
      eventType: 'COMMUNITY_CREATED',
      userId,
      payload: {
        communityId: community.id,
        name: community.name,
        slug: community.slug,
        category: community.category,
      },
    });

    return community;
  },

  update: async (communityId: string, userId: string, data: Partial<{
    name: string;
    description: string;
    category: string;
    tags: string[];
    avatarUrl: string;
    bannerUrl: string;
    isPrivate: boolean;
  }>) => {
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      include: { members: true },
    });

    if (!community) {
      throw new Error('Community not found');
    }

    // Must be creator or approved ADMIN
    const isAdmin =
      community.creatorId === userId ||
      community.members.some((m) => m.userId === userId && m.role === 'ADMIN' && m.status === 'APPROVED');

    if (!isAdmin) {
      throw new Error('Unauthorized. Only community admins can modify community settings.');
    }

    return prisma.community.update({
      where: { id: communityId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description && { description: data.description }),
        ...(data.category && { category: data.category }),
        ...(data.tags && { tags: data.tags }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl || null }),
        ...(data.bannerUrl !== undefined && { bannerUrl: data.bannerUrl || null }),
        ...(data.isPrivate !== undefined && { isPrivate: data.isPrivate }),
      },
      include: {
        creator: true,
        _count: { select: { members: true, posts: true } },
      },
    });
  },

  getByIdOrSlug: async (identifier: string, currentUserId?: string) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    const community = await prisma.community.findFirst({
      where: isUuid ? { id: identifier } : { slug: identifier },
      include: {
        creator: true,
        _count: { select: { members: true, posts: true } },
      },
    });

    if (!community) return null;

    let userMembership = null;
    if (currentUserId) {
      userMembership = await prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: community.id,
            userId: currentUserId,
          },
        },
      });
    }

    return {
      ...community,
      currentUserMembership: userMembership,
    };
  },

  list: async (params: {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
    userId?: string;
  }) => {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 50);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.category && params.category !== 'ALL') {
      where.category = { equals: params.category, mode: 'insensitive' };
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
        { tags: { has: q.toLowerCase() } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.community.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: true,
          _count: { select: { members: true, posts: true } },
        },
      }),
      prisma.community.count({ where }),
    ]);

    // Attach user membership if requested
    let enrichedItems = items;
    if (params.userId) {
      const memberships = await prisma.communityMember.findMany({
        where: {
          userId: params.userId,
          communityId: { in: items.map((c) => c.id) },
        },
      });
      const memberMap = new Map(memberships.map((m) => [m.communityId, m]));
      enrichedItems = items.map((c) => ({
        ...c,
        currentUserMembership: memberMap.get(c.id) || null,
      }));
    }

    return {
      items: enrichedItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  joinOrRequest: async (communityId: string, userId: string) => {
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new Error('Community not found');
    }

    const existingMember = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: { communityId, userId },
      },
    });

    if (existingMember) {
      if (existingMember.status === 'APPROVED') {
        throw new Error('You are already an approved member of this community.');
      }
      if (existingMember.status === 'PENDING') {
        throw new Error('Your membership request is currently pending approval.');
      }
      // Re-apply if previously rejected
      return prisma.communityMember.update({
        where: { id: existingMember.id },
        data: {
          status: community.isPrivate ? 'PENDING' : 'APPROVED',
          joinedAt: new Date(),
        },
      });
    }

    const memberId = (crypto as any).randomUUID ? (crypto as any).randomUUID() : `cm_${Date.now()}`;
    const initialStatus = community.isPrivate ? 'PENDING' : 'APPROVED';

    const member = await prisma.communityMember.create({
      data: {
        id: memberId,
        communityId,
        userId,
        role: 'MEMBER',
        status: initialStatus,
      },
      include: {
        user: true,
        community: true,
      },
    });

    await eventService.publish({
      eventType: initialStatus === 'APPROVED' ? 'COMMUNITY_JOINED' : 'COMMUNITY_REQUESTED',
      userId,
      payload: {
        communityId,
        status: initialStatus,
      },
    });

    return member;
  },

  join: async (a: string, b: string) => {
    // Detect which is communityId and which is userId
    const comm = await prisma.community.findUnique({ where: { id: a } });
    if (comm) {
      return communityService.joinOrRequest(a, b);
    }
    return communityService.joinOrRequest(b, a);
  },

  leave: async (a: string, b: string) => {
    const comm = await prisma.community.findUnique({ where: { id: a } });
    const communityId = comm ? a : b;
    const userId = comm ? b : a;

    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new Error('Community not found');
    }

    const member = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: { communityId, userId },
      },
    });

    if (!member) {
      throw new Error('You are not a member of this community.');
    }

    // Check if creator is the only admin
    if (community.creatorId === userId) {
      const otherAdmins = await prisma.communityMember.count({
        where: {
          communityId,
          role: 'ADMIN',
          status: 'APPROVED',
          userId: { not: userId },
        },
      });
      if (otherAdmins === 0) {
        throw new Error('As the creator and sole admin, please designate another admin before leaving.');
      }
    }

    await prisma.communityMember.delete({
      where: { id: member.id },
    });

    return { success: true, message: 'Successfully left community.' };
  },

  reviewMember: async (communityId: string, reviewerId: string, targetUserId: string, status: 'APPROVED' | 'REJECTED', role?: string) => {
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new Error('Community not found');
    }

    const reviewerMember = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId: reviewerId } },
    });

    const isAuthorized =
      community.creatorId === reviewerId ||
      (reviewerMember && (reviewerMember.role === 'ADMIN' || reviewerMember.role === 'MODERATOR') && reviewerMember.status === 'APPROVED');

    if (!isAuthorized) {
      throw new Error('Unauthorized. Only community moderators or admins can review members.');
    }

    const targetMember = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId: targetUserId } },
    });

    if (!targetMember) {
      throw new Error('Membership record not found for this user.');
    }

    return prisma.communityMember.update({
      where: { id: targetMember.id },
      data: {
        status,
        ...(role && { role }),
      },
      include: {
        user: true,
      },
    });
  },

  getMembers: async (communityId: string, status = 'APPROVED') => {
    return prisma.communityMember.findMany({
      where: {
        communityId,
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            headline: true,
            department: true,
            college: true,
            xp: true,
            level: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  },

  getCommunityPosts: async (communityId: string, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.post.findMany({
        where: { communityId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              headline: true,
              department: true,
              college: true,
            },
          },
          reactions: true,
          _count: { select: { comments: true, reactions: true } },
        },
      }),
      prisma.post.count({ where: { communityId } }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },
};
