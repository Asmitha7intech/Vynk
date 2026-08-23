# ADR 008-state-management: Zustand and TanStack Query for Client State

## Context
Client needs separation between server-synced caching (feed, voyages, quests) and local UI states (auth tokens, active modal, chat typing).

## Decision
Use TanStack Query for server state caching and Zustand for lightweight global reactive UI stores.

## Alternatives Considered
Redux Toolkit (heavy boilerplate), React Context (unnecessary re-renders).

## Consequences & Trade-offs
Eliminates boilerplate while providing robust cache invalidation and optimistic updates.
