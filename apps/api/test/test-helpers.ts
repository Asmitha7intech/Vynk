import crypto from 'crypto';

/**
 * Generates a compliant, strong dynamic password for test accounts.
 * Meets requirements: min 10 characters, upper & lowercase letters, numbers, and symbols.
 */
export function generateTestPassword(): string {
  const rand = crypto.randomBytes(6).toString('hex');
  return `Vynk#${rand}!9`;
}
