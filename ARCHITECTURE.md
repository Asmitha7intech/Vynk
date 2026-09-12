# VYNK Architecture Documentation

## 1. System Overview

VYNK is a production-grade student collaboration and discovery platform designed with a clean, modular multi-tier architecture.

```
┌─────────────────────────────────────────────────────────────┐
│                 Frontend Tier (React 19 + Vite)             │
│   • Tailwind CSS v4 + Lucide Icons                          │
│   • Zustand State Stores + React Router DOM v7              │
│   • Fully Responsive, Desktop & Mobile Optimized UI         │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / WSS
┌──────────────────────────────▼──────────────────────────────┐
│                  API Gateway Tier (Fastify v5)              │
│   • Strict Zod Schema Validation & CORS Security            │
│   • Rate Limiting & JWT Access/Refresh Token Auth           │
│   • RBAC Middleware: STUDENT, MENTOR, MODERATOR,            │
│     CAMPUS_ADMIN, VYNK_ADMIN                                │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
┌──────────────▼──────────────┐ ┌──────────────▼──────────────┐
│   Transactional Database    │ │    Cache & Pub/Sub Tier     │
│   PostgreSQL 16 (Prisma)    │ │    Redis 7                  │
│   • Users, Skills, Interests│ │    • Realtime Presence      │
│   • Vynks, Crews, Voyages   │ │    • Rate Limit State       │
│   • Quests & Gamification   │ │    • BullMQ Task Queues     │
└──────────────┬──────────────┘ └──────────────┬──────────────┘
               │                               │
┌──────────────▼───────────────────────────────▼──────────────┐
│                 Big Data & Analytics Tier                   │
│   • MongoDB Telemetry Document Store                        │
│   • HDFS Distributed Log Store (CSV / JSON)                 │
│   • Apache Hive Analytics & Apache Pig ETL Pipeline         │
│   • Real-Time Campus Skill & Collaboration Heatmaps         │
└─────────────────────────────────────────────────────────────┘
```

## 2. Core Modules

1. **Authentication & RBAC**: Email/password authentication with JWT, bcrypt hashing, and multi-tier role permission hierarchy.
2. **Student Graph & Cross-Department Engine**: Graph discovery and complementary skill matching across different academic departments.
3. **Voyages (Project Portfolios)**: Multi-member project showcase with interactive tech stacks, GitHub/demo links, and star counters.
4. **Crews (Squad Builder)**: Squad formation with defined roles, open slot matching, and automated team collaboration agreements.
5. **Gamification & Leaderboard**: XP accrual, 10-tier dynamic student levels, daily streak tracking, and transparent score breakdowns.
6. **Campus Intelligence**: Big Data pipeline aggregating cross-department affinity, skill scarcity, and student retention.
