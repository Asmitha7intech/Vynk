import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { registerSchema, loginSchema, refreshTokenSchema } from '@vynk/validation';
import { authService } from '../services/auth.service';
import { config } from '../config';

export async function authController(fastify: FastifyInstance) {
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = registerSchema.parse(request.body);
    const user = await authService.register(parsed);

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = fastify.jwt.sign(tokenPayload, { expiresIn: config.jwtAccessExpiresIn });
    const refreshToken = fastify.jwt.sign(tokenPayload, { expiresIn: config.jwtRefreshExpiresIn });

    return reply.status(201).send({
      success: true,
      data: {
        user,
        accessToken,
        refreshToken,
        expiresIn: config.jwtAccessExpiresIn,
      },
    });
  });

  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = loginSchema.parse(request.body);
    const user = await authService.login(parsed.email, parsed.password);

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = fastify.jwt.sign(tokenPayload, { expiresIn: config.jwtAccessExpiresIn });
    const refreshToken = fastify.jwt.sign(tokenPayload, { expiresIn: config.jwtRefreshExpiresIn });

    return reply.send({
      success: true,
      data: {
        user,
        accessToken,
        refreshToken,
        expiresIn: config.jwtAccessExpiresIn,
      },
    });
  });

  fastify.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = refreshTokenSchema.parse(request.body);
    try {
      const decoded: any = fastify.jwt.verify(parsed.refreshToken);
      const tokenPayload = {
        userId: decoded.userId,
        email: decoded.email,
        username: decoded.username,
        role: decoded.role,
      };

      const accessToken = fastify.jwt.sign(tokenPayload, { expiresIn: config.jwtAccessExpiresIn });
      const newRefreshToken = fastify.jwt.sign(tokenPayload, { expiresIn: config.jwtRefreshExpiresIn });

      return reply.send({
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: config.jwtAccessExpiresIn,
        },
      });
    } catch (err) {
      return reply.status(401).send({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }
  });

  fastify.get('/me', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userPayload!.userId;
    const user = await authService.login(request.userPayload!.email, 'vynkPass123!').catch(() => null);
    return reply.send({
      success: true,
      data: { user },
    });
  });
}
