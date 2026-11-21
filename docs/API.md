# VYNK API Specification & Contracts (v1)

## Overview
All REST endpoints are rooted at `/api/v1` (with `/api` as backward-compatible alias).
Authentication is enforced via JWT bearer tokens in the `Authorization: Bearer <token>` header or authenticated HTTP-only session cookies.

---

## 1. Authentication & Account Lifecycle (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Register new student account (`email`, `password`, `username`, `displayName`, `college`, `department`, `graduationYear`) |
| `POST` | `/login` | Public | Authenticate student, issue JWT access token and session identifier |
| `POST` | `/logout` | Authenticated | Revoke server session and invalidate token |
| `GET` | `/me` | Authenticated | Return authenticated student profile |
| `POST` | `/forgot-password` | Public | Request password reset token |
| `POST` | `/reset-password` | Public | Reset password using verified token and invalidate all active sessions |
| `GET` | `/sessions` | Authenticated | List all active device sessions for current user |
| `DELETE` | `/sessions/:id` | Authenticated | Revoke specific session |

---

## 2. Posts & Builder Stream (`/api/v1/posts`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/feed` | Public | Paginated feed of posts (`limit`, `cursor`). Ordered deterministically by `createdAt desc`. |
| `GET` | `/:id` | Public | Retrieve single post with comments and reactions |
| `POST` | `/` | Authenticated | Create post (`content`, `type`, `title`, `tags`, `mediaUrls`, `voyageId`) |
| `POST` | `/:id/comments` | Authenticated | Add discussion comment (`content`, `parentId`) |
| `POST` | `/:id/react` | Authenticated | Toggle post reaction / like (idempotent) |
| `POST` | `/:id/reactions` | Authenticated | Toggle reaction with specific emoji |

---

## 3. Student Identity & Network Discovery (`/api/v1/users`, `/api/v1/vynks`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/users/search` | Public | Search campus builders by name, username, skill, department (`q`, `limit`) |
| `GET` | `/users/:username` | Public | View public student profile and portfolio |
| `PATCH` | `/profile` | Authenticated | Update headline, bio, links, and availability |
| `POST` | `/vynks/request` | Authenticated | Send peer connection request (`targetUserId`) |
| `POST` | `/vynks/accept` | Authenticated | Accept connection request (`requestId`) |
| `POST` | `/vynks/reject` | Authenticated | Reject connection request (`requestId`) |
| `DELETE` | `/vynks/cancel/:id` | Authenticated | Cancel pending outgoing request |
| `GET` | `/vynks/connections` | Authenticated | List confirmed connections (My Vynks) |
| `GET` | `/vynks/requests/incoming` | Authenticated | List pending inbound requests |
| `GET` | `/vynks/requests/outgoing` | Authenticated | List pending outbound requests |

---

## 4. Campus Communities (`/api/v1/communities`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/communities` | Public | List campus communities with category filtering and member counts |
| `GET` | `/communities/:idOrSlug`| Public | Community details, guidelines, and member count |
| `POST` | `/communities` | Authenticated | Create community (`name`, `description`, `category`, `tags`, `isPrivate`) |
| `POST` | `/communities/:id/join` | Authenticated | Join community (auto-approved if public, pending review if private) |
| `POST` | `/communities/:id/leave`| Authenticated | Leave community |
| `GET` | `/communities/:id/members`| Authenticated | List community members |
| `GET` | `/communities/:id/posts`| Authenticated | Community-scoped discussion stream |

---

## 5. Voyages & Project Collaboration (`/api/v1/voyages`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/voyages` | Public | Filterable showcase of student projects (`category`) |
| `GET` | `/voyages/:id` | Public | Full voyage workspace data (milestones, tech stack, team) |
| `POST` | `/voyages` | Authenticated | Showcase new Voyage (+250 XP reward) |
| `POST` | `/voyages/:id/join-request` | Authenticated | Apply to join project team (`roleName`, `message`, `skills`) |
| `POST` | `/voyages/:id/join-request/:reqId` | Authenticated | Creator reviews application (`ACCEPTED` / `REJECTED`) |
| `POST` | `/voyages/:id/tasks` | Authenticated | Add project task (`title`, `priority`, `dueDate`) |
| `PATCH`| `/voyages/:id/tasks/:taskId` | Authenticated | Update task status (`TODO` / `IN_PROGRESS` / `COMPLETED`) |
| `POST` | `/voyages/:id/discussions` | Authenticated | Post sprint update to project workspace |

---

## 6. Real-Time Messaging (`/api/v1/messages`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/conversations` | Authenticated | List active direct conversations & squad channels |
| `POST` | `/conversations` | Authenticated | Initiate direct conversation with connected peer |
| `GET` | `/conversations/:id/messages` | Authenticated | Paginated message history (`limit`, `cursor`) |
| `POST` | `/conversations/:id/messages` | Authenticated | Send message (persisted first, then broadcast via Socket.IO) |

---

## 7. Gamification & Leaderboard (`/api/v1/gamification`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/leaderboard` | Public | Real XP rankings by scope (`GLOBAL`, `COLLEGE`, `DEPARTMENT`, `WEEKLY`) |
| `GET` | `/rank-explanation/:userId` | Public | Auditable XP breakdown by activity pillars |

---

## 8. Pulse Ecosystem Telemetry (`/api/v1/pulse`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/summary` | Public | Live telemetry (real user counts, real events, department distribution) |
| `GET` | `/events` | Public | Live stream of verified analytics events with pagination |
| `GET` | `/export.csv` | Public | Sanitized CSV export of platform analytics events |
| `GET` | `/skills` | Public | Top verified campus skills aggregated from `UserSkill` model |

---

## 9. Error Handling Contract
All API errors return RFC 7807 compatible JSON responses:
```json
{
  "success": false,
  "message": "Human-readable error description",
  "code": "ERROR_CODE",
  "errors": {
    "field": ["Validation error message"]
  }
}
```
Standard HTTP status codes:
- `200 OK` / `201 Created`
- `400 Bad Request` (Zod validation failure)
- `401 Unauthorized` (missing or expired JWT)
- `403 Forbidden` (insufficient privileges or not a conversation member)
- `404 Not Found` (resource does not exist)
- `429 Too Many Requests` (rate limit exceeded)
- `500 Internal Server Error` (unhandled server exception)
