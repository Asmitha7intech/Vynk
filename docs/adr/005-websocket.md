# ADR 005-websocket: Socket.IO for Real-time Messaging and Presence

## Context
Users require real-time chat delivery, typing status indicators, online presence, and instant notification alerts.

## Decision
Implement Socket.IO on top of Fastify HTTP server with JWT handshake authentication and room-based pub/sub.

## Alternatives Considered
Raw WebSockets (lacks built-in reconnection and room abstraction), Server-Sent Events (unidirectional only).

## Consequences & Trade-offs
Provides automatic reconnects, fallback transport, and clean room management (direct convs, crew channels).
