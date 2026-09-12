# VYNK Security & Governance Specification

## 1. Authentication & Session Management
- **Password Security**: Passwords hashed using bcrypt with work factor 12.
- **Token Lifecycle**: Short-lived JWT Access Tokens (15m) paired with Refresh Tokens (7d).
- **Safe Response Sanitization**: User entity serialization strictly strips `passwordHash` from all API endpoints.

## 2. Role-Based Access Control (RBAC)
- `STUDENT`: Standard builder profile, squad join, voyage publishing.
- `MENTOR`: Student mentorship, office hours, feedback.
- `MODERATOR`: Content moderation, report triaging.
- `CAMPUS_ADMIN`: Institution department configuration, ambassador management.
- `VYNK_ADMIN`: Full global platform analytics, audit logging, system health.

## 3. API Hardening
- **Input Validation**: All payloads validated using strict Zod schemas before hitting business logic.
- **Rate Limiting**: Configured at API gateway level (200 req/min per client).
- **CORS Policy**: Strict origin headers allowing only authorized web clients.
- **Error Shielding**: Database error details suppressed in production responses to prevent information leakage.
