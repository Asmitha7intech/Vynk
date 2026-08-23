import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository';
import { prisma } from '@vynk/database';
import { Role } from '@vynk/types';

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
        college: input.college,
        department: input.department,
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

    return user;
  },
};
