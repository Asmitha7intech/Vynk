import { hash, verify, Algorithm } from '@node-rs/argon2';
import bcrypt from 'bcryptjs';

export const passwordService = {
  /**
   * Hashes a plaintext password using Argon2id with memory-hard parameters.
   */
  hashPassword: async (password: string): Promise<string> => {
    return hash(password, {
      algorithm: Algorithm.Argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,       // 3 iterations
      outputLen: 32,
    });
  },

  /**
   * Verifies password against either Argon2id or legacy bcrypt hash.
   * If legacy bcrypt matches, flags `needsRehash: true` for automatic transparent upgrade.
   */
  verifyPassword: async (
    storedHash: string,
    candidatePassword: string
  ): Promise<{ isValid: boolean; needsRehash: boolean }> => {
    if (!storedHash || !candidatePassword) {
      return { isValid: false, needsRehash: false };
    }

    // 1. Argon2id hash check
    if (storedHash.startsWith('$argon2id$') || storedHash.startsWith('$argon2i$')) {
      try {
        const isValid = await verify(storedHash, candidatePassword);
        return { isValid, needsRehash: false };
      } catch {
        return { isValid: false, needsRehash: false };
      }
    }

    // 2. Legacy bcrypt hash check ($2a$, $2b$, $2y$)
    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
      try {
        const isBcryptMatch = await bcrypt.compare(candidatePassword, storedHash);
        return {
          isValid: isBcryptMatch,
          needsRehash: isBcryptMatch, // If bcrypt matched, flag for immediate transparent rehash to Argon2id
        };
      } catch {
        return { isValid: false, needsRehash: false };
      }
    }

    return { isValid: false, needsRehash: false };
  },
};
