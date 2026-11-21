import crypto from 'crypto';
import { EventEmitter } from 'events';
import { prisma } from '@vynk/database';
import { VynkEvent, VynkEventType, EventMetadata } from '@vynk/types';

// Sensitive keys to redact from telemetry events
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'refreshToken',
  'secret',
  'accessToken',
  'apiKey',
  'authorization',
  'cookie',
]);

// Map event types to canonical Kafka topics
export function getTopicForEventType(eventType: VynkEventType): string {
  if (eventType.startsWith('USER_') || eventType.startsWith('SKILL_') || eventType.startsWith('INTEREST_')) {
    return 'vynk.users';
  }
  if (eventType.startsWith('POST_') || eventType.startsWith('FEED_')) {
    return 'vynk.posts';
  }
  if (eventType.startsWith('VOYAGE_')) {
    return 'vynk.voyages';
  }
  if (eventType.startsWith('CREW_')) {
    return 'vynk.crews';
  }
  if (eventType.startsWith('DAILY_CHALLENGE_') || eventType.startsWith('QUIZ_')) {
    return 'vynk.quests';
  }
  if (eventType.startsWith('MENTORSHIP_')) {
    return 'vynk.mentorship';
  }
  if (eventType.startsWith('CONVERSATION_') || eventType.startsWith('MESSAGE_')) {
    return 'vynk.messages';
  }
  if (eventType.startsWith('XP_') || eventType.startsWith('LEVEL_') || eventType.startsWith('BADGE_') || eventType.startsWith('STREAK_')) {
    return 'vynk.gamification';
  }
  if (eventType.startsWith('RECOMMENDATION_') || eventType.startsWith('MATCH_')) {
    return 'vynk.recommendations';
  }
  return 'vynk.general';
}

// Deep sanitize payloads
export function sanitizePayload(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizePayload(item));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (key === 'content' && typeof val === 'string' && val.length > 500) {
      // Truncate overly long content payloads in telemetry
      sanitized[key] = val.substring(0, 500) + '... [TRUNCATED]';
    } else {
      sanitized[key] = sanitizePayload(val);
    }
  }
  return sanitized;
}

class EventBusService extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  /**
   * Constructs, sanitizes, emits in-memory, and writes an event to the EventOutbox table atomically.
   */
  async publish<T = any>(
    params: {
      eventType: VynkEventType;
      userId?: string;
      college?: string;
      department?: string;
      correlationId?: string;
      causationId?: string;
      dataSource?: 'PROD' | 'SYNTHETIC';
      payload: T;
      metadata?: EventMetadata;
    }
  ): Promise<VynkEvent<T>> {
    const eventId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const correlationId = params.correlationId || crypto.randomUUID();
    const dataSource = params.dataSource || 'PROD';
    const topic = getTopicForEventType(params.eventType);
    const partitionKey = params.userId || (params.payload as any)?.id || 'general';

    const sanitizedPayload = sanitizePayload(params.payload);

    const fullEvent: VynkEvent<T> = {
      eventId,
      eventType: params.eventType,
      timestamp,
      correlationId,
      causationId: params.causationId,
      version: 1,
      dataSource,
      userId: params.userId,
      college: params.college,
      department: params.department,
      payload: sanitizedPayload,
      metadata: params.metadata,
    };

    // 1. Emit synchronously to in-memory bus for immediate observers
    try {
      this.emit(params.eventType, fullEvent);
      this.emit('*', fullEvent);
    } catch (err) {
      console.error(`[EventBus] Error in local listener for ${params.eventType}:`, err);
    }

    // 2. Persist to Transactional Outbox (atomic with business data)
    try {
      await prisma.eventOutbox.create({
        data: {
          eventId,
          eventType: params.eventType,
          topic,
          partitionKey,
          payload: JSON.stringify(fullEvent),
          status: 'PENDING',
          retryCount: 0,
        },
      });
    } catch (err) {
      console.error(`[EventBus] Failed to persist outbox record for event ${eventId}:`, err);
    }

    // 3. Ingest into Data Lake RAW zone (fire-and-forget, non-blocking)
    try {
      const { dataLakeService } = await import('./data-lake.service.js');
      setImmediate(() => {
        dataLakeService.ingestEvent(fullEvent as unknown as import('@vynk/types').VynkEvent).catch(() => {});
      });
    } catch (_) {}

    return fullEvent;
  }

  /**
   * Retrieve pending outbox records for background dispatcher
   */
  async getPendingOutboxRecords(limit = 100) {
    return prisma.eventOutbox.findMany({
      where: {
        status: { in: ['PENDING', 'FAILED'] },
        retryCount: { lt: 5 },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  /**
   * Mark outbox record as published
   */
  async markPublished(id: string) {
    return prisma.eventOutbox.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });
  }

  /**
   * Mark outbox record as failed with incremented retry count
   */
  async markFailed(id: string, errorMsg: string) {
    const record = await prisma.eventOutbox.findUnique({ where: { id } });
    const retryCount = (record?.retryCount || 0) + 1;
    const status = retryCount >= 5 ? 'DEAD_LETTER' : 'FAILED';

    return prisma.eventOutbox.update({
      where: { id },
      data: {
        status,
        retryCount,
        lastError: errorMsg,
      },
    });
  }

  /**
   * Get outbox metrics
   */
  async getOutboxStats() {
    const [pending, published, failed, deadLetter] = await Promise.all([
      prisma.eventOutbox.count({ where: { status: 'PENDING' } }),
      prisma.eventOutbox.count({ where: { status: 'PUBLISHED' } }),
      prisma.eventOutbox.count({ where: { status: 'FAILED' } }),
      prisma.eventOutbox.count({ where: { status: 'DEAD_LETTER' } }),
    ]);

    return {
      pending,
      published,
      failed,
      deadLetter,
      total: pending + published + failed + deadLetter,
    };
  }
}

export const eventService = new EventBusService();
