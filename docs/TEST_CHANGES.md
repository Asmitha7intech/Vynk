# VYNK Test Suite Adjustments & Modernization Log

This document records all modifications made to automated tests in accordance with Operating Rule 1:
*"Preserve working business logic and API contracts. Do not rebuild working code unnecessarily. Document any test adjustments in docs/TEST_CHANGES.md."*

---

## 1. Rule 4: Dynamic Password Generation & Elimination of Hardcoded Passwords
- **Files Modified:**
  - `apps/api/test/test-helpers.ts` (Created): Exports `generateTestPassword()`, providing compliant passwords with random bytes meeting password complexity rules (length >= 10, uppercase, lowercase, numbers, symbols).
  - `apps/api/test/canonical_owner_auth.test.ts`: Replaced hardcoded credentials with `process.env.OWNER_INITIAL_PASSWORD`.
  - `apps/api/test/e2e_student_collaboration_workflows.test.ts`: Replaced static `Password123!` with `generateTestPassword()` for students and `process.env.OWNER_INITIAL_PASSWORD` for SuperAdmin.
  - `apps/api/test/idor_security.test.ts`: Replaced static `Password123!` with `generateTestPassword()` for students and `process.env.OWNER_INITIAL_PASSWORD` for SuperAdmin.
  - `apps/api/test/session_rotation.test.ts`: Replaced static `Password123!` with `process.env.OWNER_INITIAL_PASSWORD`.
  - `apps/api/test/vynk_directive_acceptance.test.ts`: Replaced static `Password123!` with `sharedTestPassword` (`generateTestPassword()`) for students and `process.env.OWNER_INITIAL_PASSWORD` for SuperAdmin.
  - `apps/api/test/vynk_master_directive_verification.test.ts`: Replaced static `Password123!` with `generateTestPassword()` for students and `process.env.OWNER_INITIAL_PASSWORD` for SuperAdmin.

---

## 2. Single-Owner Policy & Zero Secondary Admin Accounts
- **Directive Mandate:** Single Owner Constraint: Exactly ONE privileged account (`asmitha7intech@gmail.com`) with `SUPER_ADMIN` role, `mustChangePassword: true`, `xp: 0`, `level: 1`. Zero extra or secondary admin accounts (`ash@citchennai.net`, `admin@citchennai.net` deleted).
- **Files Adjusted:**
  - `apps/api/test/canonical_owner_auth.test.ts`: Updated assertion from expecting secondary admins to verifying single-owner isolation (`ash@citchennai.net` and `admin@citchennai.net` are null).
  - `apps/api/test/vynk_master_directive_verification.test.ts`: Updated Phase 3 assertion to verify canonical SuperAdmin exists (`asmitha7intech@gmail.com`) and extra secondary admins are null.
  - `apps/api/test/vynk_directive_acceptance.test.ts`: Updated Phase 4 & 3 data integrity test to verify canonical owner `asmitha` exists and legacy secondary admin `ash` is not in the active database. Also updated Phase 5 to authenticate the canonical SuperAdmin rather than creating legacy `admin@citchennai.net`.

---

## 3. Reference Data Loading in Test Isolation
- **Problem:** Tests run in an isolated in-memory PGlite instance (`APP_ENV=test`). Previous in-memory store initialized `quizzes` and `dailyChallenges` to empty arrays, causing quest and lifecycle tests to fail looking for active daily challenges.
- **Solution:** Extracted clean, curated educational challenges and quizzes into `packages/database/src/reference-data.json`. Loaded into in-memory store during `seedInitialData()`. No synthetic users, posts, or voyages are created.
