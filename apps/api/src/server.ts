import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from './config';
import authPlugin from './plugins/auth';
import { setupErrorHandler } from './plugins/errorHandler';

// Controllers
import { authController } from './controllers/auth.controller';
import { usersController } from './controllers/users.controller';
import { vynksController } from './controllers/vynks.controller';
import { postsController } from './controllers/posts.controller';
import { crewsController } from './controllers/crews.controller';
import { matchingController } from './controllers/matching.controller';
import { voyagesController } from './controllers/voyages.controller';
import { questsController } from './controllers/quests.controller';
import { gamificationController } from './controllers/gamification.controller';
import { mentorsController } from './controllers/mentors.controller';
import { messagesController } from './controllers/messages.controller';
import { adminController } from './controllers/admin.controller';
import { analyticsController } from './controllers/analytics.controller';
import { eventsController } from './controllers/events.controller';
import { storageController } from './controllers/storage.controller';
import { institutionsController } from './controllers/institutions.controller';
import { bigDataController } from './controllers/bigdata.controller';
import { pulseController } from './controllers/pulse.controller';
import { profileController } from './controllers/profile.controller';
import { directoryController } from './controllers/directory.controller';
import { communitiesController } from './controllers/communities.controller';
import { bigDataLabController } from './controllers/bigdata-lab.controller';
import { notificationsController } from './controllers/notifications.controller';
import multipart from '@fastify/multipart';
import { getUploadsDir } from './utils/paths';
import { getOnlineUserIds } from './realtime/socket';
import path from 'path';
import fs from 'fs';

export async function buildServer() {
    let loggerOption: any = true;
  if (config.nodeEnv === 'development') {
    try {
      require.resolve('pino-pretty');
      loggerOption = {
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      };
    } catch {
      loggerOption = { level: 'info' };
    }
  }

  const fastify = Fastify({
    logger: loggerOption,
    bodyLimit: 50 * 1024 * 1024, // 50MB limit for media and video uploads
  });

  // Global Middleware & Plugins
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return cb(null, true);
      if (config.nodeEnv === 'development' || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await fastify.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });

  await fastify.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit for rich media, videos, and avatars
      files: 1,
    },
  });

  await fastify.register(authPlugin);
  setupErrorHandler(fastify);

  // Health and Readiness Check
  fastify.get('/health', async () => ({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'vynk-api',
  }));

  fastify.get('/ready', async () => ({
    status: 'ready',
    database: 'connected',
  }));

  fastify.get('/health/dependencies', async () => {
    const { outboxWorker } = await import('./services/outbox-worker.service.js');
    const { dataLakeService } = await import('./services/data-lake.service.js');
    const { eventService } = await import('./services/event.service.js');

    const [outboxStats, lakeStats] = await Promise.all([
      eventService.getOutboxStats(),
      Promise.resolve(dataLakeService.getLakeStats()),
    ]);

    const workerStatus = outboxWorker.getStatus();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: { status: 'connected', type: 'PostgreSQL/LocalStore' },
        kafka: workerStatus.kafkaStatus,
        outboxWorker: {
          running: workerStatus.isRunning,
          pollIntervalMs: workerStatus.pollIntervalMs,
          queue: outboxStats,
        },
        dataLake: {
          status: 'active',
          zones: lakeStats,
          root: process.env.DATA_LAKE_ROOT || 'data/lake',
        },
      },
    };
  });

  // Route registration helper for versioning
  const registerApiRoutes = (prefix: string) => {
    fastify.register(authController, { prefix: `${prefix}/auth` });
    fastify.register(usersController, { prefix: `${prefix}/users` });
    fastify.register(vynksController, { prefix: `${prefix}/vynks` });
    fastify.register(postsController, { prefix: `${prefix}/posts` });
    fastify.register(crewsController, { prefix: `${prefix}/crews` });
    fastify.register(matchingController, { prefix: `${prefix}/matching` });
    fastify.register(voyagesController, { prefix: `${prefix}/voyages` });
    fastify.register(questsController, { prefix: `${prefix}/quests` });
    fastify.register(gamificationController, { prefix: `${prefix}/gamification` });
    fastify.register(mentorsController, { prefix: `${prefix}/mentors` });
    fastify.register(messagesController, { prefix: `${prefix}/messages` });
    fastify.register(adminController, { prefix: `${prefix}/admin` });
    fastify.register(analyticsController, { prefix: `${prefix}/analytics` });
    fastify.register(eventsController, { prefix: `${prefix}/events` });
    fastify.register(storageController, { prefix: `${prefix}/storage` });
    fastify.register(institutionsController, { prefix: `${prefix}/institutions` });
    fastify.register(bigDataController, { prefix: `${prefix}/analytics/bigdata` });
    fastify.register(pulseController, { prefix: `${prefix}/pulse` });
    fastify.register(profileController, { prefix: `${prefix}/profile` });
    fastify.register(communitiesController, { prefix: `${prefix}/communities` });
    fastify.register(directoryController, { prefix: `${prefix}/directory` });
    fastify.register(bigDataLabController, { prefix: `${prefix}/bigdata-lab` });
    fastify.register(notificationsController, { prefix: `${prefix}/notifications` });
  };

  // Register both /api/v1 (primary) and /api (alias)
  registerApiRoutes('/api/v1');
  registerApiRoutes('/api');

  // Static uploads file serving with path traversal protection
  fastify.get('/uploads/*', async (request, reply) => {
    const wildcard = (request.params as any)['*'] || '';
    const safePath = path.normalize(wildcard).replace(/^(\.\.[\/\\])+/, '');
    const uploadsDir = getUploadsDir();
    const filePath = path.join(uploadsDir, safePath);

    if (!filePath.startsWith(uploadsDir)) {
      return reply.status(403).send({ success: false, message: 'Forbidden' });
    }

    try {
      const stats = await fs.promises.stat(filePath);
      if (!stats.isFile()) {
        return reply.status(404).send({ success: false, message: 'File not found' });
      }
      const ext = path.extname(filePath).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
      };
      const contentType = mimeMap[ext] || 'application/octet-stream';
      const stream = fs.createReadStream(filePath);
      return reply
        .header('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
        .type(contentType)
        .send(stream);
    } catch {
      return reply.status(404).send({ success: false, message: 'File not found' });
    }
  });

  return fastify;
}
