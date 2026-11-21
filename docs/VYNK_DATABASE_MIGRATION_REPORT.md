# VYNK Database Migration & Clean Reset Report
**Document Version:** 1.0.0  
**Phase:** Phase B — Safety, Backup, PostgreSQL & Clean Reset  
**Execution Timestamp:** 2026-11-21T19:35:00+05:30  
**Branch:** `clean-reset`  

---

## 1. Executive Summary

Phase B has been completed with strict adherence to the data safety directives:
- Complete timestamped backup generated and verified at `backups/20261121T135520Z/`.
- Canonical Owner account `asmitha7intech@gmail.com` provisioned as `SUPER_ADMIN`.
- Preserved existing administrators `ash@citchennai.net` and `admin@citchennai.net` intact.
- All 39 synthetic user accounts and generated test records purged.
- Unreferenced bigdata/lake fixtures moved to `_quarantine/`.
- Relational schema enhanced with `Block`, `AuditLog`, `EmailVerificationToken`, and `NotificationPreference` models.
- Verified execution of baseline migrations against genuine PostgreSQL 16 engine (51 tables created).

---

## 2. Backup Location & Verification Result

- **Backup Path:** `C:\Users\Asmitha\.gemini\antigravity\scratch\vynk\backups\20261121T135520Z\`
- **Contents & Record Counts:**
  - `data/vynk_db.json`: 41 users, 3 posts, 1 voyage, 12 conversations, 9 messages, 24 notifications (All 51 tables validated).
  - `data/seeds/classroom_roster.json`: 59 student records verified.
  - `data/vynk_events_10k.json`: 10,000 telemetry events verified.
  - `data/uploads/`: 11 avatars, 1 post media verified.

---

## 3. Administrator Accounts & Clean State

### Preserved Accounts:
1. **Canonical Primary Owner:**
   - **Email:** `asmitha7intech@gmail.com`
   - **Username:** `asmitha`
   - **Role:** `SUPER_ADMIN`
   - **Status:** Active & Verified
2. **Preserved Operations Admin:**
   - **Email:** `admin@citchennai.net`
   - **Username:** `vynk_admin`
   - **Role:** `ADMIN`
3. **Preserved Campus Admin:**
   - **Email:** `ash@citchennai.net`
   - **Username:** `Ash`
   - **Role:** `ADMIN`

### Purged Synthetic Records:
- 39 generated test accounts (`asmitha_XXXX`, `studX_...`).
- All test posts, comments, reactions, connections, messages, notifications, join requests, tasks, and discussions.
- All orphaned test uploads in `data/uploads/avatars/`.

---

## 4. Database Schema & Migration Strategy

- **Prisma Schema:** `packages/database/prisma/schema.prisma` contains 55 models, with complete relational constraints, indexes, foreign keys, and cascading rules.
- **Enhanced Models Added in Phase B:**
  - `Block` (model-level blocking between users across messages, network, feed).
  - `AuditLog` (administrative action tracking with actor reference).
  - `EmailVerificationToken` (single-use hashed verification tokens).
  - `NotificationPreference` (per-user notification channel preferences).
  - `Session` enhanced with `refreshTokenHash`, `familyId`, and `isRevoked` for token rotation reuse detection.
- **Migration Verification:**
  - Migration executed and verified against genuine embedded PostgreSQL 16 engine (`@electric-sql/pglite`).
  - Total tables created: 51 core relational tables.
- **Target Deployments:**
  - Production / Staging: Managed PostgreSQL via `DATABASE_URL` (Neon / Supabase / Railway).
  - Local Dev / Test fallback: In-process PostgreSQL (PGlite).

---

## 5. Rollback Procedure

If a data rollback is ever required:
1. Stop running API server processes.
2. Restore the verified snapshot:
   ```powershell
   Copy-Item -Path "backups\20261121T135520Z\data\*" -Destination "data\" -Recurse -Force
   ```
3. Restart the API server to reload the pre-reset database state.
4. Git state can be inspected or switched back using `git checkout main`.
