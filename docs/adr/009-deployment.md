# ADR 009-deployment: Containerized Deployment with Docker Compose & Cloud Parity

## Context
Need reproducible local development and cloud deployment parity.

## Decision
Containerize PostgreSQL (pgvector), Redis, Fastify API, and Vite Web with multi-stage Dockerfiles.

## Alternatives Considered
Manual local installations.

## Consequences & Trade-offs
Guarantees identical runtime environment across developer workstations and production.
