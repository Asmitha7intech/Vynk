# VYNK Master Repair & Verification Plan

**Status:** ALL PHASES IMPLEMENTED & VERIFIED  
**Date:** October 2026  
**Engineering Discipline:** Full-Stack Systems, Real-Time Architecture & Reliability

---

## Task Matrix & Implementation Status

| Task ID | Component & Description | Status | Verification Reference |
|---|---|---|---|
| **AUTH-01** | Propagate user identity from JWT payload to controllers and services | **VERIFIED** | `apps/api/test/vynk5_auth_collaboration.test.ts` |
| **AUTH-02** | Default omitted institution to CIT; allow `.citchennai.net` and `.cit.edu.in` | **VERIFIED** | `apps/api/test/vynk_quests_bio_cit.test.ts` |
| **AUTH-03** | Prevent session hijacking and allow active session revocation on logout | **VERIFIED** | `apps/api/test/vynk5_auth_collaboration.test.ts` |
| **PROF-01** | Multipart and raw binary avatar upload supporting JPEG, PNG, WebP, GIF | **VERIFIED** | `apps/api/test/vynk_profile_networking_messaging.test.ts` |
| **PROF-02** | Magic byte inspection preventing spoofed `.jpg` executable uploads | **VERIFIED** | `apps/api/test/vynk5_auth_collaboration.test.ts` |
| **PROF-03** | Authentic profile bio, headline, skills editing and permanent persistence | **VERIFIED** | `apps/api/test/vynk_master_full_lifecycle.test.ts` |
| **PROF-04** | Dedicated `AvatarUploadModal` with file selection, live preview, cancel, confirm & save, and remove photo controls | **VERIFIED** | `apps/web/src/components/AvatarUploadModal.tsx` |
| **NET-01** | Student directory search and real profile discovery from database | **VERIFIED** | `apps/api/test/vynk_profile_networking_messaging.test.ts` |
| **NET-02** | Connection requests state machine (`PENDING`, `ACCEPTED`, `REJECTED`) | **VERIFIED** | `apps/api/test/vynk_profile_networking_messaging.test.ts` |
| **MSG-01** | Direct conversation creation between any two registered students | **VERIFIED** | `apps/api/test/vynk_master_full_lifecycle.test.ts` |
| **MSG-02** | Persistent message delivery, chronological history, and room broadcast | **VERIFIED** | `apps/api/test/vynk_master_full_lifecycle.test.ts` |
| **MSG-03** | Conversation read receipt tracking and unread badge computation | **VERIFIED** | `apps/api/test/vynk_master_full_lifecycle.test.ts` |
| **QUEST-01** | Technical arena quiz retrieval without leaking answers or keys | **VERIFIED** | `apps/api/test/vynk_quests_bio_cit.test.ts` |
| **QUEST-02** | Authoritative server-side answer scoring and percentage calculation | **VERIFIED** | `apps/api/test/vynk_master_full_lifecycle.test.ts` |
| **QUEST-03** | Idempotency enforcement preventing duplicate XP farming on repeat attempts | **VERIFIED** | `apps/api/test/vynk_master_full_lifecycle.test.ts` |
| **QUEST-04** | Quiz results breakdown with authoritative educational explanations | **VERIFIED** | `apps/web/src/components/QuizResultsModal.tsx` |
| **POST-01** | Rich post publishing with text, emojis, tags, and media attachment | **VERIFIED** | `apps/api/test/vynk_master_full_lifecycle.test.ts` |
| **POST-02** | Dedicated 50MB media upload endpoint (`/api/v1/storage/upload-media`) | **VERIFIED** | `apps/api/src/controllers/storage.controller.ts` |
| **POST-03** | Built-in GIF picker with curated developer presets and external URL support | **VERIFIED** | `apps/web/src/components/CreatePostModal.tsx` |
| **POST-04** | Accessible HTML5 `<video controls>` rendering in feed for video posts | **VERIFIED** | `apps/web/src/components/FeedCard.tsx` |
| **POST-05** | Authoritative like persistence, caller-scoped `isLikedByMe`, and double-tap heart animation | **VERIFIED** | `apps/api/src/repositories/post.repository.ts`, `FeedCard.tsx` |
| **POST-06** | Complete comments system with retrieval, submission, author avatar/timestamp, and comment deletion | **VERIFIED** | `apps/api/src/controllers/posts.controller.ts`, `FeedCard.tsx` |
| **POST-07** | Navigable post permalinks (`/posts/:id`, `/p/:id`), `PostDetailsPage.tsx`, and native share / clipboard fallback | **VERIFIED** | `apps/web/src/pages/PostDetailsPage.tsx`, `FeedCard.tsx` |
| **UI-01** | Dark neon aesthetic consistency, responsive layouts, and zero horizontal overflow | **VERIFIED** | `apps/web/test/routes.test.tsx` |
| **UI-02** | Comprehensive crash prevention with `VynkErrorBoundary` | **VERIFIED** | `apps/web/test/routes.test.tsx` |
| **DATA-01** | Preservation of existing 31 authentic student profiles in local JSON database | **VERIFIED** | `data/vynk_db.json` |

