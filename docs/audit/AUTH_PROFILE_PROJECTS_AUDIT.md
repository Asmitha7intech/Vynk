# VYNK 5.0 — Comprehensive Audit: Authentication, Profiles, & Projects

**Audit Date:** 2026-10-13  
**Auditors:** Senior Full-Stack, Application Security, and Systems Architects  
**Repository:** `C:\Users\Asmitha\.gemini\antigravity\scratch\vynk`  

---

## 1. Executive Summary

This audit assesses the state of Authentication, Session Management, Profile Customization, Avatar Management, and Project (Voyage) Collaboration workflows within the VYNK repository.

### Key Audit Findings
1. **Authentication:**
   - Exists via Fastify JWT (`@fastify/jwt`) with passwords hashed via `bcryptjs`.
   - **Critical Vulnerability / Incompleteness:** Logout is only client-side (`localStorage.removeItem`). There is NO server-side token revocation or session invalidation endpoint (`POST /auth/logout`), meaning issued tokens remain valid until expiration.
   - There is NO forgot-password or password-reset workflow implemented.
   - Rate limiting on auth endpoints is minimal (global 200/min rather than dedicated strict auth rate limiting).

2. **User Profiles & Avatars:**
   - Profile records are stored in `LocalStoreEngine` (`data/vynk_db.json`).
   - Profile editing only updates basic text fields (headline, bio, social URLs).
   - Profile picture upload has an unfinished stub in `storage.service.ts` (`/signed-url`) but NO backend upload handler (`/api/v1/storage/upload`), NO raster signature/magic-byte validation, and NO UI for uploading or removing avatars.
   - The navigation bar lacks a profile dropdown menu, account management, and a visible "Sign out" button.

3. **Projects (Voyages) Collaboration System:**
   - Discovery gallery exists (`/voyages`), but projects are static display cards.
   - There is **no dedicated project details route** (`/voyages/:id`).
   - Team membership is read-only; join requests, approvals/rejections, member capacity checks, and role assignments are absent.
   - Milestone tracking is display-only with no creation/update API.
   - Task management, project discussions, and project-level activity timelines are completely missing.

4. **Big Data Integration:**
   - Event outbox and data lake exist (`data/lake/raw/`).
   - `VOYAGE_CREATED` and `VOYAGE_STARRED` events are emitted, but need extension for membership, milestones, join requests, and profile updates without leaking sensitive credentials.

---

## 2. Component-by-Component Trace

### 2.1 Backend Authentication & Session Lifecycle
- **Routes:** `apps/api/src/controllers/auth.controller.ts` mounts `/register`, `/login`, `/refresh`, `/me`.
- **Plugin:** `apps/api/src/plugins/auth.ts` verifies JWTs via `request.jwtVerify()`.
- **Gaps:**
  - No session table or token revocation store. Once signed, a JWT cannot be invalidated.
  - Password strength validation is minimal.
  - No `POST /auth/logout` endpoint.
  - No `POST /auth/forgot-password` or `POST /auth/reset-password`.

### 2.2 Persistence Layer (`packages/database/src/local-store.ts`)
- Backed by `data/vynk_db.json`.
- Supports models: `user`, `project` (voyage), `projectMember`, `projectMilestone`, `notification`, etc.
- **Required Model Additions:**
  - `sessions` / `revokedTokens` for real logout and session revocation.
  - `passwordResetTokens` for secure account recovery.
  - `projectJoinRequests` for team applications.
  - `projectTasks` for task management.
  - `projectDiscussions` for team collaboration messages.
  - `projectActivities` for audit and activity logs.

### 2.3 Storage & Image Serving
- `storage.service.ts` generates `/uploads/${fileKey}`, but `fastify` does not serve `/uploads` as a static directory or implement the upload receiver.
- Missing: Magic byte raster verification (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `52 49 46 46`), dimension/size limits (5MB max), and path traversal protection.

### 2.4 Frontend Navigation & Pages
- `apps/web/src/components/Navbar.tsx`: Lacks a profile dropdown menu, settings, and sign-out button.
- `apps/web/src/pages/AuthPage.tsx`: Lacks password confirmation, password strength meter, and forgot password flow.
- `apps/web/src/pages/ProfilePage.tsx`: Lacks avatar upload/removal and skills editing.
- `apps/web/src/pages/VoyagesPage.tsx`: Needs rich search, filter by skill/status/availability, and navigation into project details workspace.
- `apps/web/src/pages/VoyageDetailsPage.tsx`: Missing dedicated workspace page.

---

## 3. Implementation Roadmap for VYNK 5.0

1. **Security & Session Foundation:** Add session revocation store, `POST /auth/logout`, `POST /auth/forgot-password`, `POST /auth/reset-password`, and token verification middleware checking revocation.
2. **File Storage & Avatar Engine:** Implement local uploads directory (`data/uploads`), static asset serving (`/uploads/*`), magic byte validator, and avatar endpoints (`POST /api/v1/profile/me/avatar`, `DELETE /api/v1/profile/me/avatar`).
3. **Interactive Project Workspace:**
   - Dedicated route `/voyages/:id`.
   - Join request workflow (apply with intro, owner approve/reject, capacity limits).
   - Milestones & task kanban/list (create, update status, complete).
   - Real-time discussion board & activity feed.
4. **UI/UX Polish:**
   - Authenticated Navbar profile dropdown with Avatar, Profile, and real Sign Out.
   - Enhanced AuthPage with password strength and forgot password.
   - Comprehensive Profile editing with avatar picker.
5. **Big Data Event Continuity:** Emit clean, sanitized domain events (`user.avatar_updated`, `project.join_requested`, `project.member_joined`, `project.milestone_completed`) to the event outbox.
