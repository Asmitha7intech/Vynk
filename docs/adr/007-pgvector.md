# ADR 007-pgvector: pgvector for In-Database Semantic Embedding Search

## Context
Need semantic similarity between student interests, project descriptions, and mentor expertise without introducing external vector database complexity.

## Decision
Use the pgvector extension inside PostgreSQL with HNSW indexing.

## Alternatives Considered
Pinecone, Weaviate, Qdrant.

## Consequences & Trade-offs
Eliminates the cost and operational overhead of external vector databases like Pinecone.
