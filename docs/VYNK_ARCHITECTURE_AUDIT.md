# VYNK Architecture Audit & Systems Map

**Document Version:** 2.0.0  
**Verification Date:** October 2026  
**Auditor:** Principal Full-Stack & Systems Architect  
**Repository:** `c:\Users\Asmitha\.gemini\antigravity\scratch\vynk`

---

## 1. Executive Architecture Summary

VYNK is a unified, real-time social, discovery, and collaboration platform tailored specifically for engineering students and student builders. The system is engineered as a high-performance TypeScript monorepo powered by Turborepo and pnpm workspaces.

```
                              ┌────────────────────────────────────────┐
                              │           React 18 / Vite              │
                              │   (Zustand, Lucide, Tailwind, Sockets) │
                              └──────────────────┬─────────────────────┘
                                                 │ HTTP / WebSocket (Proxy :5173 -> :4000)
                                                 ▼
                              ┌────────────────────────────────────────┐
                              │            Fastify 5 API               │
                              │    (JWT Auth, RateLimiter, Multipart)  │
                              └───────┬────────────────────────┬───────┘
                                      │                        │
                   ┌──────────────────▼──────┐   ┌─────────────▼─────────┐
                   │  LocalStore Transaction │   │  PostgreSQL / Prisma  │
                   │   (`data/vynk_db.json`) │   │      (Production)     │
                   └─────────────────────────┘   └───────────────────────┘
```

---

## 2. Component Architecture Breakdown

### 2.1 Frontend Architecture (`@vynk/web`)
* **Core Framework:** React 18 with TypeScript and Vite 6.
* **State Management:**
  * `authStore.ts`: Authentication tokens (`vynk_access_token`), active user profile, login, logout, and session hydration from `/api/v1/auth/me`.
  * `useTheme.ts`: Dark/futuristic visual identity using CSS variables and dark-mode tokens.
* **API Client Layer:** `apps/web/src/lib/api.ts` providing centralized typed request wrapping, automatic bearer token injection, network timeout detection, and structured error unwrapping via `ApiError`.
* **Real-Time Client:** Socket.IO client in `apps/web/src/lib/socket.ts` connecting to `/socket.io` with automatic authentication headers, room joining, and real-time message/notification handlers.
* **Component Design System:**
  * Atomic components: `Button`, `Input`, `Modal`, `Badge`, `Pill`, `Avatar`.
  * Composite widgets: `ChatWindow`, `FeedCard`, `QuizRunnerModal`, `QuizResultsModal`, `CreatePostModal`, `VynkNetworkGraph`.
  * Layout: `AppLayout`, `Navbar`, `RightPanel`, `VynkErrorBoundary` (dark neon crash prevention boundary).

### 2.2 Backend Architecture (`@vynk/api`)
* **Framework:** Fastify 5 with TypeScript.
* **Entry Point:** `apps/api/src/server.ts` configuring:
  * Fastify CORS with configurable origins and credential support.
  * Fastify Multipart (`@fastify/multipart`) and 50MB payload limit (`bodyLimit: 50 * 1024 * 1024`).
  * Fastify JWT (`@fastify/jwt`) with token verification decorator `authenticate`.
  * Socket.IO server initialization on port 4000.
* **Route Controllers:**
  * `/api/v1/auth`: Registration, login, logout, password reset, active sessions.
  * `/api/v1/profile`: Authenticated student profile retrieval, update, and avatar upload (`/me/avatar`).
  * `/api/v1/vynk`: Real student networking, connection requests, accept/reject, bidirectional relationships.
  * `/api/v1/messages`: Direct conversations, message history, persistent sending, read receipts, and real-time room notifications.
  * `/api/v1/quests`: Daily challenges, technical arena quizzes, authoritative answer validation, and idempotent XP reward allocation.
  * `/api/v1/posts`: Rich social posting (text, emojis, GIFs, videos), comment tree, reaction toggling, and feed retrieval.
  * `/api/v1/storage`: Signed URLs, avatar upload, and media upload (`/upload-media`) up to 50MB saving to `data/uploads/posts/`.
  * `/api/v1/voyages`: Project collaboration, join requests, team capacities, and milestones.
  * `/api/v1/communities`: Student tech circles, public/private join requests, and memberships.
  * `/api/v1/directory`: Searchable CIT classroom directory with academic verification.

