import { buildServer } from './server';
import { setupSocketServer } from './realtime/socket';
import { config } from './config';
import { TokenPayload } from '@vynk/types';
import { outboxWorker } from './services/outbox-worker.service';

async function start() {
  const fastify = await buildServer();

  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`🚀 VYNK API Server running on port ${config.port} [${config.nodeEnv}]`);

    // Attach Socket.IO to Fastify's raw Node http server
    const io = setupSocketServer(fastify.server, (token) => fastify.jwt.verify(token) as TokenPayload);
    console.log(`⚡ VYNK Realtime Gateway active with Socket.IO`);

    // Start async outbox worker (non-blocking, fire-and-forget background process)
    outboxWorker.start();
    console.log(`📬 Event Outbox Worker started — dispatching to Kafka/DataLake`);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`[Shutdown] Received ${signal}, stopping...`);
      outboxWorker.stop();
      await fastify.close();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();

