/**
 * Kafka Producer Service
 * 
 * Attempts to connect to Kafka when running under --profile bigdata.
 * If Kafka is unavailable, silently operates in LOCAL_BUS mode — events stay
 * in the outbox and data lake until Kafka comes back online.
 * 
 * INVARIANT: Student HTTP requests NEVER wait on Kafka. This is purely
 * an async background pipeline.
 */

let kafkaProducer: any = null;
let kafkaStatus: 'CONNECTING' | 'ACTIVE' | 'FALLBACK_LOCAL' = 'CONNECTING';

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'vynk-api';

async function initKafka() {
  if (!process.env.KAFKA_BROKER) {
    // Kafka broker not configured — operate in local bus mode
    kafkaStatus = 'FALLBACK_LOCAL';
    return;
  }

  try {
    const { Kafka } = await import('kafkajs');
    const kafka = new Kafka({
      clientId: KAFKA_CLIENT_ID,
      brokers: [KAFKA_BROKER],
      connectionTimeout: 3000,
      requestTimeout: 5000,
      retry: { initialRetryTime: 300, retries: 3 },
    });

    const producer = kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });

    await producer.connect();
    kafkaProducer = producer;
    kafkaStatus = 'ACTIVE';
    console.log(`[Kafka] Connected to ${KAFKA_BROKER} — streaming mode active`);
  } catch (err) {
    kafkaStatus = 'FALLBACK_LOCAL';
    console.warn(`[Kafka] Could not connect to ${KAFKA_BROKER}, falling back to local data lake mode:`, (err as Error).message);
  }
}

// Attempt connection (non-blocking — don't await at module load)
initKafka().catch(() => { kafkaStatus = 'FALLBACK_LOCAL'; });

export const kafkaProducerService = {
  getStatus: (): { status: typeof kafkaStatus; broker: string } => ({
    status: kafkaStatus,
    broker: KAFKA_BROKER,
  }),

  /**
   * Produce a message to Kafka topic.
   * Returns true if published, false if fell back to local mode.
   */
  async produce(topic: string, key: string, value: object): Promise<boolean> {
    if (kafkaStatus !== 'ACTIVE' || !kafkaProducer) {
      return false;
    }

    try {
      await kafkaProducer.send({
        topic,
        messages: [
          {
            key,
            value: JSON.stringify(value),
            timestamp: String(Date.now()),
          },
        ],
      });
      return true;
    } catch (err) {
      console.error(`[Kafka] Produce failed for topic ${topic}:`, (err as Error).message);
      kafkaStatus = 'FALLBACK_LOCAL';
      return false;
    }
  },

  async disconnect(): Promise<void> {
    if (kafkaProducer) {
      try {
        await kafkaProducer.disconnect();
      } catch (_) {}
    }
  },
};
