# VYNK 🚀
> **Find your people. Learn. Build. Rise.**

VYNK is a student-first social ecosystem that unifies social networking, crew (team) formation, project voyages, mentorship, gamified quests (challenges/quizzes), bounties (achievements), XP progression, and AI-powered complementary matchmaking.

---

## 🧭 Core Product Nomenclature

| Term | Concept | Description |
| :--- | :--- | :--- |
| **Vynks** | Connections | Verified mutual connections required to unlock direct 1-to-1 messaging. |
| **Crews** | Teams / Squads | Multi-disciplinary squads formed with signed Team Agreements for hackathons & startups. |
| **Voyages** | Project Portfolios | Rich showcases with code repositories, live demos, and milestone roadmaps. |
| **Quests** | Challenges & Quizzes | Daily technical snippets and weekly timed competitive championships. |
| **Bounties** | Badges & Awards | Verifiable technical and community milestone unlocks. |
| **Growth** | XP & Levels | Dynamic level scaling (Levels 1 *Newcomer* to 10 *Legend*) with leaderboard rankings. |

---

## 🏛️ System Architecture & Monorepo Structure

```text
vynk/
├── apps/
│   ├── web/                    # React 19 + Vite + Tailwind CSS + Framer Motion
│   └── api/                    # Fastify + TypeScript + Prisma + Socket.IO + JWT RBAC
├── packages/
│   ├── types/                  # Canonical TypeScript domain interfaces & DTOs
│   ├── validation/             # Shared Zod validation schemas
│   ├── database/               # Prisma schema, migrations, seed dataset
│   └── config/                 # Shared TypeScript & build configs
├── docs/
│   ├── adr/                    # Architecture Decision Records (001 - 010)
│   └── api/                    # API and Endpoint documentation
├── docker-compose.yml          # Postgres (pgvector), Redis, API, Web services
└── turbo.json                  # Turborepo task pipeline
```

---

## 🧠 AI Complementary Matchmaking Algorithm

VYNK prioritizes **complementary skill coverage** over redundant skills:
$$\text{Compatibility Score} = 0.30 \cdot S_{\text{skills}} + 0.20 \cdot S_{\text{interests}} + 0.15 \cdot S_{\text{role}} + 0.15 \cdot S_{\text{avail}} + 0.10 \cdot S_{\text{exp}} + 0.10 \cdot S_{\text{style}}$$

Every recommendation returns plain-English explainability describing exactly why a candidate completes the squad's missing roles.

---

## 🛠️ Quick Start & Local Development

### Prerequisites
- Node.js >= 20
- pnpm >= 9
- Docker & Docker Compose (for PostgreSQL with pgvector & Redis)

### Installation
```bash
# Clone the repository
git clone https://github.com/vynk/vynk.git
cd vynk

# Install all monorepo dependencies
pnpm install

# Start infrastructure (PostgreSQL with pgvector + Redis)
docker compose up -d postgres redis

# Run database migrations and seed realistic mock campus data
pnpm db:push
pnpm db:seed

# Start the Fastify API and Vite Web dev servers concurrently
pnpm dev
```

The Web application will be live at `http://localhost:3000` and the API at `http://localhost:4000`.

---

## 🧪 Testing & Verification

```bash
# Run unit & integration test suites across all packages
pnpm test

# Typecheck all workspaces
pnpm typecheck

# Production build verification
pnpm build
```

---

## 📜 Architecture Decision Records (ADRs)
Explore `docs/adr/` for in-depth design decisions:
- [001: Monorepo Architecture](docs/adr/001-monorepo.md)
- [002: PostgreSQL 16](docs/adr/002-postgresql.md)
- [003: Prisma ORM](docs/adr/003-prisma.md)
- [004: JWT & RBAC](docs/adr/004-authentication.md)
- [005: Socket.IO Real-time](docs/adr/005-websocket.md)
- [006: AI Matching Engine](docs/adr/006-ai-recommendation.md)
- [007: pgvector Embeddings](docs/adr/007-pgvector.md)
- [008: Zustand & TanStack Query](docs/adr/008-state-management.md)
- [009: Containerization](docs/adr/009-deployment.md)
- [010: Messaging Safety Rules](docs/adr/010-messaging-security.md)

---

## 🛡️ License
MIT © 2026 VYNK Team.
