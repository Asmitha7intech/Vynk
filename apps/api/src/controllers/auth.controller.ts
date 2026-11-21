import { userRepository } from '../repositories/user.repository';
import { prisma } from '@vynk/database';
import { mailService } from '../services/mail.service';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@vynk/validation';
import { authService } from '../services/auth.service';
import { passwordService } from '../services/password.service';
import { config } from '../config';

export async function authController(fastify: FastifyInstance) {
  fastify.post(
    '/register',
    {
      config: {
        rateLimit:
          process.env.NODE_ENV === 'test'
            ? false
            : {
                max: 3,
                timeWindow: 60 * 60 * 1000, // 3 attempts per hour
              },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
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

    reply.setCookie('refreshToken', refreshToken, {
      path: '/',
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

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

  fastify.post(
    '/login',
    {
      config: {
        rateLimit:
          process.env.NODE_ENV === 'test'
            ? false
            : {
                max: 5,
                timeWindow: 15 * 60 * 1000, // 5 attempts per 15 minutes
              },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
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

    reply.setCookie('refreshToken', refreshToken, {
      path: '/',
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

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

      reply.clearCookie('refreshToken', { path: '/' });

      return reply.send({
        success: true,
        message: 'Successfully logged out and session revoked.',
      });
    }
  );

  fastify.post(
    '/change-password',
    { preHandler: [(fastify as any).authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.userPayload?.userId;
      if (!userId) {
        return reply.status(401).send({ success: false, message: 'Authentication required.' });
      }

      const { currentPassword, newPassword } = (request.body as any) || {};

      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 10) {
        return reply.status(400).send({
          success: false,
          message: 'New password must be at least 10 characters long.',
        });
      }

      // Check password complexity (requires uppercase, lowercase, number, special character)
      const hasUpper = /[A-Z]/.test(newPassword);
      const hasLower = /[a-z]/.test(newPassword);
      const hasNumber = /[0-9]/.test(newPassword);
      const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

      if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        return reply.status(400).send({
          success: false,
          message: 'Password must contain uppercase, lowercase, numbers, and symbols.',
        });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return reply.status(404).send({ success: false, message: 'User not found.' });
      }

      // Verify current password if provided or if mustChangePassword is false
      if (!user.mustChangePassword && currentPassword) {
        const { isValid } = await passwordService.verifyPassword(user.passwordHash, currentPassword);
        if (!isValid) {
          return reply.status(400).send({ success: false, message: 'Current password is incorrect.' });
        }
      }

      const newPasswordHash = await passwordService.hashPassword(newPassword);
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
          mustChangePassword: false,
        },
      });

      return reply.send({
        success: true,
        message: 'Password changed successfully.',
        data: { user: updatedUser },
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
    const incomingToken = (request.cookies as any)?.refreshToken || (request.body as any)?.refreshToken;
    if (!incomingToken) {
      return reply.status(401).send({
        success: false,
        message: 'Authentication required. Missing refresh token in cookie or body.',
      });
    }

    try {
      const decoded: any = fastify.jwt.verify(incomingToken);
      const session = await (prisma as any).session.findUnique({
        where: { id: decoded.sessionId },
      });

      // Token reuse detection: if presented session was already revoked, revoke whole family!
      if (!session || session.isRevoked || session.revokedAt) {
        if (session?.familyId) {
          await authService.revokeSessionFamily(session.familyId);
        }
        reply.clearCookie('refreshToken', { path: '/' });
        return reply.status(401).send({
          success: false,
          code: 'TOKEN_REUSE_DETECTED',
          message: 'Security alert: Refresh token reuse detected. All sessions in this family revoked.',
        });
      }

      // Rotate session: revoke old session and issue new rotated session in same family
      await authService.revokeSession(decoded.userId, session.id);

      const rotatedSession = await authService.createSession(
        decoded.userId,
        request.headers['user-agent'],
        request.ip,
        session.familyId
      );

      const dbUser = await userRepository.findById(decoded.userId);
      const role = dbUser?.role || decoded.role;
      const tokenPayload = {
        userId: decoded.userId,
        email: dbUser?.email || decoded.email,
        username: dbUser?.username || decoded.username,
        role,
        sessionId: rotatedSession.id,
      };

      const accessToken = fastify.jwt.sign(tokenPayload, { expiresIn: config.jwtAccessExpiresIn });
      const newRefreshToken = fastify.jwt.sign(tokenPayload, { expiresIn: config.jwtRefreshExpiresIn });

      reply.setCookie('refreshToken', newRefreshToken, {
        path: '/',
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
      });

      return reply.send({
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: config.jwtAccessExpiresIn,
          sessionId: rotatedSession.id,
        },
      });
    } catch (err: any) {
      console.error('Refresh error:', err?.message || err);
      reply.clearCookie('refreshToken', { path: '/' });
      return reply.status(401).send({
        success: false,
        message: 'Invalid or expired refresh token.',
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
    const sessions = await authService.listSessions(userId);
    return reply.send({
      success: true,
      data: { sessions },
    });
  });

  fastify.delete('/sessions/:id', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = request.userPayload!.userId;
    await authService.revokeSession(userId, request.params.id);
    return reply.send({
      success: true,
      message: 'Session revoked successfully.',
    });
  });

  fastify.post('/sessions/revoke-all', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userPayload!.userId;
    const currentSessionId = request.userPayload!.sessionId;
    await authService.revokeAllSessions(userId, currentSessionId);
    return reply.send({
      success: true,
      message: 'All other sessions have been revoked.',
    });
  });

  fastify.post('/verify-email', async (request: FastifyRequest, reply: FastifyReply) => {
    const { token } = (request.body as any) || {};
    if (!token) {
      return reply.status(400).send({
        success: false,
        message: 'Verification token is required.',
      });
    }
    const success = await mailService.verifyEmail(token);
    if (!success) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid or expired email verification token.',
      });
    }
    return reply.send({
      success: true,
      message: 'Email successfully verified. Welcome to VYNK!',
    });
  });

  fastify.post('/resend-verification', { preHandler: [(fastify as any).authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.userPayload!.userId;
    const user = await userRepository.findById(userId);
    if (!user) {
      return reply.status(404).send({ success: false, message: 'User not found.' });
    }
    if (user.emailVerified) {
      return reply.send({ success: true, message: 'Email is already verified.' });
    }
    await mailService.sendVerificationEmail(user.id, user.email);
    return reply.send({
      success: true,
      message: 'Verification email resent successfully.',
    });
  });
}
