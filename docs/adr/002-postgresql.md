# ADR 002-postgresql: PostgreSQL as Primary Relational Database

## Context
VYNK requires strong transactional guarantees for XP transactions, level updates, and complex relational graphs (Users, Vynks, Crews, Voyages, Quests).

## Decision
Select PostgreSQL 16 as the primary persistent data store.

## Alternatives Considered
MongoDB/NoSQL (rejected due to lack of multi-entity relational integrity for financial/XP ledgers).

## Consequences & Trade-offs
Provides ACID compliance, complex relational indexing, and extension support for vector search.
