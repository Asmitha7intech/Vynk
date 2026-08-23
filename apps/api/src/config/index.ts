import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'vynk_super_secret_jwt_access_key_2026_dev',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'vynk_super_secret_jwt_refresh_key_2026_dev',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  webUrl: process.env.WEB_URL || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://vynk_admin:vynk_secret_password@localhost:5432/vynk_db?schema=public',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
};
