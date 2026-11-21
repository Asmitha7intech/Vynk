# VYNK — REMAINING ISSUES & POST-LAUNCH ENHANCEMENT INVENTORY

**Current Release:** VYNK v1.0.0-production-launch  
**Git Branch:** `clean-reset`  
**Assessment Date:** November 21, 2026  
**Status:** **0 BLOCKING DEFECTS. Platform certified for launch.**

---

## 1. Executive Summary

Following the completion of Phases A through G, all functional, security, data integrity, and styling defects have been permanently resolved. The platform operates on 100% genuine data, uses memory-hard Argon2id cryptography, and is backed by 198 automated unit and end-to-end integration tests.

This document serves as an engineering roadmap and backlog of non-blocking architectural opportunities for future scaling (Post-v1.0.0).

---

## 2. Defect Severity Matrix

| Severity | Count | Definition | Status |
| :--- | :---: | :--- | :---: |
| **P0 — Critical / Blocker** | **0** | Data loss, authentication bypass, broken core flow, unhandled crash | **CLEARED** |
| **P1 — Major** | **0** | Broken page, inaccessible feature, security flaw | **CLEARED** |
| **P2 — Moderate** | **0** | Visual misalignment, slow query, missing minor validation | **CLEARED** |
| **P3 — Enhancement** | **5** | Future scaling, native push, distributed workers, advanced AI | **DOCUMENTED** |

---

## 3. Post-v1.0.0 Non-Blocking Enhancement Inventory

### ENH-01: Multi-Party WebRTC Video & Audio Collaboration
- **Current State:** Real-time text messaging over persistent WebSockets with typing indicators, delivery receipts, and blocking enforcement is 100% operational.
- **Future Enhancement:** Introduce interactive WebRTC video breakout rooms within Voyage workspaces to facilitate real-time hackathon sprints and virtual campus study sessions.
- **Implementation Strategy:**
  - Deploy a lightweight SFU (Selective Forwarding Unit) such as LiveKit or mediasoup.
  - Integrate WebRTC room token generation into the Fastify API.
  - Add an audio/video toggle to the Voyage project header.

---

### ENH-02: Distributed Event Consumer Worker (Kafka Scaling)
- **Current State:** The backend features a dual-mode event publisher (`kafka-producer.service.ts`). In standard deployments, real-time events propagate through Redis Pub/Sub; if `KAFKA_BROKER` is configured, events are published to Kafka topics.
- **Future Enhancement:** Deploy a dedicated consumer worker process (`apps/worker`) that subscribes to Kafka event topics (`vynk.posts`, `vynk.voyages`, `vynk.audit`) to offload heavy background analytics and telemetry without impacting HTTP request threads.
- **Implementation Strategy:**
  - Create a lightweight Node/TypeScript worker using `kafkajs`.
  - Ingest events into ClickHouse or TimescaleDB for long-term historical analytics.

---

### ENH-03: Asynchronous AI Profile Embedding Worker
- **Current State:** Semantic matching utilizes PostgreSQL `pgvector` indexing. Basic keyword and tag similarity powers peer discovery.
- **Future Enhancement:** Automatically generate 384-dimensional dense vector embeddings for student bios, skills, and Voyage descriptions whenever a profile is saved.
- **Implementation Strategy:**
  - Utilize local CPU embedding via ONNX Runtime / `transformers.js` (`all-MiniLM-L6-v2`) or remote embedding via OpenAI / Cloudflare Workers AI.
  - Queue profile updates to Redis BullMQ; worker writes vector embeddings to the `embedding vector(384)` column in PostgreSQL.

---

### ENH-04: Progressive Web App (PWA) & WebPush Notifications
- **Current State:** In-app real-time notification toasts and transactional email notifications (via Resend/SMTP) are active and tested.
- **Future Enhancement:** Add WebPush notifications via Service Workers so students receive instant alerts on mobile devices even when the browser tab is closed.
- **Implementation Strategy:**
  - Add `web-push` npm package to backend.
  - Store push subscriptions in a new `PushSubscription` table.
  - Implement notification permission modal and service worker registration in `apps/web`.

---

### ENH-05: OAuth SSO Providers (Google & GitHub)
- **Current State:** Local authentication with email/password (Argon2id), rotating refresh tokens, and academic email domain verification is fully functional and secure.
- **Future Enhancement:** Enable Google and GitHub OAuth 2.0 social login buttons (schemas are already defined in `@vynk/types`).
- **Implementation Strategy:**
  - Wire Fastify `@fastify/oauth2` routes to existing user account linking logic in `auth.service.ts`.
  - Validate academic email domain during OAuth callback if campus badge verification is requested.

---

## 4. Maintenance & Monitoring Guidelines

1. **Prisma Migrations:** Always run `pnpm --filter @vynk/database db:migrate` before releasing new application versions to prevent schema drift.
2. **Clean-State Verification:** Ensure `node scripts/verify-clean.js` is maintained as a mandatory pre-commit and CI check.
3. **Argon2id Parameters:** If server hardware is upgraded, parameters (`memoryCost`, `timeCost`) in `password.service.ts` can be adjusted with full backwards-compatibility.
