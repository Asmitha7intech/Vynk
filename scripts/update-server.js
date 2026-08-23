const fs = require('fs');
const path = require('path');

const serverPath = path.resolve(__dirname, '../apps/api/src/server.ts');

const serverContent = `
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from './config';
import authPlugin from './plugins/auth';
import errorHandlerPlugin from './plugins/errorHandler';

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

export async function buildServer() {
  const fastify = Fastify({
    logger: config.nodeEnv === 'development' ? {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    } : true,
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
  await fastify.register(errorHandlerPlugin);

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
    fastify.register(authController, { prefix: \`\${prefix}/auth\` });
    fastify.register(usersController, { prefix: \`\${prefix}/users\` });
    fastify.register(vynksController, { prefix: \`\${prefix}/vynks\` });
    fastify.register(postsController, { prefix: \`\${prefix}/posts\` });
    fastify.register(crewsController, { prefix: \`\${prefix}/crews\` });
    fastify.register(matchingController, { prefix: \`\${prefix}/matching\` });
    fastify.register(voyagesController, { prefix: \`\${prefix}/voyages\` });
    fastify.register(questsController, { prefix: \`\${prefix}/quests\` });
    fastify.register(gamificationController, { prefix: \`\${prefix}/gamification\` });
    fastify.register(mentorsController, { prefix: \`\${prefix}/mentors\` });
    fastify.register(messagesController, { prefix: \`\${prefix}/messages\` });
    fastify.register(adminController, { prefix: \`\${prefix}/admin\` });
    fastify.register(analyticsController, { prefix: \`\${prefix}/analytics\` });
    fastify.register(eventsController, { prefix: \`\${prefix}/events\` });
  };

  // Register both /api/v1 (primary) and /api (alias)
  registerApiRoutes('/api/v1');
  registerApiRoutes('/api');

  return fastify;
}
`;

fs.writeFileSync(serverPath, serverContent.trim() + '\n', 'utf8');
console.log('Updated server.ts with API versioning and all routes');