---

## Detailed Repair Execution Notes

### Phase 1: Profile Photo Upload Complete Workflow
1. Increased Fastify payload limit to `50MB` and multipart file limit to `50MB` in `apps/api/src/server.ts`.
2. Created `apps/web/src/components/AvatarUploadModal.tsx` providing image selection (JPEG, PNG, WebP, GIF), circular live preview, Cancel Preview, Confirm & Save, and Remove Photo buttons.
3. Updated `apps/web/src/lib/api.ts` to stream raw `FormData` via `fetch` to `/api/v1/profile/me/avatar`.
4. Reinforced magic byte verification in `apps/api/src/controllers/profile.controller.ts` for JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), WebP, and GIF.
5. Persistent saving to `data/uploads/avatars/`, database update, and user profile sync in `authStore`.

### Phase 2: Quests & Arena Quiz Submissions
1. In `apps/web/src/components/QuizRunnerModal.tsx`, implemented active error handling, guest warning, and synced user XP in `useAuthStore` on submission.
2. Enhanced `apps/web/src/components/QuizResultsModal.tsx` to render detailed question review cards showing student choices, correct answers, and authoritative explanations.
3. Verified idempotent XP rewards in `apps/api/src/services/quest.service.ts` so repeat attempts do not award duplicate XP.

### Phase 3: Post Creation and Feed Persistence
1. Registered `POST /api/v1/storage/upload-media` supporting image, GIF, and video uploads up to 50MB.
2. Relaxed post validation in `@vynk/validation` to allow relative media paths (`/uploads/posts/...`).
3. Added quick emoji toolbar, GIF selector with presets, file upload, and live media preview to `CreatePostModal.tsx`.
4. Upgraded `FeedCard.tsx` to detect video extensions (`.mp4`, `.webm`, `.mov`, `.ogg`) and render an HTML5 `<video controls>` player.
5. Added `vynk:post-created` event dispatch and inline "+ Create Post" trigger on `HomePage.tsx`.

### Phase 4: Like, Comment, and Share System
1. **Likes:** Updated `postRepository.listFeed` and `findById` to compute `isLikedByMe` and `likesCount` based on the calling user. Added double-tap card to like and optimistic like sync in `FeedCard.tsx`.
2. **Comments:** Added `getComments` and `deleteComment` to `postRepository` and endpoints `GET /posts/:id/comments` and `DELETE /posts/:postId/comments/:commentId`. Updated `FeedCard.tsx` to display comments with author avatar and timestamp.
3. **Sharing:** Added `/posts/:id` route, `PostDetailsPage.tsx`, and copy-link with toast notification.
