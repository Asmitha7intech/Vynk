import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  createCommunitySchema,
  updateCommunitySchema,
  communityMembershipActionSchema,
  reviewCommunityMemberSchema,
} from '@vynk/validation';
import { communityService } from '../services/community.service';

export async function communitiesController(fastify: FastifyInstance) {
  // 1. Discover & Search Communities
  fastify.get('/', async (request: FastifyRequest<{
    Querystring: { search?: string; category?: string; page?: string; limit?: string };
  }>, reply: FastifyReply) => {
    // Attempt to extract userId from optional token if present
    let currentUserId: string | undefined;
    try {
      await request.jwtVerify();
      currentUserId = (request.user as any)?.userId;
    } catch {
      // Unauthenticated visitor is allowed
    }

    const { search, category, page, limit } = request.query;
    const result = await communityService.list({
      search,
      category,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      userId: currentUserId,
    });

    return reply.send({ success: true, data: result });
  });

  // 2. Create Community (Auth required)
  fastify.post(
    '/',
    { preHandler: [(fastify as any).authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.userPayload!.userId;
      const parsed = createCommunitySchema.parse(request.body);
      const community = await communityService.create(userId, parsed);

      return reply.status(201).send({
        success: true,
        data: community,
        message: 'Community created successfully! You are now the community administrator.',
      });
    }
  );

  // 3. Get Community Details by ID or Slug
  fastify.get('/:idOrSlug', async (request: FastifyRequest<{ Params: { idOrSlug: string } }>, reply: FastifyReply) => {
    let currentUserId: string | undefined;
    try {
      await request.jwtVerify();
      currentUserId = (request.user as any)?.userId;
    } catch {
      // Unauthenticated visitor
    }

    const community = await communityService.getByIdOrSlug(request.params.idOrSlug, currentUserId);
    if (!community) {
      return reply.status(404).send({ success: false, message: 'Community not found' });
    }

    return reply.send({ success: true, data: community });
  });

  // 4. Update Community Settings (Admin only)
  fastify.patch(
    '/:id',
    { preHandler: [(fastify as any).authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const userId = request.userPayload!.userId;
      const parsed = updateCommunitySchema.parse(request.body);
      const updated = await communityService.update(request.params.id, userId, parsed);

      return reply.send({ success: true, data: updated });
    }
  );

  // 5. Join / Request Membership
  fastify.post(
    '/:id/join',
    { preHandler: [(fastify as any).authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const userId = request.userPayload!.userId;
      const member = await communityService.joinOrRequest(request.params.id, userId);

      return reply.send({
        success: true,
        data: member,
        message: member.status === 'APPROVED' ? 'Joined community successfully!' : 'Membership request submitted.',
      });
    }
  );

  // 6. Leave Community
  fastify.delete(
    '/:id/leave',
    { preHandler: [(fastify as any).authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const userId = request.userPayload!.userId;
      const result = await communityService.leave(request.params.id, userId);

      return reply.send(result);
    }
  );

  // 7. Review Member (Approve / Reject)
  fastify.patch(
    '/:id/members',
    { preHandler: [(fastify as any).authenticate] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const reviewerId = request.userPayload!.userId;
      const parsed = reviewCommunityMemberSchema.parse(request.body);
      const updated = await communityService.reviewMember(
        request.params.id,
        reviewerId,
        parsed.userId,
        parsed.status,
        parsed.role
      );

      return reply.send({ success: true, data: updated });
    }
  );

  // 8. List Community Members
  fastify.get('/:id/members', async (request: FastifyRequest<{
    Params: { id: string };
    Querystring: { status?: string };
  }>, reply: FastifyReply) => {
    const members = await communityService.getMembers(request.params.id, request.query.status || 'APPROVED');
    return reply.send({ success: true, data: members });
  });

  // 9. List Posts inside Community
  fastify.get('/:id/posts', async (request: FastifyRequest<{
    Params: { id: string };
    Querystring: { page?: string; limit?: string };
  }>, reply: FastifyReply) => {
    const page = request.query.page ? parseInt(request.query.page, 10) : 1;
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 20;
    const result = await communityService.getCommunityPosts(request.params.id, page, limit);

    return reply.send({ success: true, data: result });
  });
}
