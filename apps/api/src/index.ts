import { buildServer } from './server';
import { setupSocketServer } from './realtime/socket';
import { config } from './config';
import { TokenPayload } from '@vynk/types';

async function start() {
  const fastify = await buildServer();

  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`🚀 VYNK API Server running on port ${config.port} [${config.nodeEnv}]`);

    // Attach Socket.IO to Fastify's raw Node http server
    const io = setupSocketServer(fastify.server, (token) => fastify.jwt.verify(token) as TokenPayload);
    console.log(`⚡ VYNK Realtime Gateway active with Socket.IO`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
