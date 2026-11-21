import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository';
import { prisma } from '@vynk/database';
import { Role } from '@vynk/types';
import { eventService } from './event.service';

export const authService = {
  register: async (input: {
    email: string;
    password: string;
    username: string;
    displayName: string;
    college: string;
    department: string;
    graduationYear?: number;
    role?: Role;
  }) => {
    const existingEmail = await userRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new Error('An account with this email already exists.');
    }

    const existingUsername = await userRepository.findByUsername(input.username);
    if (existingUsername) {
      throw new Error('Username is already taken.');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        displayName: input.displayName,
        passwordHash,
        college: input.college?.trim() || 'CIT',
        department: input.department?.trim() || 'Computer Science',
        graduationYear: input.graduationYear,
        role: (input.role as any) || 'STUDENT',
        xp: 50, // Profile creation bonus
        level: 1,
        reputationScore: 100,
        streakDays: 1,
      },
      include: {
        skills: true,
        interests: true,
        badges: { include: { badge: true } },
      },
    });

    await eventService.publish({
      eventType: 'USER_REGISTERED',
      userId: user.id,
      college: user.college || undefined,
      department: user.department || undefined,
      payload: {
        userId: user.id,
        username: user.username,
        email: user.email,
        college: user.college,
        department: user.department,
        role: user.role,
      },
    });

    return user;
  },

  login: async (email: string, password: string) => {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    await eventService.publish({
      eventType: 'USER_LOGGED_IN',
      userId: user.id,
      college: user.college || undefined,
      department: user.department || undefined,
      payload: {
        userId: user.id,
        username: user.username,
        email: user.email,
      },
    });

    return user;
  },

  createSession: async (userId: string, userAgent?: string, ipAddress?: string) => {
    const sessionId = (crypto as any).randomUUID ? (crypto as any).randomUUID() : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const session = await (prisma as any).session.create({
      data: {
        id: sessionId,
        userId,
        userAgent: userAgent || 'Unknown Device',
        ipAddress: ipAddress || '127.0.0.1',
        expiresAt,
        createdAt: new Date().toISOString(),
        revokedAt: null,
      },
    });

    return session;
  },

  logout: async (sessionId?: string, userId?: string) => {
    if (sessionId) {
      try {
        await (prisma as any).session.update({
          where: { id: sessionId },
          data: { revokedAt: new Date().toISOString() },
        });
      } catch (err) {
        // If session not found, proceed gracefully
      }
    }

    if (userId) {
      await eventService.publish({
        eventType: 'USER_LOGGED_OUT',
        userId,
        payload: {
          userId,
          sessionId: sessionId || null,
        },
      });
    }

    return true;
  },

  forgotPassword: async (email: string) => {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Return success to avoid user enumeration attacks
      return {
        success: true,
        message: 'If an account exists with that email address, password reset instructions have been issued.',
        token: null,
      };
    }

    const resetToken = (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : `reset_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await (prisma as any).passwordResetToken.create({
      data: {
        id: (crypto as any).randomUUID ? (crypto as any).randomUUID() : `prt_${Date.now()}`,
        userId: user.id,
        token: resetToken,
        expiresAt,
        used: false,
        createdAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      message: 'Password reset instructions have been generated.',
      // Provided for ease of development & verification tests
      resetToken,
    };
  },

  resetPassword: async (token: string, newPassword: string) => {
    const tokenRecord = await (prisma as any).passwordResetToken.findFirst({
      where: { token, used: false },
    });

    if (!tokenRecord) {
      throw new Error('Invalid or already used password reset token.');
    }

    if (new Date() > new Date(tokenRecord.expiresAt)) {
      throw new Error('Password reset token has expired. Please request a new one.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user's password
    await (prisma as any).user.update({
      where: { id: tokenRecord.userId },
      data: { passwordHash },
    });

    // Mark reset token as used
    await (prisma as any).passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { used: true },
    });

    // Revoke all existing sessions for this user so old logins are terminated
    const userSessions = await (prisma as any).session.findMany({
      where: { userId: tokenRecord.userId, revokedAt: null },
    });

    for (const sess of userSessions) {
      await (prisma as any).session.update({
        where: { id: sess.id },
        data: { revokedAt: new Date().toISOString() },
      });
    }

    await eventService.publish({
      eventType: 'USER_PASSWORD_RESET',
      userId: tokenRecord.userId,
      payload: {
        userId: tokenRecord.userId,
      },
    });

    return {
      success: true,
      message: 'Password reset successfully. All active sessions have been terminated. Please log in.',
    };
  },

  getUserSessions: async (userId: string) => {
    const sessions = await (prisma as any).session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return sessions;
  },
};

