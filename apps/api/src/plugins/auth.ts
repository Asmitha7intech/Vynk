import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { config } from '../config';
import { Role, TokenPayload } from '@vynk/types';

import { prisma } from '@vynk/database';

declare module 'fastify' {
  interface FastifyRequest {
    userPayload?: TokenPayload;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(jwt, {
    secret: config.jwtSecret,
  });

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const payload = request.user as TokenPayload;

      if (payload.sessionId) {
        try {
          const session = await (prisma as any).session?.findUnique({
            where: { id: payload.sessionId },
          });

          if (session && session.revokedAt) {
            return reply.status(401).send({
              success: false,
              message: 'Session has been revoked or expired. Please sign in again.',
              code: 'SESSION_REVOKED',
            });
          }
        } catch {
          // If session query fails due to temporary connection check, allow token validity to stand
        }
      }

      request.userPayload = payload;
    } catch (err: any) {
      const isMissingHeader = err?.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER';
      return reply.status(401).send({
        success: false,
        message: isMissingHeader
          ? 'Authentication required. Missing authorization token.'
          : 'Authentication required. Invalid or expired token.',
        code: err?.code || 'UNAUTHORIZED',
      });
    }
  });

  fastify.decorate('requireRoles', (allowedRoles: Role[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        const payload = request.user as TokenPayload;

        if (payload.sessionId) {
          try {
            const session = await (prisma as any).session?.findUnique({
              where: { id: payload.sessionId },
            });

            if (session && session.revokedAt) {
              return reply.status(401).send({
                success: false,
                message: 'Session has been revoked or expired. Please sign in again.',
                code: 'SESSION_REVOKED',
              });
            }
          } catch {
            // Allow token to stand if session lookup encounters temporary glitch
          }
        }

        request.userPayload = payload;

        if (!allowedRoles.includes(payload.role)) {
          return reply.status(403).send({
            success: false,
            message: `Forbidden. Role '${payload.role}' does not have permission for this resource.`,
            code: 'FORBIDDEN',
          });
        }
      } catch (err: any) {
        const isMissingHeader = err?.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER';
        return reply.status(401).send({
          success: false,
          message: isMissingHeader
            ? 'Authentication required. Missing authorization token.'
            : 'Authentication required. Invalid or expired token.',
          code: err?.code || 'UNAUTHORIZED',
        });
      }
    };
  });
};

export default fp(authPlugin);
