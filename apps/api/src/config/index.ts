import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('vynk_super_secret_jwt_access_key_2026_dev'),
  JWT_REFRESH_SECRET: z.string().min(16).default('vynk_super_secret_jwt_refresh_key_2026_dev'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
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
