import crypto from 'crypto';
import { prisma } from '@vynk/database';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface IMailProvider {
  sendEmail(options: EmailOptions): Promise<boolean>;
}

// 1. Console / Development Mail Transport
export class ConsoleMailProvider implements IMailProvider {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[MAIL DEV] Simulated email delivery to: ${options.to}`);
      console.log(`[MAIL DEV] Subject: ${options.subject}`);
    }
    return true;
  }
}

// 2. Production SMTP / Resend Mail Transport Adapter
export class ProductionMailProvider implements IMailProvider {
  private apiKey?: string;
  private smtpHost?: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;
    this.smtpHost = process.env.SMTP_HOST;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (this.apiKey) {
      // Resend API HTTP transport
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'VYNK Campus <noreply@vynk.app>',
            to: [options.to],
            subject: options.subject,
            html: options.html || options.text,
            text: options.text,
          }),
        });
        return response.ok;
      } catch (err) {
        console.error('[MAIL ERROR] Failed to deliver via Resend API:', err);
        return false;
      }
    }

    // Fallback to console in development
    return new ConsoleMailProvider().sendEmail(options);
  }
}

export const mailProvider: IMailProvider =
  process.env.NODE_ENV === 'production' && process.env.RESEND_API_KEY
    ? new ProductionMailProvider()
    : new ConsoleMailProvider();

export const mailService = {
  /**
   * Validates whether an email belongs to an allowed academic or institutional domain.
   */
  isAllowedCollegeEmail: (email: string): boolean => {
    if (!email || !email.includes('@')) return false;
    const domain = email.toLowerCase().split('@')[1];

    const configured = process.env.ALLOWED_COLLEGE_DOMAINS
      ? process.env.ALLOWED_COLLEGE_DOMAINS.split(',').map((d) => d.trim().toLowerCase())
      : ['citchennai.net', 'mit.edu', 'stanford.edu', 'berkeley.edu', 'cmu.edu', 'cit.edu.in', 'cit.in', 'gmail.com'];

    // Allow explicitly configured domains, or any standard academic domains (.edu, .edu.in, .ac.in)
    return (
      configured.includes(domain) ||
      domain.endsWith('.edu') ||
      domain.endsWith('.edu.in') ||
      domain.endsWith('.ac.in')
    );
  },

  /**
   * Generates and dispatches a single-use hashed email verification token.
   */
  sendVerificationEmail: async (userId: string, email: string): Promise<string> => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await (prisma as any).emailVerificationToken?.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    const verifyUrl = `${process.env.WEB_URL || 'http://localhost:5173'}/auth/verify-email?token=${rawToken}`;

    await mailProvider.sendEmail({
      to: email,
      subject: 'Verify your VYNK Campus Student Account',
      text: `Welcome to VYNK! Verify your student credentials by visiting: ${verifyUrl}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2>Welcome to VYNK Campus</h2>
          <p>Click below to verify your student account and join the campus network:</p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #7C5CFF; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">Verify Student Email</a>
          <p style="margin-top: 20px; font-size: 12px; color: #888;">This link expires in 24 hours.</p>
        </div>
      `,
    });

    return rawToken;
  },

  /**
   * Verifies an email token and marks user as verified.
   */
  verifyEmail: async (rawToken: string): Promise<boolean> => {
    if (!rawToken) return false;
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const record = await (prisma as any).emailVerificationToken?.findUnique({
      where: { tokenHash },
    });

    if (!record || new Date(record.expiresAt) < new Date()) {
      return false;
    }

    await prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true },
    });

    await (prisma as any).emailVerificationToken?.deleteMany({
      where: { userId: record.userId },
    });

    return true;
  },
};
