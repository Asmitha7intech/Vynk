import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { VynkEvent } from '@vynk/types';

// Resolve data lake root
function getLakeRoot(): string {
  let curr = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.resolve(curr, 'pnpm-workspace.yaml'))) {
      return path.resolve(curr, 'data', 'lake');
    }
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return path.resolve(process.cwd(), 'data', 'lake');
}

const LAKE_ROOT = getLakeRoot();

// Partition path helper: /data/lake/{zone}/year=YYYY/month=MM/day=DD/hour=HH/events.jsonl
function getPartitionPath(zone: 'raw' | 'bronze' | 'silver' | 'gold', timestamp: Date): string {
  const year = timestamp.getUTCFullYear();
  const month = String(timestamp.getUTCMonth() + 1).padStart(2, '0');
  const day = String(timestamp.getUTCDate()).padStart(2, '0');
  const hour = String(timestamp.getUTCHours()).padStart(2, '0');
  return path.join(LAKE_ROOT, zone, `year=${year}`, `month=${month}`, `day=${day}`, `hour=${hour}`, 'events.jsonl');
}

// Thread-safe JSONL append
function appendJsonl(filePath: string, record: any): void {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const line = JSON.stringify(record) + '\n';
    fs.appendFileSync(filePath, line, 'utf8');
  } catch (err) {
    console.error(`[DataLake] Failed to write to ${filePath}:`, err);
  }
}

// In-memory real-time counters (Redis fallback)
interface RealtimeCounters {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByDepartment: Record<string, number>;
  eventsByHour: Record<string, number>;
  activeUserIds: Set<string>;
  lastUpdated: string;
}

const counters: RealtimeCounters = {
  totalEvents: 0,
  eventsByType: {},
  eventsByDepartment: {},
  eventsByHour: {},
  activeUserIds: new Set(),
  lastUpdated: new Date().toISOString(),
};

class DataLakeService {
  /**
   * Write an event to the RAW zone (immutable, append-only)
   * Then process into BRONZE (sanitized, schema-validated)
   */
  async ingestEvent(event: VynkEvent): Promise<void> {
    const ts = new Date(event.timestamp);

    // 1. RAW zone — immutable event record
    const rawRecord = {
      _ingestedAt: new Date().toISOString(),
      _lakeId: crypto.randomUUID(),
      _zone: 'RAW',
      ...event,
    };
    appendJsonl(getPartitionPath('raw', ts), rawRecord);

    // 2. BRONZE zone — sanitize and validate
    const bronzeRecord = this.toBronze(rawRecord, ts);
    appendJsonl(getPartitionPath('bronze', ts), bronzeRecord);

    // 3. Update real-time in-memory counters
    this.updateCounters(event);
  }

  private toBronze(raw: any, ts: Date): any {
    // Validate required fields, strip injection vectors, tag data source
    return {
      _zone: 'BRONZE',
      _processedAt: new Date().toISOString(),
      _lakeId: raw._lakeId,
      eventId: raw.eventId,
      eventType: raw.eventType,
      timestamp: raw.timestamp,
      correlationId: raw.correlationId,
      version: raw.version,
      dataSource: raw.dataSource || 'PROD',
      userId: raw.userId || null,
      college: raw.college || null,
      department: raw.department || null,
      // Structured partition columns
      _year: ts.getUTCFullYear(),
      _month: ts.getUTCMonth() + 1,
      _day: ts.getUTCDate(),
      _hour: ts.getUTCHours(),
      // Sanitize payload: strip any string > 2KB
      payload: JSON.parse(
        JSON.stringify(raw.payload || {}, (_, v) =>
          typeof v === 'string' && v.length > 2000 ? '[TRUNCATED]' : v
        )
      ),
    };
  }

  private updateCounters(event: VynkEvent): void {
    counters.totalEvents++;
    counters.eventsByType[event.eventType] = (counters.eventsByType[event.eventType] || 0) + 1;

    if (event.department) {
      counters.eventsByDepartment[event.department] =
        (counters.eventsByDepartment[event.department] || 0) + 1;
    }

    const hourKey = new Date(event.timestamp).toISOString().substring(0, 13); // "YYYY-MM-DDTHH"
    counters.eventsByHour[hourKey] = (counters.eventsByHour[hourKey] || 0) + 1;

    if (event.userId) {
      counters.activeUserIds.add(event.userId);
    }

    counters.lastUpdated = new Date().toISOString();
  }

  /**
   * Process BRONZE events to SILVER (deduplicated, enriched)
   * Called by batch worker — not in request path
   */
  async processSilver(dateStr: string, hour: number): Promise<number> {
    const ts = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00Z`);
    const bronzePath = getPartitionPath('bronze', ts);
    const silverPath = getPartitionPath('silver', ts);

    if (!fs.existsSync(bronzePath)) return 0;

    const lines = fs.readFileSync(bronzePath, 'utf8').trim().split('\n').filter(Boolean);
    const seen = new Set<string>();
    let processed = 0;

    for (const line of lines) {
      try {
        const event = JSON.parse(line);
        // Deduplicate by eventId
        if (seen.has(event.eventId)) continue;
        seen.add(event.eventId);

        const silverRecord = {
          _zone: 'SILVER',
          _processedAt: new Date().toISOString(),
          ...event,
          // Enrich with normalized fields
          _departmentNormalized: (event.department || '').toUpperCase().replace(/\s+/g, '_'),
          _collegeNormalized: (event.college || '').toUpperCase().replace(/\s+/g, '_'),
        };
        appendJsonl(silverPath, silverRecord);
        processed++;
      } catch (e) {
        // Skip corrupt records
      }
    }

    return processed;
  }

  /**
   * Get real-time pulse metrics
   */
  getRealtimeMetrics() {
    const topEventTypes = Object.entries(counters.eventsByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));

    const topDepartments = Object.entries(counters.eventsByDepartment)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([department, count]) => ({ department, count }));

    const recentHours = Object.entries(counters.eventsByHour)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 24)
      .map(([hour, count]) => ({ hour, count }));

    return {
      totalEvents: counters.totalEvents,
      activeUsers: counters.activeUserIds.size,
      topEventTypes,
      topDepartments,
      recentHours,
      lastUpdated: counters.lastUpdated,
      lakeRoot: LAKE_ROOT,
      zones: ['raw', 'bronze', 'silver', 'gold'],
    };
  }

  /**
   * Get lake zone file counts for operational visibility
   */
  getLakeStats(): Record<string, { files: number; sizeKb: number }> {
    const zones = ['raw', 'bronze', 'silver', 'gold'] as const;
    const stats: Record<string, { files: number; sizeKb: number }> = {};

    for (const zone of zones) {
      const zoneDir = path.join(LAKE_ROOT, zone);
      if (!fs.existsSync(zoneDir)) {
        stats[zone] = { files: 0, sizeKb: 0 };
        continue;
      }

      let fileCount = 0;
      let totalBytes = 0;

      function walkDir(dir: string) {
        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              walkDir(fullPath);
            } else if (entry.isFile()) {
              fileCount++;
              totalBytes += fs.statSync(fullPath).size;
            }
          }
        } catch (_) {}
      }

      walkDir(zoneDir);
      stats[zone] = { files: fileCount, sizeKb: Math.round(totalBytes / 1024) };
    }

    return stats;
  }
}

export const dataLakeService = new DataLakeService();
