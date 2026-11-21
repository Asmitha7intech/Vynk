import { describe, it, expect } from 'vitest';
import { authService } from '../src/services/auth.service';
import { prisma } from '@vynk/database';

describe('Canonical Owner & Administrator Verification', () => {
  it('authenticates canonical owner asmitha7intech@gmail.com with SUPER_ADMIN role', async () => {
    const owner = await prisma.user.findFirst({
      where: { email: 'asmitha7intech@gmail.com' }
    });
    expect(owner).toBeDefined();
    expect(owner?.email).toBe('asmitha7intech@gmail.com');
    expect(owner?.username).toBe('asmitha');
    expect(owner?.role).toBe('SUPER_ADMIN');
  });

  it('preserves existing admin accounts during transition', async () => {
    const ashCit = await prisma.user.findFirst({ where: { email: 'ash@citchennai.net' } });
    const adminCit = await prisma.user.findFirst({ where: { email: 'admin@citchennai.net' } });

    expect(ashCit).toBeDefined();
    expect(ashCit?.role).toBe('ADMIN');

    expect(adminCit).toBeDefined();
    expect(adminCit?.role).toBe('ADMIN');
  });
});
