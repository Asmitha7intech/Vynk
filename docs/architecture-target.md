# VYNK — Target Production & Big Data Architecture

## 1. Architectural Philosophy
VYNK's target architecture bridges high-throughput student collaboration with enterprise-grade event-driven telemetry and distributed batch analytics.

Key principles:
1. **Asynchronous Isolation**: Student HTTP requests never block on Big Data pipelines or analytics consumers.
2. **Transactional Outbox Pattern**: All state mutations generate strongly-typed domain events written atomically to an outbox store (`EventOutbox`) before publishing to Apache Kafka or the local streaming pipeline.
3. **Medallion Data Lake**: Event streaming materializes into partitioned lake storage:
   - **RAW**: Immutable, append-only JSONL files partitioned hourly (`/data/lake/raw/year=YYYY/month=MM/day=DD/hour=HH/`).
   - **BRONZE**: Sanitized, schema-validated events with synthetic data flags (`dataSource: 'PROD' | 'SYNTHETIC'`).
   - **SILVER**: Deduplicated, enriched events joined with user departments and quest contexts.
   - **GOLD**: Aggregated business metrics, cross-department synergy scores, skill gap matrices, and user recommendation vectors.
4. **Resilience & Fallbacks**: The system operates with full fidelity whether running in high-scale Docker mode (PostgreSQL + Redis + Kafka + Spark + Hive) or lightweight local mode (Prisma LocalStore + In-Memory Message Bus + File-backed Data Lake).

## 2. System Topology

```mermaid
flowchart TD
    Client["VYNK Web Client (React 19)"]
    API["Fastify API Layer"]
    DB[("PostgreSQL / Resilient LocalStore")]
    Outbox[("Transactional Outbox")]
    Kafka[["Apache Kafka (KRaft) / Local Bus"]]
    Lake[("Medallion Data Lake\nRAW -> BRONZE -> SILVER -> GOLD")]
    StreamEngine["Real-time Stream Consumer (Redis Aggregations)"]
    BatchEngine["Batch Analytics (Spark / Hive / Pig)"]
    RecEngine["Personalization & Matching-v2 Engine"]
    PulseUI["Live Operations Pulse & Campus Dashboard"]

    Client -->|HTTP / REST| API
    Client <-->|WebSocket (Socket.io)| API
    API -->|ACID State Mutation| DB
    API -->|Atomic Write| Outbox
    Outbox -->|Asynchronous Poller / CDC| Kafka
    Kafka -->|Stream Ingestion| Lake
    Kafka -->|Real-time Counter Windowing| StreamEngine
    StreamEngine -->|Fast Caching| PulseUI
    Lake -->|Batch Analytics| BatchEngine
    BatchEngine -->|Gold Tables / Feature Vectors| RecEngine
    RecEngine -->|Personalized Suggestions| API
```

## 3. Data Flow & Security Constraints
- **Zero Sensitive Data in Telemetry**: Passwords, hashes, authentication tokens, and private direct message bodies are stripped at the serialization boundary.
- **Traceability**: Every event possesses a unique `eventId` (UUIDv4), `correlationId`, `causationId`, `timestamp`, `eventType`, `userId`, `college`, and `department`.
- **Fault-Tolerant Outbox**: Events failing transmission to Kafka are re-attempted with exponential backoff and dead-letter queue (DLQ) support.
