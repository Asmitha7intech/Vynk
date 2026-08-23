# ADR 004-authentication: Stateless JWT with Rotating Refresh Tokens and RBAC

## Context
Authentication must be secure, stateless for API scalability, and enforce strict role-based access control.

## Decision
Issue short-lived JWT access tokens (15m) and store rotating refresh tokens (7d). Enforce server-side role checks (STUDENT, MENTOR, MODERATOR, ADMIN).

## Alternatives Considered
Pure session cookies, OAuth-only without local fallback.

## Consequences & Trade-offs
Mitigates token theft risk while keeping Fastify route verification non-blocking and fast.
