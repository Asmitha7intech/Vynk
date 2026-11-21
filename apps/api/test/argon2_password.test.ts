import { describe, it, expect } from 'vitest';
import { passwordService } from '../src/services/password.service';
import bcrypt from 'bcryptjs';

describe('Argon2id Password Security & Transparent Rehash Suite', () => {
  it('hashes passwords using Argon2id with standard parameters', async () => {
    const raw = 'SecureVynkPass2026!';
    const hashed = await passwordService.hashPassword(raw);
    expect(hashed.startsWith('$argon2id$')).toBe(true);

    const { isValid, needsRehash } = await passwordService.verifyPassword(hashed, raw);
    expect(isValid).toBe(true);
    expect(needsRehash).toBe(false);
  });

  it('rejects incorrect passwords for Argon2id hashes', async () => {
    const raw = 'CorrectPass123!';
    const hashed = await passwordService.hashPassword(raw);
    const { isValid } = await passwordService.verifyPassword(hashed, 'WrongPassword456!');
    expect(isValid).toBe(false);
  });

  it('transparently detects legacy bcrypt hashes and flags for rehash', async () => {
    const raw = 'LegacyBcryptPass789!';
    const legacyBcryptHash = await bcrypt.hash(raw, 10);
    expect(legacyBcryptHash.startsWith('$2b$')).toBe(true);

    const { isValid, needsRehash } = await passwordService.verifyPassword(legacyBcryptHash, raw);
    expect(isValid).toBe(true);
    expect(needsRehash).toBe(true);
  });
});
