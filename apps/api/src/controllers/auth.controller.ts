import { userRepository } from '../repositories/user.repository';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@vynk/validation';
import { authService } from '../services/auth.service';
import { config } from '../config';

export async function authController(fastify: FastifyInstance) {
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = registerSchema.parse(request.body);
    const user = await authService.register(parsed);

    const session = await authService.createSession(
      user.id,
      request.headers['user-agent'],
      request.ip
    );

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      sessionId: session.id,
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
        sessionId: session.id,
      },
    });
  });

  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = loginSchema.parse(request.body);
    const user = await authService.login(parsed.email, parsed.password);

    const session = await authService.createSession(
      user.id,
      request.headers['user-agent'],
      request.ip
    );

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      sessionId: session.id,
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
        sessionId: session.id,
      },
    });
  });

  fastify.post(
    '/logout',
    { preHandler: [(fastify as any).authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const sessionId = request.userPayload?.sessionId;
      const userId = request.userPayload?.userId;

      await authService.logout(sessionId, userId);

      return reply.send({
        success: true,
        message: 'Successfully logged out and session revoked.',
      });
    }
  );

  fastify.post('/forgot-password', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = forgotPasswordSchema.parse(request.body);
    const result = await authService.forgotPassword(parsed.email);
    return reply.send(result);
  });

  fastify.post('/reset-password', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = resetPasswordSchema.parse(request.body);
    const result = await authService.resetPassword(parsed.token, parsed.newPassword);
    return reply.send(result);
  });

  fastify.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = refreshTokenSchema.parse(request.body);
    try {
      const decoded: any = fastify.jwt.verify(parsed.refreshToken);
      const dbUser = await userRepository.findById(decoded.userId);
      const role = dbUser?.role || decoded.role;
      const tokenPayload = {
        userId: decoded.userId,
        email: dbUser?.email || decoded.email,
        username: dbUser?.username || decoded.username,
        role,
        sessionId: decoded.sessionId,
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
    const user = await userRepository.findById(userId);
    return reply.send({
      success: true,
      data: { user },
    });
  });

  fastify.get('/sessions', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userPayload!.userId;
    const sessions = await authService.getUserSessions(userId);
    return reply.send({
      success: true,
      data: { sessions },
    });
  });
}
