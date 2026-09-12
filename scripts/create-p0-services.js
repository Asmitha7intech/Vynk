const fs = require('fs');
const path = require('path');

// 1. apps/api/src/config/index.ts (Environment validation with Zod)
const configPath = path.resolve(__dirname, '../apps/api/src/config/index.ts');
const configContent = `
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('vynk_super_secret_jwt_access_key_2026_dev'),
  JWT_REFRESH_SECRET: z.string().min(16).default('vynk_super_secret_jwt_refresh_key_2026_dev'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  WEB_URL: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().default('postgresql://vynk_admin:vynk_secret_password@localhost:5432/vynk_db?schema=public'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  STORAGE_PROVIDER: z.enum(['local', 's3', 'r2']).default('local'),
  STORAGE_BUCKET: z.string().default('vynk-media'),
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment configuration validation failed:');
  console.error(parsed.error.format());
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

const env = parsed.success ? parsed.data : envSchema.parse({});

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  jwtSecret: env.JWT_SECRET,
  jwtRefreshSecret: env.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
  jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  webUrl: env.WEB_URL,
  databaseUrl: env.DATABASE_URL,
  redisUrl: env.REDIS_URL,
  storage: {
    provider: env.STORAGE_PROVIDER,
    bucket: env.STORAGE_BUCKET,
    endpoint: env.STORAGE_ENDPOINT,
    accessKey: env.STORAGE_ACCESS_KEY,
    secretKey: env.STORAGE_SECRET_KEY,
  },
};
`;

// 2. apps/api/src/services/storage.service.ts (Object Storage Abstraction)
const storageServicePath = path.resolve(__dirname, '../apps/api/src/services/storage.service.ts');
const storageServiceContent = `
import { config } from '../config';
import crypto from 'crypto';

export interface UploadRequest {
  filename: string;
  contentType: string;
  sizeBytes: number;
  folder?: 'avatars' | 'voyages' | 'posts' | 'evidence';
}

export interface UploadResponse {
  uploadUrl: string;
  publicUrl: string;
  fileKey: string;
  expiresInSeconds: number;
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'video/mp4',
];

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export const storageService = {
  getSignedUploadUrl: async (req: UploadRequest): Promise<UploadResponse> => {
    if (!ALLOWED_MIME_TYPES.includes(req.contentType)) {
      throw new Error(\`Unsupported file type '\${req.contentType}'. Allowed types: JPEG, PNG, WebP, GIF, PDF, MP4\`);
    }

    if (req.sizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new Error('File size exceeds the 25MB limit.');
    }

    const folder = req.folder || 'posts';
    const randomHex = crypto.randomBytes(8).toString('hex');
    const sanitizedFilename = req.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = \`\${folder}/\${Date.now()}-\${randomHex}-\${sanitizedFilename}\`;

    // Local / S3 / Cloudflare R2 abstraction
    if (config.storage.provider === 'r2' || config.storage.provider === 's3') {
      const publicUrl = \`https://\${config.storage.bucket}.\${config.storage.endpoint || 'r2.cloudflarestorage.com'}/\${fileKey}\`;
      return {
        uploadUrl: publicUrl, // In prod: generate pre-signed S3 PUT URL via @aws-sdk/s3-request-presigner
        publicUrl,
        fileKey,
        expiresInSeconds: 900,
      };
    }

    // Local development fallback
    const publicUrl = \`/uploads/\${fileKey}\`;
    return {
      uploadUrl: \`/api/v1/storage/upload?key=\${encodeURIComponent(fileKey)}\`,
      publicUrl,
      fileKey,
      expiresInSeconds: 900,
    };
  },
};
`;

// 3. apps/api/src/services/queue.service.ts (Background Worker Queue Abstraction)
const queueServicePath = path.resolve(__dirname, '../apps/api/src/services/queue.service.ts');
const queueServiceContent = `
import { config } from '../config';

export type JobType =
  | 'SEND_EMAIL_NOTIFICATION'
  | 'PROCESS_MEDIA_THUMBNAIL'
  | 'RECALCULATE_LEADERBOARDS'
  | 'GENERATE_EMBEDDINGS'
  | 'AGGREGATE_ANALYTICS_ROLLUP';

export interface QueueJob<T = any> {
  id: string;
  type: JobType;
  data: T;
  createdAt: Date;
}

export const queueService = {
  dispatch: async <T>(type: JobType, data: T): Promise<{ jobId: string; status: 'QUEUED' | 'PROCESSED' }> => {
    const jobId = \`job_\${Date.now()}_\${Math.random().toString(36).substring(2, 8)}\`;

    // Async execution simulation / Redis queue push
    setImmediate(async () => {
      try {
        if (config.nodeEnv === 'development') {
          console.log(\`[Worker Queue] Processing background job \${jobId} (\${type})\`);
        }
        // Worker handler branches:
        switch (type) {
          case 'SEND_EMAIL_NOTIFICATION':
            // Dispatches via Resend/SendGrid/SES
            break;
          case 'AGGREGATE_ANALYTICS_ROLLUP':
            // Aggregates DAU/WAU/MAU cohorts
            break;
          case 'RECALCULATE_LEADERBOARDS':
            // Refreshes cache
            break;
          default:
            break;
        }
      } catch (err) {
        console.error(\`[Worker Queue] Job \${jobId} failed:\`, err);
      }
    });

    return { jobId, status: 'QUEUED' };
  },
};
`;

fs.writeFileSync(configPath, configContent.trim() + '\n', 'utf8');
fs.writeFileSync(storageServicePath, storageServiceContent.trim() + '\n', 'utf8');
fs.writeFileSync(queueServicePath, queueServiceContent.trim() + '\n', 'utf8');
console.log('Created config, storageService, and queueService');
