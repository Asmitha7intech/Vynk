# ADR 003-prisma: Prisma ORM for Data Access and Migrations

## Context
Need end-to-end type safety and automated migration tracking across development and production.

## Decision
Use Prisma ORM as the primary data access layer packaged in @vynk/database.

## Alternatives Considered
TypeORM, MikroORM, raw SQL queries.

## Consequences & Trade-offs
Auto-generated TypeScript types ensure zero runtime type mismatches between schema and queries.
