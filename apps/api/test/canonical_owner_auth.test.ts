import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { describe, it, expect } from 'vitest';
import { authService } from '../src/services/auth.service';
import { prisma } from '@vynk/database';

describe('Canonical Single-Owner & Administrator Verification', () => {
  it('authenticates canonical owner asmitha7intech@gmail.com with SUPER_ADMIN role and mustChangePassword=true', async () => {
    const owner = await prisma.user.findFirst({
      where: { email: 'asmitha7intech@gmail.com' }
    });
    expect(owner).toBeDefined();
    expect(owner?.email).toBe('asmitha7intech@gmail.com');
    expect(owner?.username).toBe('asmitha');
    expect(owner?.role).toBe('SUPER_ADMIN');
    expect(owner?.mustChangePassword).toBe(true);
    expect(owner?.xp).toBe(0);
    expect(owner?.level).toBe(1);
  });

  it('enforces single-owner policy: no extra or secondary admin accounts exist', async () => {
    const ashCit = await prisma.user.findFirst({ where: { email: 'ash@citchennai.net' } });
    const adminCit = await prisma.user.findFirst({ where: { email: 'admin@citchennai.net' } });

    expect(ashCit).toBeNull();
    expect(adminCit).toBeNull();
  });

  it('verifies owner authentication using the environment initial password', async () => {
    const password = process.env.OWNER_INITIAL_PASSWORD;
    if (!password) throw new Error('OWNER_INITIAL_PASSWORD is not configured in .env');

    const user = await authService.login('asmitha7intech@gmail.com', password);
    expect(user).toBeDefined();
    expect(user.role).toBe('SUPER_ADMIN');
    expect(user.mustChangePassword).toBe(true);
  });
});
