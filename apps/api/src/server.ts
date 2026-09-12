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
  });

  // Global Middleware & Plugins
  await fastify.register(cors, {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await fastify.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
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
  };

  // Register both /api/v1 (primary) and /api (alias)
  registerApiRoutes('/api/v1');
  registerApiRoutes('/api');

  return fastify;
}
