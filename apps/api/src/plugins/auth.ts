import { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { config } from '../config';
import { Role, TokenPayload } from '@vynk/types';

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
      request.userPayload = request.user as TokenPayload;
    } catch (err) {
      reply.status(401).send({
        success: false,
        message: 'Authentication required. Invalid or expired token.',
      });
    }
  });

  fastify.decorate('requireRoles', (allowedRoles: Role[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
        const payload = request.user as TokenPayload;
        request.userPayload = payload;

        if (!allowedRoles.includes(payload.role)) {
          return reply.status(403).send({
            success: false,
            message: `Forbidden. Role '${payload.role}' does not have permission for this resource.`,
          });
        }
      } catch (err) {
        return reply.status(401).send({
          success: false,
          message: 'Authentication required. Invalid or expired token.',
        });
      }
    };
  });
};

export default fp(authPlugin);