### 2.3 Persistence & Database Layer
* **Active Runtime Strategy:** Hybrid transactional model.
  * Prisma client (`@vynk/database`) attempts connection to PostgreSQL.
  * When PostgreSQL is unreachable (e.g. offline dev environment), repository methods seamlessly utilize the transactional Local JSON Store (`data/vynk_db.json`).
  * `LocalStore` guarantees atomic persistence, file locking, in-memory caching, indexing across IDs/emails/usernames, and consistency across server restarts.
* **Data Integrity:**
  * 31+ authentic student profiles preserved in `data/vynk_db.json`.
  * 12 categorized daily technical challenges.
  * 12 Arena Quizzes spanning Systems Programming, Distributed Systems, WebAssembly, Security, Deep Learning, and Algorithms.

---

## 3. Root Cause Analysis of Reported Critical Failures

| Issue | Reported Symptom | Root Cause Discovered | Resolution Implemented |
|---|---|---|---|
| **P0: Profile Uploads** | "Cannot add a profile picture" | Fastify default body limit was 1MB (`1048576` bytes). Uploading phone or high-res photos exceeded the limit, throwing HTTP 413 `FST_ERR_CTP_BODY_TOO_LARGE`. Frontend converted large files to base64 which bloated size by 33%. | Raised Fastify `bodyLimit` to 50MB. Added multipart/binary file streaming in `apps/web/src/lib/api.ts` directly to `POST /api/v1/profile/me/avatar` with magic byte validation (JPEG, PNG, WebP, GIF). |
| **P1: Networking & Messaging** | "Cannot reliably connect with people or message other users" | `getOrCreateDirectConversation` in `message.service.ts` threw an immediate error if a mutual connection was not already marked `ACCEPTED`. Clicking "Message" on search or profile cards failed. | Allowed direct conversation creation between any two registered students while maintaining conversation privacy and real-time room events. |
| **P2: Quests & Quiz Submission** | "Clicking submit does nothing or does not display results" | `QuizRunnerModal.tsx` silently swallowed submission errors (`catch (err) { console.error(err); }`). Unauthenticated attempts received 401 silently. Results modal lacked question review breakdown. | Added explicit error alert banner, guest sign-in warning, and enhanced `QuizResultsModal.tsx` to render complete question breakdown with selected vs correct answers and authoritative explanations. |
| **P3: Rich Social Posting** | "Must be able to create posts with text, emojis, GIFs, and videos" | `CreatePostModal.tsx` only supported plain text and titles; no media upload, GIF picker, or video player existed. `FeedCard.tsx` only rendered `<img>` tags. | Added 10-emoji quick bar, file picker uploading to `/api/v1/storage/upload-media`, preset/custom GIF selector, media preview, and HTML5 `<video controls>` rendering in `FeedCard.tsx`. |
| **P4: Voyage Team Capacity** | "Project has reached maximum capacity of 6 members" | `voyage.service.ts` read `project.teamCapacity` but ignored `project.maxCapacity`, causing projects with custom capacities to fail join requests. | Updated service to respect `project.maxCapacity || project.teamCapacity || 20`. |

---

## 4. Environment & Startup Specifications

* **Node.js:** >= 18.0.0 (Node 22 LTS verified)
* **Package Manager:** `pnpm` (v9+)
* **Ports:**
  * Backend API: `http://localhost:4000`
  * Frontend Vite Dev Server: `http://localhost:5173`
* **Vite Proxy:** Routes `/api` and `/uploads` directly to `http://localhost:4000`.
