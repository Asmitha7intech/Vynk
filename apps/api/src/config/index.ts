import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('vynk_super_secret_jwt_access_key_2026_dev'),
  JWT_REFRESH_SECRET: z.string().min(16).default('vynk_super_secret_jwt_refresh_key_2026_dev'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  WEB_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('postgresql://vynk_admin:vynk_secret_password@localhost:5432/vynk_db?schema=public'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  STORAGE_PROVIDER: z.enum(['local', 's3', 'r2']).default('local'),
  STORAGE_BUCKET: z.string().default('vynk-media'),
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
  COOKIE_SECRET: z.string().min(16).default('vynk_secure_cookie_encryption_key_2026'),
  OWNER_EMAIL: z.string().email().default('asmitha7intech@gmail.com'),
  OWNER_USERNAME: z.string().default('asmitha'),
  OWNER_DISPLAY_NAME: z.string().default('Asmitha S'),
  OWNER_INITIAL_PASSWORD: z.string().min(10).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment configuration validation failed:');
  console.error(parsed.error.format());
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    process.exit(1);
  }
}

const env = parsed.success ? parsed.data : envSchema.parse({});

// Fail fast in staging or production if fallback development secrets are used
if (env.NODE_ENV === 'production' || env.NODE_ENV === 'staging') {
  if (env.JWT_SECRET.includes('_dev') || env.JWT_REFRESH_SECRET.includes('_dev')) {
    console.error('❌ FATAL: Cannot run in production/staging with default development JWT secrets.');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('❌ FATAL: DATABASE_URL must be explicitly configured in production/staging.');
    process.exit(1);
  }
}

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
  cookieSecret: env.COOKIE_SECRET,
  owner: {
    email: env.OWNER_EMAIL,
    username: env.OWNER_USERNAME,
    displayName: env.OWNER_DISPLAY_NAME,
    initialPassword: env.OWNER_INITIAL_PASSWORD,
  },
  storage: {
    provider: env.STORAGE_PROVIDER,
    bucket: env.STORAGE_BUCKET,
    endpoint: env.STORAGE_ENDPOINT,
    accessKey: env.STORAGE_ACCESS_KEY,
    secretKey: env.STORAGE_SECRET_KEY,
  },
};
