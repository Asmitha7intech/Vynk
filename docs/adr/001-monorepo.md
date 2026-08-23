# ADR 001-monorepo: Monorepo Architecture with pnpm Workspaces and Turborepo

## Context
VYNK consists of multiple frontend and backend services sharing common data models, Zod validation schemas, database clients, and configuration.

## Decision
Adopt pnpm workspaces paired with Turborepo. Shared code is centralized in @vynk/types, @vynk/validation, @vynk/database, and @vynk/config.

## Alternatives Considered
Polyrepo approach (rejected due to schema synchronization overhead) or npm/yarn workspaces.

## Consequences & Trade-offs
Enables single-command builds and zero type drift between client and server.
